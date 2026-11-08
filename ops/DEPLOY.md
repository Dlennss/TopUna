# Deploy Topuna ke server baru

Target: `root@103.31.39.97:22`, aplikasi di
`/home/mitra-p24/hit/Topuna`. Host, user, dan port ditetapkan langsung di
`.github/workflows/deploy.yml`, bukan dibaca dari secrets. Workflow tetap
menolak target lain. Secrets target lama tidak dapat mengarahkan deploy kembali
ke server sebelumnya atau menghentikan validasi target baru.

## GitHub Actions secrets

Atur di Settings > Secrets and variables > Actions. Periksa juga secrets pada
Environment `production`: nilai di environment mengalahkan repository secrets.

| Secret | Nilai |
| --- | --- |
| `SERVER_SSH_KEY` | Wajib: private key OpenSSH khusus deploy tanpa passphrase; public key harus terpasang pada akun root server baru |
| `SERVER_KNOWN_HOSTS` | Opsional: override baris known_hosts yang sudah diverifikasi. Jika kosong, workflow memakai `ops/ssh/known_hosts` |

`SERVER_PASSWORD`, `SERVER_HOST`, `SERVER_PORT`, `SERVER_USER`, `BACKEND_SOURCE_DIR`, dan
`FRONTEND_RELEASE_DIR` pada screenshot lama **tidak dipakai lagi**. Boleh
dihapus dari repository maupun environment secrets. Target, folder source,
dan staging ditentukan di workflow.

Server baru hanya menerima public-key authentication (`PasswordAuthentication
no`, `PermitRootLogin prohibit-password`, `AuthenticationMethods publickey`).
Password tidak dapat digunakan untuk deploy. Pada 8 November 2026, key khusus
GitHub Actions dipasang di server dengan opsi `restrict` (tanpa PTY dan
forwarding), dan private key disimpan terenkripsi sebagai `SERVER_SSH_KEY`
pada environment `production`. Key pribadi komputer pengembang tidak diunggah.
Jangan memasukkan private key ke dalam workflow atau repository.

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

Pada 8 November 2026, frontend `topuna-web.service` tetap aktif di port 3103.
Unit `topuna-be.service`, akun layanan `topuna`, `/var/lib/topuna`, dan direktori
`/etc/topuna` sudah disiapkan. Pengguna kemudian memilih database baru dan
menegaskan tidak meminta penghapusan database lama. Database PostgreSQL `topuna`
dibuat dengan role `topuna_app` (bukan superuser), memakai kredensial baru.
`backend.env` dan `frontend.env` tersedia dengan permission `0600`, root-only.
Preflight lulus dan smoke test backend pada database baru mengembalikan HTTP 200
untuk health, kategori, dan produk. Rilis utama kemudian aktif melalui Deploy
#57, commit `6a6998088b38170c2e9db43da4c31999d5fbfa49`.

Database awal berisi 15.296 produk H2HR, tanpa akun, saldo, rekening, atau
transaksi contoh. Akun tester kemudian dibuat sesuai permintaan pemilik;
pengisian saldo tester adalah kredit internal, bukan transfer saldo provider.
Database aplikasi lain tidak diubah atau dihapus. Tidak ada data yang diambil
dari server lama. Pada 8 November 2026, kredensial P24 dipasang di
`/etc/topuna/backend.env` setelah pemeriksaan katalog read-only berhasil.
Backend direstart dan validasi katalog asli `GOPAY` melalui jalur checkout
lulus: `OPEN_AMOUNT`, biaya provider Rp1.200 saat diperiksa. Ini bukan bukti
transaksi berbayar berhasil; tidak ada order atau pembayaran dikirim dalam
pemeriksaan tersebut. Google login masih belum dikonfigurasi.
`LEGACY_DEPOSIT_BANK_ENABLED=false` mencegah rekening hardcoded PulsaKilat
ditanam otomatis. Push perubahan backend ini sebelum deploy berikutnya;
jangan menjalankan ulang commit lama yang belum mendukung flag tersebut.
Backup awal tersedia di `/var/backups/topuna/initial-20261108.dump` (root-only).
Backend smoke test memakai port sementara 18103 dan sudah dihentikan; hasil
smoke test awal bukan bukti aktivasi; rilis utama diverifikasi terpisah.

Diagnostik katalog read-only tersedia melalui
`TestH2HRLiveCatalogReadOnly` di `pulsa-be/internal/service`. Test dilewati
secara default. Jalankan hanya dengan environment backend yang sudah tersedia
dan `TOPUNA_P24_READ_ONLY_TEST=1`; jangan menaruh kredensial di source atau
output log. Test hanya membaca `PRODUK`, tidak membuat atau membayar order.

## Hotfix checkout 8 November 2026

Frontend aktif memakai penanda publik
`6a6998088b38170c2e9db43da4c31999d5fbfa49-checkout-1794125169697165505`.
Rilis berada di `.deploy/releases/<penanda>/frontend`. Metadata, diff source,
dan salinan konfigurasi unit sebelumnya ada di direktori induk rilis.
Backend dan database tidak diganti saat aktivasi frontend ini.

Build Linux memakai `npm run build -- --webpack`, dengan pemeriksaan tipe
tetap aktif. Tiga route dashboard lama disesuaikan dengan kontrak PageProps
Next.js: history admin menunggu `searchParams`, sedangkan halaman deposit
operator/wallet membungkus komponen bersama tanpa mengekspor props khusus
sebagai props route. Lint, pemeriksaan tipe lengkap, dan build lulus.

Smoke test pada port sementara 3105 lulus dan unit sementara sudah dihentikan.
Penanda rilis diverifikasi melalui `https://topuna.com/deploy-version.txt`.
Pengujian browser pada domain publik mencakup login tester, saldo, checkout
GoPay, dan layar 320x740, 390x844, 1440x900, serta 390x480. Saldo tester tetap
Rp62.265; nominal Rp20.000 ditambah biaya Rp1.200 menghasilkan Rp21.200.
Tidak ada order/pembayaran dikirim dalam pengujian; jumlah order tetap nol
saat pemeriksaan terakhir. Keberhasilan transaksi provider berbayar belum diuji.

Hotfix ini diaktifkan langsung dari perubahan source lokal, belum melalui
commit/push baru. Sertakan perubahan source tersebut dalam commit berikutnya
sebelum menjalankan deploy CI lagi, agar tampilan tidak kembali ke versi lama.

## Inisialisasi Berikutnya

Untuk instalasi kosong berikutnya, setelah unit server disiapkan dan source
lengkap tersedia, jalankan `sudo python3 ops/topuna-init-database.py` dari repo.
Script hanya mendukung database baru `topuna`, menolak database/role/env yang
sudah ada, dan tidak pernah menjalankan DROP DATABASE. Skema diuji melalui
`ops/topuna-fresh.sql` dan CI. Jika inisialisasi terhenti, periksa penyebabnya;
jangan menghapus database atau env untuk memaksa skrip berjalan ulang.

Kegagalan run `42443227258` terjadi sebelum build karena validasi mewajibkan
`SERVER_KNOWN_HOSTS`. Fallback public key di atas mengatasi kegagalan tersebut;
preflight tetap menolak aktivasi jika runtime env atau layanan backend belum ada.

Run #54 (`42443701184`) gagal karena secrets host/user/port tidak sesuai target
baru. Target sekarang dipin di workflow sehingga secrets target lama diabaikan.
Perubahan workflow harus dipush sebagai commit baru; re-run run lama tetap
menggunakan konfigurasi commit lama.

Run #55 (`42444061955`) gagal dengan `Permission denied (publickey)` karena
workflow memakai password pada server yang hanya menerima key. Workflow kini
mewajibkan private key yang valid, menguji autentikasi SSH secara terpisah,
dan tidak menggunakan `sshpass` atau secret password lagi. Peringatan runtime
Node.js pada action checkout bukan penyebab kegagalan autentikasi tersebut.
Percobaan ulang #55 attempt 2 berhasil melewati autentikasi dari runner GitHub
setelah secret key dipasang. Run berhenti dengan exit 1 pada preflight karena
`/etc/topuna/backend.env`, `/etc/topuna/frontend.env`, dan `topuna-be.service`
belum tersedia; bukan lagi exit 255 dari SSH. Belum ada aktivasi aplikasi atau
migrasi database pada percobaan ini.

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
