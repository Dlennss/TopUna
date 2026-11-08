-- Run only in an empty disposable PostgreSQL database as catalog_test.
DO $$ BEGIN
  IF current_user <> 'catalog_test' THEN RAISE EXCEPTION 'Test database only'; END IF;
END $$;
CREATE TABLE provider (id bigserial PRIMARY KEY, nama text UNIQUE, aktif boolean, dibuat_pada timestamptz, diubah_pada timestamptz);
CREATE TABLE kategori (LIKE provider INCLUDING ALL);
CREATE TABLE brand (LIKE provider INCLUDING ALL);
CREATE TABLE kategori_fee_app (kategori_id bigint UNIQUE, fee_master bigint, fee_agent bigint, fee_user bigint, fee_non_user bigint, aktif boolean, created_at timestamptz, updated_at timestamptz);
CREATE TABLE produk (id bigserial PRIMARY KEY, sku text UNIQUE, nama text, group_name text, kategori_id bigint, brand_id bigint, tipe_harga text, nominal bigint, maksimal_nominal bigint, jam_buka text, jam_tutup text, aktif boolean, dibuat_pada timestamptz, diubah_pada timestamptz);
CREATE TABLE produk_app_pricing (id bigserial PRIMARY KEY, produk_id bigint UNIQUE, provider text, harga bigint, harga_dasar bigint, yuscom_group text, yuscom_category text, yuscom_sku text, yuscom_name text, yuscom_status text, yuscom_display_brand text, aktif boolean, fetched_at timestamptz, created_at timestamptz, updated_at timestamptz, dibuat_pada timestamptz, diubah_pada timestamptz);
CREATE TABLE produk_provider_map (id bigserial PRIMARY KEY, produk_id bigint, provider text, kode_provider text, aktif boolean, prioritas integer, dibuat_pada timestamptz, diubah_pada timestamptz);
CREATE TABLE untouched_wallet_fixture (saldo bigint);
INSERT INTO untouched_wallet_fixture VALUES (123456);
INSERT INTO produk (sku, nama, aktif) VALUES ('NOT-H2HR', 'Legacy', true), ('GPC100', 'Old label', true);
INSERT INTO produk_app_pricing (produk_id, provider, harga, aktif, yuscom_status)
SELECT id, 'pulsa24jam', 1200, true, CASE WHEN sku = 'GPC100' THEN 'PULSA24JAM_FAILED_QUARANTINED' ELSE 'ACTIVE' END FROM produk;
INSERT INTO produk_provider_map (produk_id, provider, kode_provider, aktif)
SELECT id, 'legacy-provider', sku, true FROM produk;
