\set ON_ERROR_STOP on
BEGIN;
DO $$ BEGIN
  IF to_regclass('public.member') IS NOT NULL THEN
    RAISE EXCEPTION 'Fresh installation requires an empty database; existing data will not be replaced';
  END IF;
END $$;

\ir ../pulsa-be/sql/00000000_local_bootstrap_full_schema.sql
\ir ../pulsa-be/sql/20260320_create_bank_tables.sql
\ir ../pulsa-be/sql/20260715_add_produk_app_pricing_compat_columns.sql
\ir ../pulsa-be/sql/20260717_fix_app_order_guest_refund_schema.sql
\ir ../pulsa-be/sql/20260718_fix_internal_finance_schema.sql
\ir ../pulsa-be/sql/20260718_fix_local_schema_compat.sql
\ir ../pulsa-be/sql/20260718_fix_provider_rekening_schema.sql
\ir ../pulsa-be/sql/20260724_add_member_phone.sql
\ir ../pulsa-be/sql/20260724_create_agent_credit_schema.sql
\ir ../pulsa-be/sql/20260727_add_agent_credit_analyst_workflow.sql
\ir ../pulsa-be/sql/20260729_add_member_profile_photo.sql
\ir ../pulsa-be/sql/20260801_update_agent_credit_level_limits.sql
\ir ../pulsa-be/sql/20260804_agent_credit_available_balance.sql
\ir ../pulsa-be/sql/20260804_reduce_agent_credit_levels.sql
\ir ../pulsa-be/sql/20260806_align_agent_credit_workflow.sql
\ir ../pulsa-be/sql/20260808_retail_withdraw_funding_source.sql
\ir ../pulsa-be/sql/20260821_add_marketing_agent_relation.sql
\ir ../pulsa-be/sql/20260821_enforce_single_agent_balance.sql
\ir ../pulsa-be/sql/20260824_agent_credit_flexible_limit.sql
\ir ../pulsa-be/sql/20260828_add_member_store_name.sql

UPDATE public.provider SET aktif = false;
UPDATE public.kategori SET aktif = false;
UPDATE public.brand SET aktif = false;
COMMIT;

\ir ../pulsa-be/sql/20261108_refresh_pulsa24jam_h2hr_catalog.sql

BEGIN;
CREATE TABLE public.schema_migrations (
  filename TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.schema_migrations (filename)
VALUES ('topuna-fresh.sql'), ('20261108_refresh_pulsa24jam_h2hr_catalog.sql');
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.member)
    OR EXISTS (SELECT 1 FROM public.dompet_member)
    OR EXISTS (SELECT 1 FROM public.mutasi_dompet)
    OR EXISTS (SELECT 1 FROM public.bank)
    OR EXISTS (SELECT 1 FROM public.app_order) THEN
    RAISE EXCEPTION 'Fresh database must not contain accounts, money, banks, or orders';
  END IF;
  IF (SELECT count(*) FROM public.produk_app_pricing WHERE provider = 'pulsa24jam') <> 15296 THEN
    RAISE EXCEPTION 'Incomplete H2HR catalog';
  END IF;
END $$;
COMMIT;
