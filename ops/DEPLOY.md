# Deploy Topuna ke server baru

Target: `root@103.31.39.97:22`, aplikasi di
`/home/mitra-p24/hit/Topuna`. Workflow menolak host/user/port lain agar secrets
lama tidak membuat deploy kembali ke server sebelumnya.

## GitHub Actions secrets

Atur di Settings > Secrets and variables > Actions. Periksa juga secrets pada
Environment `production`: nilai di environment mengalahkan repository secrets.

| Secret | Nilai |
| --- | --- |
| `SERVER_HOST` | `103.31.39.97` |
| `SERVER_PORT` | `22` |
| `SERVER_USER` | `root` |
| `SERVER_PASSWORD` | Password SSH server **baru**, hanya jika memakai autentikasi password |
| `SERVER_SSH_KEY` | Opsional: private key khusus deploy; public key harus terpasang pada akun root server baru. Jika diisi, key diprioritaskan daripada password |
| `SERVER_KNOWN_HOSTS` | Opsional: override baris known_hosts yang sudah diverifikasi. Jika kosong, workflow memakai `ops/ssh/known_hosts` |

`BACKEND_SOURCE_DIR` dan `FRONTEND_RELEASE_DIR` pada screenshot lama **tidak
dipakai lagi**. Boleh dihapus dari GitHub secrets. Folder source dan staging
ditentukan di workflow; jangan mengisinya dengan path server lama.

Public host key server sudah dipin di `ops/ssh/known_hosts`, diverifikasi pada
8 November 2026 melalui koneksi SSH lokal dengan `StrictHostKeyChecking=yes`.
Ini public key identitas server, bukan private key atau kredensial login.
Secret `SERVER_KNOWN_HOSTS` tidak perlu ditambahkan untuk server ini.

Jika server diinstal ulang atau host key dirotasi, ambil host public key melalui
koneksi SSH yang sudah dipercaya atau console VPS:

```sh
ssh root@103.31.39.97 'cat /etc/ssh/ssh_host_ed25519_key.pub'
```

Perbarui `ops/ssh/known_hosts` atau isi override `SERVER_KNOWN_HOSTS` dengan
`103.31.39.97`, spasi, lalu jenis dan nilai public
key tersebut, misalnya `103.31.39.97 ssh-ed25519 AAAA...`. Verifikasi fingerprint
melalui console VPS bila server belum dipercaya. Workflow tidak menonaktifkan
host-key checking dan tidak mengambil key secara buta saat deploy.

## Persiapan sekali di server

Pemeriksaan ulang pada 8 November 2026 menemukan frontend `topuna-web.service` sudah
aktif di port 3103. Backend `topuna-be.service` dan `/etc/topuna` belum tersedia.
Workflow sengaja berhenti pada preflight sampai prasyarat ini lengkap; upload
source saja belum berarti backend, akun, saldo, atau transaksi sudah dipindah.

Kegagalan run `42443227258` terjadi sebelum build karena validasi mewajibkan
`SERVER_KNOWN_HOSTS`. Fallback public key di atas mengatasi kegagalan tersebut;
preflight tetap menolak aktivasi jika runtime env atau layanan backend belum ada.

Prasyarat: Linux x86_64, Node.js 24 pada `/usr/local/bin/node`, Python 3, rsync,
systemd. Build dilakukan di runner GitHub, bukan di server aplikasi.

1. Siapkan database Topuna yang benar dan backup sebelum perpindahan. Tentukan
   apakah database lama dipindahkan atau instalasi terpisah. Jangan membuat
   saldo contoh atau menjalankan seluruh SQL historis untuk mengisi database.
2. Sediakan `/etc/topuna/backend.env` dan `/etc/topuna/frontend.env`, pemilik
   root, permission `0600`, direktori `0700`. Tidak boleh dikomit atau diunggah
   sebagai artefak. Format `KEY=value` tanpa `export`, quote nilai jika perlu;
   backend.env harus bisa dibaca bash dan systemd. Gunakan secrets runtime asli
   dengan konfigurasi provider milik instalasi ini, bukan placeholder.
3. Backend membutuhkan `DATABASE_URL`, secrets autentikasi/provider sesuai
   `pulsa-be/.env.example`, `HOST=127.0.0.1`, `PORT=8103`, dan CORS origin publik.
   Frontend membutuhkan `NODE_ENV=production`, `HOSTNAME=127.0.0.1`, `PORT=3103`,
   `API_BASE=http://127.0.0.1:8103`, `NEXTAUTH_URL=https://topuna.com`,
   `NEXTAUTH_SECRET` dan konfigurasi login lainnya sesuai instalasi.
   Jangan biarkan `PORT`/`HOST` dalam env menunjuk port/alamat lama.
4. Buat akun layanan backend dan pasang unit dari repo ini (dijalankan sebagai
   root, hanya setelah file ops terbaru tersedia di server):

   ```sh
   getent passwd topuna >/dev/null || useradd --system --user-group --home-dir /var/lib/topuna --shell /usr/sbin/nologin topuna
   chgrp topuna /home/mitra-p24/hit/Topuna
   chmod 0750 /home/mitra-p24/hit/Topuna
   install -d -o topuna -g topuna -m 0750 /var/lib/topuna
   install -m 0644 /home/mitra-p24/hit/Topuna/ops/topuna-be.service /etc/systemd/system/topuna-be.service
   systemctl daemon-reload
   systemctl enable topuna-be topuna-web
   ```

   Jangan start backend sebelum aktivasi pertama: `ExecStart` unit dasar adalah
   placeholder yang diganti helper dengan binary rilis. Pertahankan layanan
   frontend `topuna-web` yang sudah ada; jangan membuat `topuna-fe` kedua.
   File upload/log backend persisten di `/var/lib/topuna`, bukan folder rilis.
   Pindahkan juga upload lama jika melakukan migrasi penuh.
5. Jalankan `bash ops/topuna-preflight.sh` di server. Atur reverse proxy untuk
   `topuna.com` menuju `127.0.0.1:3103` (bila nginx di host yang sama). API tetap
   internal pada 8103. Pertahankan routing callback/provider yang diperlukan.
   Proxy dalam container perlu jaringan yang sesuai, bukan loopback container.
   Alihkan DNS saat data dan layanan siap; jangan mengubah aplikasi tetangga.

## Alur deploy

Push ke `main` atau Actions > Deploy > Run workflow. Workflow:

- Memvalidasi target, SSH host key dan kesiapan konfigurasi/layanan server.
- Menguji dan membangun backend **Linux amd64**, frontend standalone dengan
  Node.js 24, lalu memberi keduanya penanda commit yang sama.
- Mengunggah hanya ke `/home/mitra-p24/hit/Topuna/.deploy/staging`.
  `rsync --delete` dibatasi ke staging, tidak ke source, runtime env, atau upload.
- Mengimpor snapshot H2HR lengkap melalui
  `20261108_refresh_pulsa24jam_h2hr_catalog.sql`. Migrasi heuristik lama yang
  mengganti label H2H atau menebak nominal tidak dijalankan lagi. Database harus
  sudah memiliki schema. Migrasi tercatat dilewati, bukan dipaksa ulang.
- Menjalankan helper aktivasi **dari artefak rilis yang sama**, bukan helper
  ARM64 lama di `/usr/local/sbin`. Rilis disalin ke `.deploy/releases/ci-*`.
- Mengubah drop-in hanya untuk `topuna-be` dan `topuna-web`. Mengecek backend
  `/health`, frontend `/`, dan kesamaan commit pada `/deploy-version.txt`.
  Jika aktivasi gagal, konfigurasi sebelumnya dikembalikan; layanan yang tadinya
  belum aktif dihentikan lagi. Database tidak ikut di-rollback.
- Mengecek commit dari `https://topuna.com/deploy-version.txt`. Kegagalan tahap
  ini tidak otomatis rollback rilis lokal: periksa DNS/proxy/cache domain.

Rilis terdahulu dipertahankan untuk pemulihan. Pantau ruang disk dan hapus hanya
rilis yang sudah dipastikan tidak dirujuk drop-in aktif maupun backup pemulihan.
Tidak ada transaksi berbayar atau perubahan saldo otomatis untuk uji deploy.
