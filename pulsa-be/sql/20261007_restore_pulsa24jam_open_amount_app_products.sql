-- Open-amount / free-denomination wallet products are valid Pulsa24Jam
-- transaction routes. They must stay visible in the app as OPEN_AMOUNT cards;
-- the buyer enters the amount at checkout.
WITH open_amount AS (
  SELECT p.id
  FROM public.produk p
  WHERE p.tipe_harga = 'OPEN_AMOUNT'
    AND EXISTS (
      SELECT 1
      FROM public.produk_provider_map ppm
      WHERE ppm.produk_id = p.id
        AND LOWER(TRIM(ppm.provider)) = 'pulsa24jam'
    )
    AND (
      UPPER(COALESCE(p.nama, '')) LIKE '%OPEN AMOUNT%'
      OR UPPER(COALESCE(p.nama, '')) LIKE '%DENOM BEBAS%'
    )
)
UPDATE public.produk p
SET nominal = NULL,
    aktif = true,
    diubah_pada = now()
FROM open_amount oa
WHERE p.id = oa.id;

WITH open_amount AS (
  SELECT p.id
  FROM public.produk p
  WHERE p.tipe_harga = 'OPEN_AMOUNT'
    AND EXISTS (
      SELECT 1
      FROM public.produk_provider_map ppm
      WHERE ppm.produk_id = p.id
        AND LOWER(TRIM(ppm.provider)) = 'pulsa24jam'
    )
    AND (
      UPPER(COALESCE(p.nama, '')) LIKE '%OPEN AMOUNT%'
      OR UPPER(COALESCE(p.nama, '')) LIKE '%DENOM BEBAS%'
    )
)
UPDATE public.produk_app_pricing app
SET aktif = true,
    updated_at = now(),
    diubah_pada = now()
FROM open_amount oa
WHERE app.produk_id = oa.id
  AND LOWER(TRIM(app.provider)) = 'pulsa24jam';

WITH open_amount AS (
  SELECT p.id
  FROM public.produk p
  WHERE p.tipe_harga = 'OPEN_AMOUNT'
    AND EXISTS (
      SELECT 1
      FROM public.produk_provider_map ppm
      WHERE ppm.produk_id = p.id
        AND LOWER(TRIM(ppm.provider)) = 'pulsa24jam'
    )
    AND (
      UPPER(COALESCE(p.nama, '')) LIKE '%OPEN AMOUNT%'
      OR UPPER(COALESCE(p.nama, '')) LIKE '%DENOM BEBAS%'
    )
)
UPDATE public.produk_provider_map ppm
SET aktif = true,
    minimal_nominal = COALESCE(NULLIF(ppm.minimal_nominal, 0), 1),
    maksimal_nominal = NULL,
    diubah_pada = now()
FROM open_amount oa
WHERE ppm.produk_id = oa.id
  AND LOWER(TRIM(ppm.provider)) = 'pulsa24jam';
