# Katalog H2HR Topuna

Sumber: ekspor teks panel member H2HR yang dilampirkan pengguna pada 8 November
2026. Snapshot memuat 15.296 SKU, 6.563 FIXED, 8.733 OPEN_AMOUNT, 23 kategori,
dan 199 nama brand setelah menyamakan huruf besar/kecil (200 ejaan asli).
Hash SHA-256 berkas sumber disimpan dalam
`pulsa-be/internal/catalog/pulsa24jam_h2hr.json`.

## Aturan katalog

- SKU, nama, kategori, brand, grup PULSA/PPOB dan jenis harga mengikuti ekspor.
  Kata H2H dalam nama asli tetap dipertahankan: keanggotaan katalog ditentukan
  SKU pada ekspor H2HR, bukan mengganti teks menjadi H2HR.
- Harga FIXED adalah harga katalog, bukan nominal saldo. Angka di nama produk
  tidak digunakan untuk mengubah jenis harga atau mengisi nominal otomatis.
- Harga OPEN_AMOUNT adalah biaya tambahan, bukan total pembelian. Total terdiri
  dari nominal masukan, biaya provider dan fee aplikasi/metode bayar jika ada.
- Sinkronisasi dan checkout hanya menerima SKU yang terdapat dalam snapshot.
  Produk baru di luar snapshot memerlukan ekspor lengkap dan review berikutnya.
  Checkout tetap wajib memverifikasi status, jenis harga dan harga terkini lewat
  API P24 menggunakan kredensial akun H2HR instalasi ini.
- SKU yang tidak cocok, harga hilang atau konfigurasi provider belum tersedia
  menyebabkan checkout ditolak sebelum membuat order pembayaran.
- Produk gagal yang dikarantina tetap disembunyikan. Impor tidak menganggap
  semua SKU pasti bisa ditransaksikan. FIXED dengan harga <= Rp1.000 tetap
  disembunyikan (419 baris pada snapshot ini); biaya OPEN_AMOUNT Rp1.000 tidak
  dianggap sebagai harga produk penuh.
- Routing memakai SKU yang dipilih, tanpa mengganti SKU lama ke DANA/GOPAY
  secara diam-diam. Tidak ada pembelian berbayar otomatis untuk pengujian.

## Impor dan pembaruan

Generator menolak ekspor terpotong, jumlah tidak sesuai dan SKU duplikat.
Dari folder `pulsa-be`:

```sh
go run ./scripts/pulsa24jam_catalog_from_dashboard export.txt sql/NEW_MIGRATION.sql internal/catalog/pulsa24jam_h2hr.json
go test ./...
```

Review hasil dan gunakan nama migrasi baru untuk snapshot berikutnya. Jangan
menjalankan ulang seed lama setelah migrasi baru: itu mengembalikan nama,
nominal atau routing yang sudah diperbaiki. Workflow telah memakai migrasi baru.
Backup database sebelum deploy. Impor menonaktifkan katalog/routing lama dalam
database Topuna, tetapi tidak menghapus histori transaksi atau mengubah saldo.

## Logo

Logo tiruan dari `yuscom-display-brand-logos-generated` tidak lagi dipakai pada
resolver brand. Logo AstraPay, i.saku dan ShopeePay diambil dari situs resminya:

- https://astrapay.com/static-assets/images/logos/logo-colorful.png
- https://www.i-saku.com/wp-content/uploads/2025/07/LOGO-ISAKU-NEW-2025_COLOR-01-1.png
- https://product.shopeepay.co.id/static/images/logo/shopeepay-logo.svg
- Pedoman: https://product.shopeepay.co.id/products/brand-guidelines

Belum semua logo brand pada katalog memiliki sumber resmi terverifikasi.
Nama/initial brand tetap tampil bila aset belum tersedia, bukan logo buatan.
`h2hr-brand-audit.json` mencatat aset yang dipetakan dan entri yang belum ada.
Path `local:` menunjukkan aset repo yang dipertahankan, bukan klaim sudah
diverifikasi ulang dari situs resminya. Jangan menyebut cakupan logo 100%.

```sh
cd pulsa-fe
node scripts/check-h2hr-catalog.mjs ../ops/h2hr-brand-audit.json
```

## Verifikasi

Tes Go mencakup jumlah snapshot, penolakan harga kosong/fee sebagai harga FIXED,
jenis harga, SKU dan input nominal. SQL fixture di `ops/tests/h2hr-catalog-*`
hanya boleh dijalankan pada database PostgreSQL sementara dengan user
`catalog_test`. Jalankan fixture, migrasi, assertion, lalu migrasi dan assertion
lagi untuk memeriksa impor ulang. Tes repository integrasi diaktifkan hanya
dengan `H2HR_TEST_DATABASE_URL` menuju database sementara tersebut.

Harga pada ekspor adalah snapshot, bukan jaminan harga/stok saat transaksi.
Pengujian pembelian nyata menunggu runtime server, kredensial H2HR dan saldo
yang telah diverifikasi, serta persetujuan untuk transaksi berbayar.
