-- Run once only with the owner's approval and a catalog backup.
-- Not a deployment migration: rerunning would clear GOPAY's failure quarantine.
\set ON_ERROR_STOP on
BEGIN;
SET LOCAL lock_timeout = '15s';
SET LOCAL statement_timeout = '60s';
LOCK TABLE public.produk_app_pricing, public.produk_provider_map IN SHARE ROW EXCLUSIVE MODE;

CREATE TEMP TABLE gopay_scope ON COMMIT DROP AS
SELECT p.id, p.sku
FROM public.produk p
JOIN public.brand b ON b.id = p.brand_id
JOIN public.kategori k ON k.id = p.kategori_id
WHERE b.nama = 'GOPAY' AND k.nama = 'E-Wallet';

DO $$
BEGIN
  IF (SELECT count(*) FROM gopay_scope WHERE sku = 'GOPAY') <> 1
     OR (SELECT count(*) FROM public.produk_app_pricing a
         JOIN gopay_scope s ON s.id = a.produk_id
         WHERE s.sku = 'GOPAY' AND a.provider = 'pulsa24jam'
           AND a.yuscom_sku = 'GOPAY' AND a.harga >= 0) <> 1
     OR (SELECT count(*) FROM public.produk_provider_map m
         JOIN gopay_scope s ON s.id = m.produk_id
         WHERE s.sku = 'GOPAY' AND m.provider = 'pulsa24jam'
           AND m.kode_provider = 'GOPAY') <> 1 THEN
    RAISE EXCEPTION 'Expected GOPAY product, pricing or mapping missing; no changes applied';
  END IF;
END $$;

CREATE TEMP TABLE pricing_before ON COMMIT DROP AS
SELECT id, harga, harga_dasar FROM public.produk_app_pricing;

UPDATE public.produk_app_pricing a
SET aktif = (s.sku = 'GOPAY'),
    yuscom_status = CASE
      WHEN s.sku = 'GOPAY' THEN 'ACTIVE'
      WHEN a.yuscom_status LIKE 'PULSA24JAM_%' THEN a.yuscom_status
      ELSE 'PULSA24JAM_HIDDEN_BY_OWNER'
    END,
    updated_at = now(), diubah_pada = now()
FROM gopay_scope s
WHERE s.id = a.produk_id AND a.provider = 'pulsa24jam';

UPDATE public.produk_provider_map m
SET aktif = (s.sku = 'GOPAY' AND m.kode_provider = 'GOPAY'), diubah_pada = now()
FROM gopay_scope s
WHERE s.id = m.produk_id AND m.provider = 'pulsa24jam';

DO $$
BEGIN
  IF (SELECT count(*) FROM public.produk_app_pricing a
      JOIN gopay_scope s ON s.id = a.produk_id
      WHERE a.provider = 'pulsa24jam' AND a.aktif) <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one active GoPay product';
  END IF;
  IF EXISTS (SELECT 1 FROM public.produk_app_pricing a JOIN pricing_before b USING (id)
             WHERE a.harga IS DISTINCT FROM b.harga OR a.harga_dasar IS DISTINCT FROM b.harga_dasar) THEN
    RAISE EXCEPTION 'Prices changed unexpectedly';
  END IF;
END $$;

SELECT s.sku, a.aktif, a.harga, a.yuscom_status
FROM public.produk_app_pricing a JOIN gopay_scope s ON s.id = a.produk_id
WHERE a.provider = 'pulsa24jam' AND a.aktif;
COMMIT;
