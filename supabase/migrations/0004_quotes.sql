-- Redesigned quotes table (this table did not exist in the live project
-- before this migration -- verified via a read-only REST check, PGRST205).
-- moneda_code is a real enum (USD/MXN/EUR) matching the PHP source's three
-- supported currencies.

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  numero_cotizacion text unique not null,
  usuario_id uuid not null references public.profiles(id),
  fecha date not null default current_date,

  cliente_atencion text,
  cliente_puesto text,
  cliente_empresa text,

  empresa_nombre text,
  empresa_rfc text,
  empresa_direccion text,
  empresa_web text,
  empresa_email text,
  empresa_tel_oficina text,
  empresa_tel_movil text,

  vigencia_dias int default 30,
  tiempo_entrega text,
  condiciones_pago text,
  vigencia_servicios text,
  lugar_entrega text,

  moneda_code text not null default 'USD' check (moneda_code in ('USD','MXN','EUR')),
  tipo_cambio numeric(10,4),

  -- [{sku,descripcion,unidad,cantidad,precio_unitario,descuento,extendido,subtotal}]
  items jsonb not null default '[]',
  subtotal numeric(14,2) not null default 0,
  aplica_iva boolean not null default false,
  iva_porcentaje numeric(5,2) not null default 16,
  iva numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,

  firma_nombre text,
  firma_puesto text,
  firma_tel text,
  firma_img text,   -- base64 data URI
  sello_img text,   -- base64 data URI

  estado text not null default 'pendiente' check (estado in ('pendiente','aprobada','rechazada')),
  seguimiento_oculto boolean not null default false,
  email_token uuid,
  email_opened_at timestamptz,
  email_open_count int not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.quotes (usuario_id);
create index on public.quotes (estado);
create index on public.quotes (created_at desc);
create unique index on public.quotes (email_token) where email_token is not null;

alter table public.quotes enable row level security;

create policy quotes_select on public.quotes
  for select using (public.is_admin() or usuario_id = auth.uid());

create policy quotes_insert on public.quotes
  for insert with check (usuario_id = auth.uid());

create policy quotes_update on public.quotes
  for update using (public.is_admin() or usuario_id = auth.uid())
  with check (public.is_admin() or usuario_id = auth.uid());

create policy quotes_delete on public.quotes
  for delete using (
    public.is_admin() or (usuario_id = auth.uid() and estado = 'pendiente')
  );

-- RLS enforces row ownership (coarse); this trigger enforces the
-- fine-grained business rule that RLS can't express: which COLUMNS a
-- non-admin may change once a quote is no longer pendiente.
create or replace function public.enforce_quote_edit_rules()
returns trigger
language plpgsql
as $$
begin
  if not public.is_admin() then
    if OLD.estado <> 'pendiente' then
      if NEW.estado is distinct from OLD.estado
         or NEW.total is distinct from OLD.total
         or NEW.items is distinct from OLD.items
         or NEW.subtotal is distinct from OLD.subtotal then
        raise exception 'No puedes editar una cotización aprobada o rechazada';
      end if;
    elsif NEW.estado <> 'pendiente' then
      raise exception 'Solo un administrador puede cambiar el estado';
    end if;
  end if;
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_enforce_quote_edit_rules
  before update on public.quotes
  for each row execute function public.enforce_quote_edit_rules();
