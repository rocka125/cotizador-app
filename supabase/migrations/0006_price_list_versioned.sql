-- Versioned price lists: imports always create a NEW version, never mutate
-- an existing one in place. Only one version can be "activa" at a time,
-- enforced at the DB level (not just app code) via a unique partial index.

create table public.price_list_versions (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  activa boolean not null default false,
  total_skus int not null default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create unique index one_active_price_list_version
  on public.price_list_versions (activa) where activa;

create table public.price_list_items (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.price_list_versions(id) on delete cascade,
  categoria text not null,      -- Excel sheet name, e.g. "FortiGate"
  sku text not null,
  descripcion text,
  precio numeric(12,2) not null,
  activo boolean not null default true,
  unique (version_id, sku)
);

create index on public.price_list_items (version_id, categoria);

-- Convenience view so read call sites stay simple: "give me the active list".
create view public.active_price_list as
  select pi.* from public.price_list_items pi
  join public.price_list_versions pv on pv.id = pi.version_id
  where pv.activa and pi.activo;

alter table public.price_list_versions enable row level security;
alter table public.price_list_items enable row level security;

create policy plv_select on public.price_list_versions for select using (true);
create policy plv_write  on public.price_list_versions
  for all using (public.is_admin()) with check (public.is_admin());

create policy pli_select on public.price_list_items for select using (true);
create policy pli_write  on public.price_list_items
  for all using (public.is_admin()) with check (public.is_admin());

-- One function call = one transaction, so the deactivate-all-then-activate-one
-- switch is atomic even without SECURITY DEFINER (still needs admin's own
-- RLS grant, which plv_write already provides).
create or replace function public.activate_price_list_version(p_id uuid)
returns void
language plpgsql
as $$
begin
  if not exists (select 1 from public.price_list_versions where id = p_id) then
    raise exception 'Versión no encontrada';
  end if;
  update public.price_list_versions set activa = false where activa and id <> p_id;
  update public.price_list_versions set activa = true where id = p_id;
end;
$$;

grant execute on function public.activate_price_list_version(uuid) to authenticated;

create or replace function public.prevent_delete_active_version()
returns trigger
language plpgsql
as $$
begin
  if OLD.activa then
    raise exception 'No puedes eliminar la versión activa';
  end if;
  return OLD;
end;
$$;

create trigger trg_prevent_delete_active_version
  before delete on public.price_list_versions
  for each row execute function public.prevent_delete_active_version();
