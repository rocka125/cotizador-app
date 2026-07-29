-- Defensive/idempotent: wraps any rows in the OLD flat `price_list` table
-- (sheet, sku, "desc", price) into version 1 of the new versioned schema,
-- then renames the old table aside instead of dropping it (cheap rollback
-- safety net). No-ops cleanly if price_list doesn't exist or is empty --
-- verified via a live read-only check that it currently has 0 rows.

do $$
declare v_version_id uuid; v_count int;
begin
  if to_regclass('public.price_list') is null then
    return;
  end if;

  select count(*) into v_count from public.price_list;
  if v_count = 0 then
    alter table public.price_list rename to price_list_legacy;
    return;
  end if;

  insert into public.price_list_versions (nombre, descripcion, activa, total_skus)
  values (
    'Versión inicial (migrada)',
    'Migrado automáticamente desde la tabla plana price_list',
    true,
    v_count
  )
  returning id into v_version_id;

  insert into public.price_list_items (version_id, categoria, sku, descripcion, precio, activo)
  select v_version_id, sheet, sku, "desc", price, true from public.price_list;

  alter table public.price_list rename to price_list_legacy;
end $$;
