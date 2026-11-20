#!/bin/bash
# Run as root after unpacking source. Does not change any FDEOpen configuration.
set -euo pipefail
release=$(cd "$(dirname "$0")/.." && pwd)
shared=/opt/fdeclub/shared
id fdeclub >/dev/null 2>&1 || useradd --system --home-dir /opt/fdeclub --shell /usr/sbin/nologin fdeclub
install -d -m 750 -o root -g fdeclub "$shared"
if [ ! -f "$shared/app.env" ]; then node "$release/deploy/generate-env.mjs" "$shared"; fi
chown root:fdeclub "$shared/app.env"
cp "$release/deploy/compose.yml" "$release/deploy/init-db.sh" "$release/deploy/backup.sh" "$release/deploy/maintenance.mjs" "$shared/"
cd "$shared"
docker compose up -d db auth rest
for i in $(seq 1 60); do
  if curl -fsS http://127.0.0.1:8018/health >/dev/null; then break; fi
  sleep 2
done
curl -fsS http://127.0.0.1:8018/health >/dev/null
# Application migrations are transactional and recorded once.
docker compose exec -T db psql -U postgres -d fdeclub -v ON_ERROR_STOP=1 <<'SQL'
create or replace function auth.uid() returns uuid language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'sub')::uuid
$$;
grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
create schema if not exists deployment;
create table if not exists deployment.migrations(name text primary key, applied_at timestamptz default now());
SQL
for migration in "$release"/supabase/migrations/*.sql "$release"/supabase/seed.sql; do
  name=$(basename "$migration")
  applied=$(docker compose exec -T db psql -U postgres -d fdeclub -Atc "select count(*) from deployment.migrations where name='$name'")
  if [ "$applied" = 0 ]; then
    { echo 'begin;'; sed '/^[[:space:]]*begin;[[:space:]]*$/Id; /^[[:space:]]*commit;[[:space:]]*$/Id' "$migration"; echo "insert into deployment.migrations(name) values('$name'); commit;"; } | docker compose exec -T db psql -U postgres -d fdeclub -v ON_ERROR_STOP=1
  fi
done
docker compose exec -T db psql -U postgres -d fdeclub -c "notify pgrst,'reload schema';"
cp "$release/deploy/nginx-internal.conf" /etc/nginx/conf.d/fdeclub-internal.conf
nginx -t && systemctl reload nginx
cp "$shared/app.env" "$release/.env.production"
chown -R fdeclub:fdeclub "$release"
chmod 600 "$release/.env.production"
cd "$release"
runuser -u fdeclub -- env npm_config_cache="$release/.npm-cache" npm ci --no-audit --no-fund
runuser -u fdeclub -- env NODE_OPTIONS=--max-old-space-size=1536 npm run build
cp -a public .next/standalone/
cp -a .next/static .next/standalone/.next/
# Next standalone may copy build-time env files. Keep secrets only in shared config.
rm -f .next/standalone/.env.production .env.production
chown -R fdeclub:fdeclub .next
ln -sfn "$release" /opt/fdeclub/current
cp deploy/fdeclub.service /etc/systemd/system/fdeclub.service
systemctl daemon-reload
systemctl enable --now fdeclub
systemctl restart fdeclub
for i in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:3216/api/health; then break; fi
  sleep 2
done
curl -fsS http://127.0.0.1:3216/api/health
install -d -m 755 /var/www/fdeclub-acme
cp deploy/nginx-public-http.conf /etc/nginx/conf.d/fdeclub.conf
nginx -t && systemctl reload nginx
cp deploy/fdeclub.cron /etc/cron.d/fdeclub
chmod 644 /etc/cron.d/fdeclub
"$shared/backup.sh"
echo 'FDEClub installed on localhost:3216; ready for DNS and TLS.'
