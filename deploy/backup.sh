#!/bin/bash
set -euo pipefail
umask 077
mkdir -p /opt/fdeclub/backups
stamp=$(date -u +%Y%m%dT%H%M%SZ)
docker compose --project-directory /opt/fdeclub/shared -f /opt/fdeclub/shared/compose.yml exec -T db pg_dump -U postgres -d fdeclub -Fc > "/opt/fdeclub/backups/${stamp}.dump.tmp"
mv "/opt/fdeclub/backups/${stamp}.dump.tmp" "/opt/fdeclub/backups/${stamp}.dump"
find /opt/fdeclub/backups -name '*.dump' -mtime +7 -delete
