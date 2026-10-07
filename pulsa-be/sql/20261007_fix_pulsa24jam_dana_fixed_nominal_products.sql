WITH dana_nominal AS (
  SELECT
    p.id AS produk_id,
    max(replace(m.match_value[1], '.', '')::bigint) AS nominal
  FROM public.produk p
  JOIN public.produk_app_pricing app
    ON app.produk_id = p.id
   AND lower(trim(app.provider)) = 'pulsa24jam'
  CROSS JOIN LATERAL (
    SELECT match_value
    FROM regexp_matches(COALESCE(p.nama, ''), '([0-9][0-9.]*)', 'g') AS rx(match_value)
    WHERE position('.' in match_value[1]) > 0
  ) m
  WHERE upper(trim(COALESCE(p.sku, ''))) LIKE 'DANA%'
    AND upper(COALESCE(p.nama, '')) LIKE '%DANA%'
    AND upper(COALESCE(p.nama, '')) NOT LIKE '%OPEN AMOUNT%'
    AND upper(COALESCE(p.nama, '')) NOT LIKE '%DENOM BEBAS%'
  GROUP BY p.id
  HAVING max(replace(m.match_value[1], '.', '')::bigint) > 0
)
UPDATE public.produk p
SET tipe_harga = 'FIXED',
    nominal = dn.nominal,
    maksimal_nominal = NULL,
    aktif = true,
    diubah_pada = now()
FROM dana_nominal dn
WHERE p.id = dn.produk_id;

WITH dana_nominal AS (
  SELECT
    p.id AS produk_id,
    max(replace(m.match_value[1], '.', '')::bigint) AS nominal
  FROM public.produk p
  JOIN public.produk_app_pricing app
    ON app.produk_id = p.id
   AND lower(trim(app.provider)) = 'pulsa24jam'
  CROSS JOIN LATERAL (
    SELECT match_value
    FROM regexp_matches(COALESCE(p.nama, ''), '([0-9][0-9.]*)', 'g') AS rx(match_value)
    WHERE position('.' in match_value[1]) > 0
  ) m
  WHERE upper(trim(COALESCE(p.sku, ''))) LIKE 'DANA%'
    AND upper(COALESCE(p.nama, '')) LIKE '%DANA%'
    AND upper(COALESCE(p.nama, '')) NOT LIKE '%OPEN AMOUNT%'
    AND upper(COALESCE(p.nama, '')) NOT LIKE '%DENOM BEBAS%'
  GROUP BY p.id
  HAVING max(replace(m.match_value[1], '.', '')::bigint) > 0
)
UPDATE public.produk_app_pricing app
SET aktif = true,
    yuscom_status = 'ACTIVE',
    updated_at = now(),
    diubah_pada = now()
FROM dana_nominal dn
WHERE app.produk_id = dn.produk_id
  AND lower(trim(app.provider)) = 'pulsa24jam';

WITH dana_nominal AS (
  SELECT
    p.id AS produk_id,
    max(replace(m.match_value[1], '.', '')::bigint) AS nominal
  FROM public.produk p
  JOIN public.produk_app_pricing app
    ON app.produk_id = p.id
   AND lower(trim(app.provider)) = 'pulsa24jam'
  CROSS JOIN LATERAL (
    SELECT match_value
    FROM regexp_matches(COALESCE(p.nama, ''), '([0-9][0-9.]*)', 'g') AS rx(match_value)
    WHERE position('.' in match_value[1]) > 0
  ) m
  WHERE upper(trim(COALESCE(p.sku, ''))) LIKE 'DANA%'
    AND upper(COALESCE(p.nama, '')) LIKE '%DANA%'
    AND upper(COALESCE(p.nama, '')) NOT LIKE '%OPEN AMOUNT%'
    AND upper(COALESCE(p.nama, '')) NOT LIKE '%DENOM BEBAS%'
  GROUP BY p.id
  HAVING max(replace(m.match_value[1], '.', '')::bigint) > 0
)
UPDATE public.produk_provider_map ppm
SET aktif = true,
    minimal_nominal = NULL,
    maksimal_nominal = NULL,
    diubah_pada = now()
FROM dana_nominal dn
WHERE ppm.produk_id = dn.produk_id
  AND lower(trim(ppm.provider)) = 'pulsa24jam';
