-- Pulsa24Jam labels many fixed-denomination wallet/data products as
-- OPEN_AMOUNT in the dashboard. In the retail app, products whose names end in
-- a concrete nominal must behave as fixed products so the buyer cannot enter a
-- different amount by mistake.
WITH fixed_nominal AS (
  SELECT
    p.id,
    NULLIF(REPLACE((regexp_match(p.nama, '([0-9][0-9.]*)$'))[1], '.', ''), '')::bigint AS nominal
  FROM public.produk p
  WHERE p.tipe_harga = 'OPEN_AMOUNT'
    AND EXISTS (
      SELECT 1
      FROM public.produk_provider_map ppm
      WHERE ppm.produk_id = p.id
        AND LOWER(ppm.provider) = 'pulsa24jam'
    )
    AND UPPER(COALESCE(p.nama, '')) NOT LIKE '%OPEN AMOUNT%'
    AND UPPER(COALESCE(p.nama, '')) NOT LIKE '%DENOM BEBAS%'
    AND regexp_match(p.nama, '([0-9][0-9.]*)$') IS NOT NULL
)
UPDATE public.produk p
SET tipe_harga = 'FIXED',
    nominal = f.nominal,
    maksimal_nominal = NULL,
    aktif = true,
    diubah_pada = now()
FROM fixed_nominal f
WHERE p.id = f.id
  AND f.nominal > 0;

WITH fixed_nominal AS (
  SELECT
    p.id,
    NULLIF(REPLACE((regexp_match(p.nama, '([0-9][0-9.]*)$'))[1], '.', ''), '')::bigint AS nominal
  FROM public.produk p
  WHERE p.tipe_harga = 'FIXED'
    AND EXISTS (
      SELECT 1
      FROM public.produk_provider_map ppm
      WHERE ppm.produk_id = p.id
        AND LOWER(ppm.provider) = 'pulsa24jam'
    )
    AND UPPER(COALESCE(p.nama, '')) NOT LIKE '%OPEN AMOUNT%'
    AND UPPER(COALESCE(p.nama, '')) NOT LIKE '%DENOM BEBAS%'
    AND regexp_match(p.nama, '([0-9][0-9.]*)$') IS NOT NULL
)
UPDATE public.produk_provider_map ppm
SET minimal_nominal = NULL,
    maksimal_nominal = NULL,
    diubah_pada = now()
FROM fixed_nominal f
WHERE ppm.produk_id = f.id
  AND f.nominal > 0;
