-- Unifies the PHP app's two audit tables (sesiones_auditoria +
-- auditoria_cotizaciones) into one with a `tipo` discriminator.
-- Deliberate modeling simplification -- not a loss of information.
-- Admin-only read. Insert requires logging your OWN action
-- (usuario_id = auth.uid() always holds), so no SECURITY DEFINER needed.

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('sesion','cotizacion')),
  usuario_id uuid references public.profiles(id),
  usuario_nombre text,               -- snapshot, survives user deletion
  accion text not null,              -- login|logout | crear|editar|eliminar|cambio_estado|enviar_email
  quote_id uuid references public.quotes(id) on delete set null,
  numero_cotizacion text,
  detalle jsonb,
  ip inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index on public.audit_log (created_at desc);
create index on public.audit_log (tipo);
create index on public.audit_log (quote_id);

alter table public.audit_log enable row level security;

create policy audit_select_admin_only on public.audit_log for select using (public.is_admin());

create policy audit_insert on public.audit_log for insert with check (usuario_id = auth.uid());
