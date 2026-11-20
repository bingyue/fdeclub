#!/bin/bash
# Update an existing Shanghai installation without replacing TLS or backend configuration.
# Run as root from a new /opt/fdeclub/releases/<release> directory.
set -euo pipefail
release=$(cd "$(dirname "$0")/.." && pwd)
shared=/opt/fdeclub/shared
previous=$(readlink -f /opt/fdeclub/current)
staging_port=3219
staging_started=0
switched=0
next_link="/opt/fdeclub/.current-update-$$"

[[ $EUID -eq 0 ]] || { echo 'Run this release update as root.' >&2; exit 1; }
[[ "$release" == /opt/fdeclub/releases/* && "$release" != "$previous" ]]
[[ -f "$shared/app.env" && -f "$previous/.next/standalone/server.js" ]]
exec 9>"$shared/deploy.lock"
flock -n 9 || { echo 'Another FDEClub deployment is running.' >&2; exit 1; }

healthy() {
  local port=$1
  for attempt in $(seq 1 30); do
    if curl --silent --fail --max-time 5 "http://127.0.0.1:$port/api/health" | /usr/bin/node -e '
      let s="";process.stdin.on("data",c=>s+=c);process.stdin.on("end",()=>{
        try{if(JSON.parse(s).status!=="ok")process.exit(1)}catch{process.exit(1)}
      });'; then return 0; fi
    sleep 2
  done
  return 1
}

cleanup() {
  local status=$?
  trap - EXIT
  if [[ "$staging_started" == 1 ]]; then systemctl stop fdeclub-staging >/dev/null 2>&1 || true; fi
  [[ ! -f "$release/.env.production" ]] || unlink "$release/.env.production"
  [[ ! -f "$release/.next/standalone/.env.production" ]] || unlink "$release/.next/standalone/.env.production"
  [[ ! -L "$next_link" ]] || unlink "$next_link"
  if [[ "$status" != 0 && "$switched" == 1 ]]; then
    echo 'Validation failed. Restoring the previous application release.' >&2
    ln -s "$previous" "$next_link"
    mv -Tf "$next_link" /opt/fdeclub/current
    systemctl restart fdeclub
    healthy 3216 || echo 'Rollback health check requires operator attention.' >&2
  fi
  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# This release has no schema changes. Refuse unreviewed database changes.
diff -qr "$previous/supabase/migrations" "$release/supabase/migrations"
cmp "$previous/supabase/seed.sql" "$release/supabase/seed.sql"
healthy 3216
if ss -ltnH "sport = :$staging_port" | grep -q .; then
  echo "Staging port $staging_port is already in use." >&2; exit 1
fi
if systemctl is-active --quiet fdeclub-staging; then
  echo 'An FDEClub staging service is already running.' >&2; exit 1
fi
bash "$shared/backup.sh"

cp "$shared/app.env" "$release/.env.production"
chown -R fdeclub:fdeclub "$release"
chmod 600 "$release/.env.production"
cd "$release"
runuser -u fdeclub -- env npm_config_cache="$release/.npm-cache" npm ci --no-audit --no-fund
runuser -u fdeclub -- env NODE_OPTIONS=--max-old-space-size=1536 npm run build
cp -a public .next/standalone/
cp -a .next/static .next/standalone/.next/
[[ ! -f .next/standalone/.env.production ]] || unlink .next/standalone/.env.production
unlink .env.production
chown -R fdeclub:fdeclub .next

systemd-run --unit=fdeclub-staging --collect \
  --property=User=fdeclub --property=Group=fdeclub \
  --property="WorkingDirectory=$release/.next/standalone" \
  --property="EnvironmentFile=$shared/app.env" \
  --property=NoNewPrivileges=yes --property=MemoryMax=768M \
  --setenv=NODE_ENV=production --setenv=HOSTNAME=127.0.0.1 \
  --setenv="PORT=$staging_port" /usr/bin/node server.js
staging_started=1
healthy "$staging_port"
curl --silent --show-error --fail --max-time 15 "http://127.0.0.1:$staging_port/book" | /usr/bin/node -e '
  let s="";process.stdin.on("data",c=>s+=c);process.stdin.on("end",()=>{
    if(!s.includes("9787302729556")||!s.includes("邴越"))process.exit(1)
  });'

ln -s "$release" "$next_link"
switched=1
mv -Tf "$next_link" /opt/fdeclub/current
systemctl restart fdeclub
healthy 3216
for path in / /book /about /cities /enterprise /partners /events /login /sitemap.xml; do
  curl --silent --show-error --fail --max-time 15 "http://127.0.0.1:3216$path" -o /dev/null
done
printf 'FDEClub release active: %s\nRollback target: %s\n' "$release" "$previous"
