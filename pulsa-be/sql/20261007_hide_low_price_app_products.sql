WITH low_price_products AS (
  SELECT
    p.id AS produk_id,
    CASE
      WHEN p.tipe_harga::text = 'FIXED'
        AND p.nominal IS NOT NULL
        AND (
          upper(coalesce(k.nama, '')) LIKE '%E-WALLET%'
          OR upper(coalesce(k.nama, '')) LIKE '%E-MONEY%'
        )
        THEN p.nominal + coalesce(app.harga, 0) + coalesce(kfa.fee_user, 0)
      WHEN p.tipe_harga::text = 'OPEN_AMOUNT'
        THEN coalesce(app.harga, 0) + coalesce(kfa_open.fee_user, coalesce(kfa.fee_user, 0))
      ELSE coalesce(app.harga, 0) + coalesce(kfa.fee_user, 0)
    END AS user_price
  FROM public.produk p
  JOIN public.produk_app_pricing app
    ON app.produk_id = p.id
   AND lower(trim(app.provider)) = 'pulsa24jam'
  LEFT JOIN public.kategori k ON k.id = p.kategori_id
  LEFT JOIN public.kategori_fee_app kfa
    ON kfa.kategori_id = p.kategori_id
   AND kfa.aktif = true
  LEFT JOIN public.kategori k_open
    ON lower(k_open.nama) = lower('Bebas Nominal')
  LEFT JOIN public.kategori_fee_app kfa_open
    ON kfa_open.kategori_id = k_open.id
   AND kfa_open.aktif = true
  WHERE p.aktif = true
    AND app.aktif = true
)
UPDATE public.produk_app_pricing app
SET aktif = false,
    yuscom_status = 'PULSA24JAM_LOW_PRICE_HIDDEN',
    updated_at = now(),
    diubah_pada = now()
FROM low_price_products low
WHERE app.produk_id = low.produk_id
  AND lower(trim(app.provider)) = 'pulsa24jam'
  AND low.user_price <= 1000;

WITH low_price_products AS (
  SELECT
    p.id AS produk_id,
    CASE
      WHEN p.tipe_harga::text = 'FIXED'
        AND p.nominal IS NOT NULL
        AND (
          upper(coalesce(k.nama, '')) LIKE '%E-WALLET%'
          OR upper(coalesce(k.nama, '')) LIKE '%E-MONEY%'
        )
        THEN p.nominal + coalesce(app.harga, 0) + coalesce(kfa.fee_user, 0)
      WHEN p.tipe_harga::text = 'OPEN_AMOUNT'
        THEN coalesce(app.harga, 0) + coalesce(kfa_open.fee_user, coalesce(kfa.fee_user, 0))
      ELSE coalesce(app.harga, 0) + coalesce(kfa.fee_user, 0)
    END AS user_price
  FROM public.produk p
  JOIN public.produk_app_pricing app
    ON app.produk_id = p.id
   AND lower(trim(app.provider)) = 'pulsa24jam'
  LEFT JOIN public.kategori k ON k.id = p.kategori_id
  LEFT JOIN public.kategori_fee_app kfa
    ON kfa.kategori_id = p.kategori_id
   AND kfa.aktif = true
  LEFT JOIN public.kategori k_open
    ON lower(k_open.nama) = lower('Bebas Nominal')
  LEFT JOIN public.kategori_fee_app kfa_open
    ON kfa_open.kategori_id = k_open.id
   AND kfa_open.aktif = true
  WHERE p.aktif = true
)
UPDATE public.produk_provider_map ppm
SET aktif = false,
    diubah_pada = now()
FROM low_price_products low
WHERE ppm.produk_id = low.produk_id
  AND lower(trim(ppm.provider)) = 'pulsa24jam'
  AND low.user_price <= 1000;
