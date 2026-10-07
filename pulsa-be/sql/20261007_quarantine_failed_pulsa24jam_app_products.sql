WITH failed_products AS (
  SELECT ao.produk_id
  FROM public.app_order_provider_trx apt
  JOIN public.app_order ao ON ao.id = apt.app_order_id
  WHERE lower(trim(apt.provider)) = 'pulsa24jam'
    AND apt.dibuat_pada >= now() - interval '14 days'
  GROUP BY ao.produk_id
  HAVING count(*) FILTER (WHERE lower(trim(coalesce(apt.status, ''))) = 'failed') > 0
     AND count(*) FILTER (WHERE lower(trim(coalesce(apt.status, ''))) = 'success') = 0
)
UPDATE public.produk_app_pricing app
SET aktif = false,
    yuscom_status = 'PULSA24JAM_FAILED_QUARANTINE',
    updated_at = now(),
    diubah_pada = now()
FROM failed_products fp
WHERE app.produk_id = fp.produk_id
  AND lower(trim(app.provider)) = 'pulsa24jam';

WITH failed_products AS (
  SELECT ao.produk_id
  FROM public.app_order_provider_trx apt
  JOIN public.app_order ao ON ao.id = apt.app_order_id
  WHERE lower(trim(apt.provider)) = 'pulsa24jam'
    AND apt.dibuat_pada >= now() - interval '14 days'
  GROUP BY ao.produk_id
  HAVING count(*) FILTER (WHERE lower(trim(coalesce(apt.status, ''))) = 'failed') > 0
     AND count(*) FILTER (WHERE lower(trim(coalesce(apt.status, ''))) = 'success') = 0
)
UPDATE public.produk_provider_map ppm
SET aktif = false,
    diubah_pada = now()
FROM failed_products fp
WHERE ppm.produk_id = fp.produk_id
  AND lower(trim(ppm.provider)) = 'pulsa24jam';
