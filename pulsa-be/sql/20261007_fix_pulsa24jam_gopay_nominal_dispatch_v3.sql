-- Re-run after fixing catalog sync normalization. This locks existing GOPAY
-- nominal products that may have been rewritten to OPEN_AMOUNT by sync.
WITH parsed AS (
  SELECT
    p.id,
    COALESCE(
      NULLIF(REPLACE(substring(p.nama FROM '([0-9][0-9.]*)[[:space:]]*\('), '.', ''), '')::bigint,
      NULLIF(REPLACE(substring(p.nama FROM '([0-9][0-9.]*)$'), '.', ''), '')::bigint,
      NULLIF(substring(p.sku FROM '([0-9]+)P?$'), '')::bigint * 1000
    ) AS nominal
  FROM public.produk p
  WHERE UPPER(COALESCE(p.nama, '')) LIKE '%GOPAY%'
    AND UPPER(COALESCE(p.nama, '')) NOT LIKE '%OPEN AMOUNT%'
    AND UPPER(COALESCE(p.nama, '')) NOT LIKE '%DENOM BEBAS%'
    AND (
      UPPER(TRIM(p.sku)) LIKE 'GPC%'
      OR UPPER(TRIM(p.sku)) LIKE 'GPCH%'
      OR UPPER(TRIM(p.sku)) LIKE 'GD%'
    )
    AND EXISTS (
      SELECT 1
      FROM public.produk_provider_map ppm
      WHERE ppm.produk_id = p.id
        AND LOWER(TRIM(ppm.provider)) = 'pulsa24jam'
    )
)
UPDATE public.produk p
SET tipe_harga = 'FIXED',
    nominal = parsed.nominal,
    maksimal_nominal = NULL,
    aktif = true,
    diubah_pada = now()
FROM parsed
WHERE p.id = parsed.id
  AND parsed.nominal > 0;

WITH fixed AS (
  SELECT p.id
  FROM public.produk p
  WHERE UPPER(COALESCE(p.nama, '')) LIKE '%GOPAY%'
    AND UPPER(COALESCE(p.nama, '')) NOT LIKE '%OPEN AMOUNT%'
    AND UPPER(COALESCE(p.nama, '')) NOT LIKE '%DENOM BEBAS%'
    AND p.tipe_harga = 'FIXED'
    AND p.nominal IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.produk_provider_map ppm
      WHERE ppm.produk_id = p.id
        AND LOWER(TRIM(ppm.provider)) = 'pulsa24jam'
    )
)
UPDATE public.produk_provider_map ppm
SET minimal_nominal = NULL,
    maksimal_nominal = NULL,
    diubah_pada = now()
FROM fixed
WHERE ppm.produk_id = fixed.id
  AND LOWER(TRIM(ppm.provider)) = 'pulsa24jam';
