-- The source Fortinet Excel has a UNIT column (product/model name, e.g.
-- "FortiGate-30G") and up to five contract-term price columns (1/2/3/4/5Yr)
-- per SKU -- both silently dropped by the original importer, which only
-- kept whichever single price column it found first. This adds columns to
-- actually hold them.

alter table public.price_list_items
  add column unit_name text,
  add column precio_1yr numeric(12,2),
  add column precio_2yr numeric(12,2),
  add column precio_3yr numeric(12,2),
  add column precio_4yr numeric(12,2),
  add column precio_5yr numeric(12,2);

-- precio was "not null" because every row used to be forced into exactly
-- one price. A term-only SKU (a FortiCare/FortiGuard bundle with only
-- 1/3/5yr contract pricing, no flat price) legitimately has precio = null
-- now that the term prices have their own columns instead of overwriting it.
alter table public.price_list_items alter column precio drop not null;

-- active_price_list (0006) was created with `select pi.*` -- Postgres
-- expands that `*` into the literal column list AT CREATION TIME and
-- freezes it there, it does NOT pick up columns added to the underlying
-- table afterward. Recreating the view forces Postgres to re-expand `pi.*`
-- against price_list_items' current (now wider) column list.
create or replace view public.active_price_list as
  select pi.* from public.price_list_items pi
  join public.price_list_versions pv on pv.id = pi.version_id
  where pv.activa and pi.activo;
