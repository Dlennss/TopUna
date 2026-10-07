-- The dashboard source is Pulsa24Jam H2HR. Some upstream descriptions include
-- the token "H2H"; in the retail catalog, show them as H2HR so the product
-- labels match the account/source being used.
WITH p24_products AS (
  SELECT p.id
  FROM public.produk p
  WHERE p.nama ~* '\mH2H\M'
    AND EXISTS (
      SELECT 1
      FROM public.produk_provider_map ppm
      WHERE ppm.produk_id = p.id
        AND LOWER(TRIM(ppm.provider)) = 'pulsa24jam'
    )
)
UPDATE public.produk p
SET nama = regexp_replace(p.nama, '\mH2H\M', 'H2HR', 'gi'),
    diubah_pada = now()
FROM p24_products src
WHERE p.id = src.id;

UPDATE public.produk_app_pricing app
SET yuscom_name = regexp_replace(app.yuscom_name, '\mH2H\M', 'H2HR', 'gi'),
    updated_at = now(),
    diubah_pada = now()
WHERE LOWER(TRIM(app.provider)) = 'pulsa24jam'
  AND app.yuscom_name ~* '\mH2H\M';
