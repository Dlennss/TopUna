#!/usr/bin/python3
"""Activate fixed TopUna staging paths; roll back both units if health checks fail."""
import os
from pathlib import Path
import re
import shutil
import subprocess
import time
import urllib.request

BASE = Path('/home/mitra-p24/hit/Topuna/.deploy')
STAGE = BASE / 'staging'
SYSTEMD = Path('/etc/systemd/system')

def run(*args):
    subprocess.run(args, check=True)

def fetch(url):
    with urllib.request.build_opener(urllib.request.ProxyHandler({})).open(url, timeout=5) as r:
        return r.read().decode()

def validate_backend(binary):
    with binary.open('rb') as source:
        header = source.read(20)
    if header[:6] != b'\x7fELF\x02\x01' or header[18:20] != b'\x3e\x00':
        raise SystemExit('Backend must be Linux amd64 (64-bit little-endian ELF)')


def activate():
    commit = (STAGE / 'frontend/DEPLOY_COMMIT').read_text().strip()
    if not re.fullmatch('[0-9a-f]{40}', commit):
        raise SystemExit('Invalid release commit')
    for name in ['server.js', '.next/BUILD_ID', 'public/deploy-version.txt', 'public/topuna-assets/Topuna_Assets_Pecah/09_section_blocks/top_header_stack.png']:
        if not (STAGE / 'frontend' / name).is_file():
            raise SystemExit('Incomplete frontend: ' + name)
    if (STAGE / 'frontend/public/deploy-version.txt').read_text().strip() != commit:
        raise SystemExit('Frontend version does not match release commit')
    if (STAGE / 'backend/DEPLOY_COMMIT').read_text().strip() != commit:
        raise SystemExit('Backend and frontend commits do not match')
    binary = STAGE / 'backend/topuna-api'
    validate_backend(binary)
    (BASE / 'releases').mkdir(mode=0o755, parents=True, exist_ok=True)
    release = BASE / 'releases' / ('ci-' + commit[:12] + '-' + str(time.time_ns()))
    release.mkdir(mode=0o755)
    frontend = release / 'frontend'
    shutil.copytree(STAGE / 'frontend', frontend, symlinks=True,
                    ignore=shutil.ignore_patterns('.env', '.env.*'))
    shutil.copyfile(binary, release / 'topuna-api')
    os.chmod(release / 'topuna-api', 0o755)
    (frontend / '.next/cache').mkdir(exist_ok=True)
    units = {
        'topuna-web': (
            '[Service]\nWorkingDirectory=' + str(frontend)
            + '\nExecStart=\nExecStart=/usr/local/bin/node server.js'
            + '\nEnvironmentFile=/etc/topuna/frontend.env'
            + '\nEnvironment=NODE_ENV=production HOSTNAME=127.0.0.1 PORT=3103'
            + '\nCacheDirectory=topuna-fe\nBindPaths=\nBindPaths=/var/cache/topuna-fe:'
            + str(frontend / '.next/cache') + '\n'
        ),
        'topuna-be': (
            '[Service]\nWorkingDirectory=/var/lib/topuna'
            + '\nEnvironmentFile=/etc/topuna/backend.env'
            + '\nEnvironment=HOST=127.0.0.1 PORT=8103'
            + '\nExecStart=\nExecStart=' + str(release / 'topuna-api') + '\n'
        ),
    }
    previous = {}
    was_active = {
        unit: subprocess.run(['systemctl', 'is-active', '--quiet', unit]).returncode == 0
        for unit in units
    }
    try:
        for unit, content in units.items():
            dropin = SYSTEMD / (unit + '.service.d/release.conf')
            previous[dropin] = dropin.read_bytes() if dropin.exists() else None
            dropin.parent.mkdir(exist_ok=True)
            dropin.write_text(content)
        run('systemctl', 'daemon-reload')
        run('systemctl', 'restart', 'topuna-be', 'topuna-web')
        for attempt in range(30):
            try:
                fetch('http://127.0.0.1:8103/health')
                actual = fetch('http://127.0.0.1:3103/deploy-version.txt').strip()
                fetch('http://127.0.0.1:3103/')
                if actual == commit:
                    print('TopUna active: ' + commit, flush=True)
                    break
            except Exception:
                pass
            time.sleep(2)
        else:
            raise RuntimeError('TopUna health/release verification failed')
    except Exception:
        for dropin, old in previous.items():
            if old is None:
                dropin.unlink(missing_ok=True)
            else:
                dropin.write_bytes(old)
        run('systemctl', 'daemon-reload')
        for unit, active in was_active.items():
            run('systemctl', 'restart' if active else 'stop', unit)
        raise


def main():
    import fcntl

    with open('/run/lock/topuna-deploy.lock', 'w') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        activate()


if __name__ == '__main__':
    main()
