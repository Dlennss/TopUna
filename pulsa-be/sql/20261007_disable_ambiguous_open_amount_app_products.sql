-- Hide generic/free-nominal H2HR products from the retail app catalog.
-- These rows are provider commands with a service fee in the name (for example
-- "E-WALLET 2.500 GOPAY OPEN AMOUNT"), not fixed denominations. Showing them
-- beside fixed products can make a user think the fee is the nominal.
WITH ambiguous AS (
  SELECT id
  FROM public.produk
  WHERE tipe_harga = 'OPEN_AMOUNT'
    AND EXISTS (
      SELECT 1
      FROM public.produk_provider_map ppm
      WHERE ppm.produk_id = produk.id
        AND LOWER(ppm.provider) = 'pulsa24jam'
    )
    AND (
      UPPER(COALESCE(nama, '')) LIKE '%OPEN AMOUNT%'
      OR UPPER(COALESCE(nama, '')) LIKE '%DENOM BEBAS%'
    )
)
UPDATE public.produk p
SET aktif = false,
    diubah_pada = now()
FROM ambiguous a
WHERE p.id = a.id;

WITH ambiguous AS (
  SELECT id
  FROM public.produk
  WHERE tipe_harga = 'OPEN_AMOUNT'
    AND EXISTS (
      SELECT 1
      FROM public.produk_provider_map ppm
      WHERE ppm.produk_id = produk.id
        AND LOWER(ppm.provider) = 'pulsa24jam'
    )
    AND (
      UPPER(COALESCE(nama, '')) LIKE '%OPEN AMOUNT%'
      OR UPPER(COALESCE(nama, '')) LIKE '%DENOM BEBAS%'
    )
)
UPDATE public.produk_app_pricing pap
SET aktif = false,
    updated_at = now(),
    diubah_pada = now()
FROM ambiguous a
WHERE pap.produk_id = a.id;

WITH ambiguous AS (
  SELECT id
  FROM public.produk
  WHERE tipe_harga = 'OPEN_AMOUNT'
    AND EXISTS (
      SELECT 1
      FROM public.produk_provider_map ppm
      WHERE ppm.produk_id = produk.id
        AND LOWER(ppm.provider) = 'pulsa24jam'
    )
    AND (
      UPPER(COALESCE(nama, '')) LIKE '%OPEN AMOUNT%'
      OR UPPER(COALESCE(nama, '')) LIKE '%DENOM BEBAS%'
    )
)
UPDATE public.produk_provider_map ppm
SET aktif = false,
    diubah_pada = now()
FROM ambiguous a
WHERE ppm.produk_id = a.id;
