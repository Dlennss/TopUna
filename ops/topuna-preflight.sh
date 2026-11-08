#!/usr/bin/env bash
set -euo pipefail

report() { printf '::error title=Topuna server setup::%s\n' "$*" >&2; }
fail() { report "$*"; exit 1; }
root=/home/mitra-p24/hit/Topuna
[[ $(id -u) = 0 ]] || fail 'SSH user must be root.'
[[ $(uname -m) = x86_64 ]] || fail 'Expected the new x86_64 server.'
[[ -d "$root" ]] || fail "Missing application directory: $root"
[[ $(realpath -m "$root/.deploy/staging") = "$root/.deploy/staging" ]] || fail 'Deployment path must not be a symlink.'
for command in python3 rsync systemctl node; do
  command -v "$command" >/dev/null || fail "Missing command: $command"
done
/usr/local/bin/node -e 'if (Number(process.versions.node.split(".")[0]) !== 24) process.exit(1)' || fail 'Install Node.js 24 at /usr/local/bin/node to match the build runner.'

missing=0
for file in /etc/topuna/backend.env /etc/topuna/frontend.env; do
  if [[ ! -s "$file" ]]; then
    report "Missing runtime configuration $file. Supply the production configuration; do not use an empty file or .env.example."
    missing=1
  fi
done
for service in topuna-be topuna-web; do
  if [[ $(systemctl show "$service" -p LoadState --value) != loaded ]]; then
    report "Missing systemd service $service. Complete the one-time service setup in ops/DEPLOY.md."
    missing=1
  fi
done
[[ $missing = 0 ]] || fail 'Complete the one-time server setup in ops/DEPLOY.md before deploying.'
echo 'Topuna server preflight passed.'
