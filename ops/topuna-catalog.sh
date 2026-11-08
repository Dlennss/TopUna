#!/usr/bin/env bash
set -euo pipefail

case "${1:-}" in
  before|after) ;;
  *) echo 'Usage: topuna-catalog.sh before|after' >&2; exit 1 ;;
esac
cd /home/mitra-p24/hit/Topuna/.deploy/staging/backend
set -a
# This root-owned file must be compatible with both bash and systemd EnvironmentFile.
source /etc/topuna/backend.env
set +a
: "${DATABASE_URL:?DATABASE_URL is missing from /etc/topuna/backend.env}"
chmod +x ./apply-sql-migration

# The verified snapshot supersedes heuristic renaming/nominal migrations.
# apply-sql-migration skips this on the after phase once it is recorded.
./apply-sql-migration sql/20261108_refresh_pulsa24jam_h2hr_catalog.sql
