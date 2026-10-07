-- Pulsa24Jam H2HR labels several GOPAY denomination SKUs as OPEN_AMOUNT,
-- but each SKU already carries a concrete nominal in its name/code. In the app
-- these must be locked to that nominal so checkout cannot send a mismatched
-- qty to Pulsa24Jam.
WITH parsed AS (
  SELECT
    p.id,
    CASE
      WHEN regexp_match(p.nama, '([0-9][0-9.]*)\s*\(ADM') IS NOT NULL
        THEN NULLIF(REPLACE((regexp_match(p.nama, '([0-9][0-9.]*)\s*\(ADM'))[1], '.', ''), '')::bigint
      WHEN regexp_match(p.nama, '([0-9][0-9.]*)$') IS NOT NULL
        THEN NULLIF(REPLACE((regexp_match(p.nama, '([0-9][0-9.]*)$'))[1], '.', ''), '')::bigint
      ELSE NULL
    END AS nominal
  FROM public.produk p
  WHERE UPPER(COALESCE(p.nama, '')) LIKE '%GOPAY%'
    AND UPPER(COALESCE(p.nama, '')) NOT LIKE '%OPEN AMOUNT%'
    AND UPPER(COALESCE(p.nama, '')) NOT LIKE '%DENOM BEBAS%'
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
