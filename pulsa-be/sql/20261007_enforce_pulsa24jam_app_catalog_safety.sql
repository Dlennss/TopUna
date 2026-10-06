-- Final guard for Pulsa24Jam retail catalog safety.
-- This runs after activation so any startup catalog refresh cannot expose
-- ambiguous open-amount commands as retail products.
WITH ambiguous AS (
  SELECT p.id
  FROM public.produk p
  WHERE EXISTS (
      SELECT 1
      FROM public.produk_provider_map ppm
      WHERE ppm.produk_id = p.id
        AND LOWER(ppm.provider) = 'pulsa24jam'
    )
    AND (
      UPPER(COALESCE(p.nama, '')) LIKE '%OPEN AMOUNT%'
      OR UPPER(COALESCE(p.nama, '')) LIKE '%DENOM BEBAS%'
    )
)
UPDATE public.produk p
SET aktif = false,
    diubah_pada = now()
FROM ambiguous a
WHERE p.id = a.id;

WITH ambiguous AS (
  SELECT p.id
  FROM public.produk p
  WHERE EXISTS (
      SELECT 1
      FROM public.produk_provider_map ppm
      WHERE ppm.produk_id = p.id
        AND LOWER(ppm.provider) = 'pulsa24jam'
    )
    AND (
      UPPER(COALESCE(p.nama, '')) LIKE '%OPEN AMOUNT%'
      OR UPPER(COALESCE(p.nama, '')) LIKE '%DENOM BEBAS%'
    )
)
UPDATE public.produk_app_pricing app
SET aktif = false,
    updated_at = now(),
    diubah_pada = now()
FROM ambiguous a
WHERE app.produk_id = a.id
  AND LOWER(TRIM(app.provider)) = 'pulsa24jam';

WITH ambiguous AS (
  SELECT p.id
  FROM public.produk p
  WHERE EXISTS (
      SELECT 1
      FROM public.produk_provider_map ppm
      WHERE ppm.produk_id = p.id
        AND LOWER(ppm.provider) = 'pulsa24jam'
    )
    AND (
      UPPER(COALESCE(p.nama, '')) LIKE '%OPEN AMOUNT%'
      OR UPPER(COALESCE(p.nama, '')) LIKE '%DENOM BEBAS%'
    )
)
UPDATE public.produk_provider_map ppm
SET aktif = false,
    diubah_pada = now()
FROM ambiguous a
WHERE ppm.produk_id = a.id
  AND LOWER(TRIM(ppm.provider)) = 'pulsa24jam';

WITH fixed_nominal AS (
  SELECT
    p.id,
    NULLIF(REPLACE((regexp_match(p.nama, '([0-9][0-9.]*)$'))[1], '.', ''), '')::bigint AS nominal
  FROM public.produk p
  WHERE EXISTS (
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
    aktif = true,
    diubah_pada = now()
FROM fixed_nominal f
WHERE ppm.produk_id = f.id
  AND LOWER(TRIM(ppm.provider)) = 'pulsa24jam'
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
UPDATE public.produk_app_pricing app
SET aktif = true,
    updated_at = now(),
    diubah_pada = now()
FROM fixed_nominal f
WHERE app.produk_id = f.id
  AND LOWER(TRIM(app.provider)) = 'pulsa24jam'
  AND f.nominal > 0;
