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

## Pembatasan GoPay 24 November 2026

Atas permintaan pemilik, hanya SKU `GOPAY` (E-WALLET 2.500 GOPAY OPEN AMOUNT)
diaktifkan kembali. Sebanyak 1.130 SKU lain pada brand GOPAY kategori E-Wallet
disembunyikan melalui pricing dan mapping provider. Penanda
`PULSA24JAM_HIDDEN_BY_OWNER` dipertahankan oleh sinkronisasi; penanda karantina
yang sudah ada tidak ditimpa. Brand lain, harga, saldo dan transaksi tidak diubah.
API publik dan checkout diverifikasi tanpa pembayaran. Keberhasilan transaksi
provider belum terverifikasi; karantina otomatis tetap berlaku jika gagal lagi.

Perubahan satu kali tercatat pada `ops/gopay-only-manual.sql`, bukan migrasi
deploy. Jangan jalankan ulang otomatis karena dapat membuka karantina GOPAY.
Backup sebelum perubahan berada di server pada
`/root/topuna-gopay-catalog-before-20261124T121429Z.dump`, berisi tabel pricing
dan mapping. Pulihkan hanya baris yang relevan setelah review, bukan menimpa
seluruh tabel yang mungkin sudah diperbarui sinkronisasi.

## Audit transaksi PKA9 dan parser status

Pada 24 November 2026, transaksi GOPAY `PKA9` senilai 60.000 ditolak P24
dengan status numerik 3 dan pesan "Transaksi gagal". Debit 61.200 direfund
penuh; produk kembali dikarantina. Pemeriksaan read-only SALDO menunjukkan
62.265 dan PRODUK mengembalikan SKU GOPAY, OPEN_AMOUNT, fee_tambahan 1.200.
Pengecekan STATUS-PAY dengan refid saja ditolak HTTP 400, "product required";
tidak ada PAY ulang atau percobaan format transaksi spekulatif.

Adapter diperbaiki agar status numerik tidak hilang ketika dibaca sebagai teks.
Tes transport lokal mencakup nominal 20.000/60.000, URL v2, SKU, tujuan,
refid, kredensial dummy, status angka/teks, dan redaksi PIN. `go test ./...`
lulus. Ini perbaikan pembacaan respons, bukan bukti penyebab penolakan P24.
Status 3 tetap gagal; harga, saldo, routing, dan karantina tidak diubah.

Perbaikan parser saat itu dipasang melalui rilis manual
`manual-p24-status-1795523625453834506`, berbasis commit
`2630598b637f9f9f16650edfe6e7c5fa029fca23`. Rilis menyimpan perubahan source,
checksum binary, metadata, dan drop-in sebelumnya untuk rollback. Frontend
tidak diganti. Keberhasilan pembelian belum terverifikasi; perlu kontrak API
H2HR atau respons upstream lebih rinci untuk menentukan perbaikan transaksi.

## Benturan Ref ID setelah migrasi database

Audit lanjutan 24 November 2026 menemukan bukti pada respons tersimpan:
PKAC, PKAD, dan PKAE mendapat `existing: true` serta transaksi lama dengan SKU
atau nominal berbeda. Pesanan GOPAY 50.000, invoice
`INV-20261124124438-8C298062`, memakai PKAE dan mendapat kembali transaksi
GPCAD1000 100.000 tanggal 7 Oktober. Ref ID lama memakai `PKA` + ID database
base36, sehingga nomor urut yang berulang di database baru bertabrakan dengan
referensi akun P24 sebelum migrasi. Ini bukti benturan untuk ketiga referensi
tersebut, bukan bukti penyebab setiap kegagalan P24 yang hanya berpesan umum.

Rilis `manual-p24-refid-1795524746497895654`, berbasis commit
`fdf78e9c908c954dd1b88faa706fac6774a33bbd`, mengganti referensi pesanan baru
dengan `TPA` + 17 karakter base32 SHA-256 invoice lengkap (85 bit). Ref ID
dibatasi 20 karakter alfanumerik. Percobaan yang sudah tersimpan mempertahankan
refid aslinya; request memakai refid dari baris provider yang disimpan, bukan
menghitung ulang. Identitas kosong/tidak cocok ditolak sebelum dispatch.
Tidak ada replay otomatis invoice refunded atau perubahan histori/saldo/harga.

Regresi nomor urut berulang direproduksi sebelum perbaikan dan lulus setelahnya.
Tes juga mencakup kestabilan invoice yang sama, perbedaan tahun, batas panjang,
referensi lama, dan request ke provider. `go test ./...`, build Linux amd64,
serta health check server lulus. Backend saja diperbarui, dengan backup drop-in
dan sumber perubahan di direktori rilis. Belum ada uji pembayaran nyata oleh
asisten. Jangan mengklaim semua transaksi provider pasti berhasil.

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
