DO $$ BEGIN
  IF current_user <> 'catalog_test' THEN RAISE EXCEPTION 'Test database only'; END IF;
  IF (SELECT count(*) FROM produk WHERE aktif) <> 15296 THEN RAISE EXCEPTION 'Catalog count mismatch'; END IF;
  IF EXISTS (SELECT FROM produk WHERE sku = 'NOT-H2HR' AND aktif) THEN RAISE EXCEPTION 'Legacy product active'; END IF;
  IF EXISTS (SELECT FROM produk_provider_map WHERE provider <> 'pulsa24jam' AND aktif) THEN RAISE EXCEPTION 'Legacy route active'; END IF;
  IF EXISTS (SELECT FROM produk_app_pricing a JOIN produk p ON p.id = a.produk_id WHERE p.sku = 'GPC100' AND (a.aktif OR a.yuscom_status <> 'PULSA24JAM_FAILED_QUARANTINED')) THEN RAISE EXCEPTION 'Quarantine lost'; END IF;
  IF NOT EXISTS (SELECT FROM produk p JOIN produk_app_pricing a ON a.produk_id = p.id WHERE p.sku = 'DANA' AND p.tipe_harga = 'OPEN_AMOUNT' AND a.harga = 1000 AND a.aktif AND p.nominal IS NULL AND p.group_name = 'PPOB') THEN RAISE EXCEPTION 'Open amount metadata/fee wrong'; END IF;
  IF EXISTS (SELECT FROM produk p JOIN produk_app_pricing a ON a.produk_id = p.id WHERE p.tipe_harga = 'FIXED' AND a.harga <= 1000 AND a.aktif) THEN RAISE EXCEPTION 'Unverified low price exposed'; END IF;
  IF EXISTS (SELECT FROM produk_provider_map m JOIN produk_app_pricing a ON a.produk_id = m.produk_id WHERE m.aktif AND (NOT a.aktif OR m.kode_provider <> a.yuscom_sku)) THEN RAISE EXCEPTION 'Routing mismatch'; END IF;
  IF (SELECT saldo FROM untouched_wallet_fixture) <> 123456 THEN RAISE EXCEPTION 'Wallet modified'; END IF;
END $$;
SELECT 'H2HR catalog integration checks passed' AS result;
