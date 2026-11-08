#!/usr/bin/env python3
"""One-time fresh installation; never drops or replaces an existing database."""
import os
from pathlib import Path
import secrets
import subprocess


ROOT = Path(__file__).resolve().parents[1]
ENV_DIR = Path('/etc/topuna')
DATABASE = 'topuna'
ROLE = 'topuna_app'


def postgres(query):
    result = subprocess.run(
        ['runuser', '-u', 'postgres', '--', 'psql', '-X', '-qAt',
         '-v', 'ON_ERROR_STOP=1', '-d', 'postgres'],
        input=query, text=True, capture_output=True, check=True,
    )
    return result.stdout.strip()


def write_env(path, values):
    for value in values.values():
        if any(c in value for c in '\r\n\x00'):
            raise ValueError('Invalid environment value')
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'w') as output:
        for key, value in values.items():
            output.write(key + '=' + value + '\n')


def main():
    if os.geteuid() != 0:
        raise SystemExit('Run as root on the new Topuna server.')
    if any((ENV_DIR / name).exists() for name in ['backend.env', 'frontend.env']):
        raise SystemExit('Existing runtime configuration found; refusing to overwrite it.')
    if postgres("SELECT 1 FROM pg_database WHERE datname = 'topuna'"):
        raise SystemExit('Database topuna already exists; refusing to replace it.')
    if postgres("SELECT 1 FROM pg_roles WHERE rolname = 'topuna_app'"):
        raise SystemExit('Role topuna_app already exists; refusing to change its credentials.')

    password = secrets.token_hex(32)
    admin_token = secrets.token_hex(32)
    auth_secret = secrets.token_hex(32)
    backend = {
        'DATABASE_URL': f'postgres://{ROLE}:{password}@127.0.0.1:5432/{DATABASE}?sslmode=disable',
        'HOST': '127.0.0.1', 'PORT': '8103',
        'CORS_ORIGINS': 'https://topuna.com',
        'JWT_SECRET': secrets.token_hex(32), 'ADMIN_TOKEN': admin_token,
        'LEGACY_DEPOSIT_BANK_ENABLED': 'false', 'DEPOSIT_AUTO_APPROVE_ENABLED': 'false',
        'PULSA24JAM_BASE_URL': 'https://api.pulsa24jam.net/v2/trx',
        'PULSA24JAM_MEMBERID': '', 'PULSA24JAM_API_KEY': '', 'PULSA24JAM_PIN': '',
        'PULSA24JAM_CALLBACK_TOKEN': secrets.token_hex(32),
        'PULSA24JAM_TIMEOUT': '30s', 'PULSA24JAM_PRODUCT_SYNC_INTERVAL': '15m',
    }
    frontend = {
        'NODE_ENV': 'production', 'HOSTNAME': '127.0.0.1', 'PORT': '3103',
        'API_BASE': 'http://127.0.0.1:8103', 'NEXTAUTH_URL': 'https://topuna.com',
        'NEXT_PUBLIC_SITE_URL': 'https://topuna.com',
        'NEXTAUTH_SECRET': auth_secret, 'AUTH_SECRET': auth_secret,
        'ADMIN_TOKEN': admin_token, 'GOOGLE_LOGIN_ENABLED': 'false',
        'NEXT_PUBLIC_TURNSTILE_ENABLED': 'false', 'NEXT_TELEMETRY_DISABLED': '1',
    }
    ENV_DIR.mkdir(mode=0o700, exist_ok=True)
    os.chmod(ENV_DIR, 0o700)
    # Persist recoverable credentials before database creation; never log them.
    write_env(ENV_DIR / 'backend.env', backend)
    write_env(ENV_DIR / 'frontend.env', frontend)
    postgres(f"CREATE ROLE {ROLE} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION PASSWORD '{password}'")
    postgres(f'CREATE DATABASE {DATABASE} OWNER {ROLE}')
    postgres(f'REVOKE ALL ON DATABASE {DATABASE} FROM PUBLIC')
    subprocess.run(
        ['psql', '-X', '-q', '-v', 'ON_ERROR_STOP=1', '-h', '127.0.0.1',
         '-U', ROLE, '-d', DATABASE, '-f', str(ROOT / 'ops/topuna-fresh.sql')],
        env={**os.environ, 'PGPASSWORD': password, 'PGOPTIONS': '-c client_min_messages=warning'},
        check=True,
    )
    print('Fresh Topuna database initialized. Runtime files are root-only. No accounts or balances were seeded.')
    print('Provider payments and Google login remain unconfigured; configure their own credentials before use.')


if __name__ == '__main__':
    main()
