# TopUna deployment

GitHub Actions builds Linux ARM64 artifacts and uploads using SERVER_HOST,
SERVER_PORT, SERVER_USER and SERVER_PASSWORD secrets. Source folders are
pulsa-fe and pulsa-be relative to the checkout, not absolute server paths.

The syslog-ng SSH account has home /var/lib/syslog-ng, which is root-owned.
The server administrator must provision only ~/topuna and its frontend and
pulsa-be subdirectories with ownership syslog-ng:syslog-ng and mode 0755.
Do not change ownership of the entire home or shared application directory.

Staging:
- ~/topuna/frontend
- ~/topuna/pulsa-be/topuna-api

Install ops/topuna-activate.py as root-owned mode 0755
/usr/local/sbin/topuna-activate. Allow syslog-ng to run only this no-argument
command with passwordless sudo. The helper expects the existing topuna-fe and
topuna-be systemd units and their separate server-owned environment files.
It snapshots both artifacts into deployment/topuna/releases, switches only
these two services, and rolls back if local health/version checks fail.
The deployment job also verifies the exact commit through the public domain.

Frontend listens on 172.22.0.1:33029; backend on 127.0.0.1:8103.
Nginx Proxy Manager routes topuna.com to the frontend. Production environment
files stay under /var/lib/syslog-ng/fadlanpulsa/deployment/topuna; never upload
or commit them. Do not point another application's deployment at these paths.

Deploy runs from main on push or workflow_dispatch. Directory settings are fixed
in the workflow to isolate TopUna; old path secrets and PM2 secrets are unused.
The server does not run git fetch or build in the live source checkout.
