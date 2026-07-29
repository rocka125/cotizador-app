-- "Seguimiento": CRM follow-up log per quote (llamada/email/visita/whatsapp/
-- nota/apertura_email). Scoped like quotes: admin sees all, vendedor sees
-- only followups on their own quotes.

create table public.quote_followups (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  usuario_id uuid not null references public.profiles(id),
  tipo text not null check (tipo in ('llamada','email','visita','whatsapp','nota','apertura_email')),
  descripcion text,
  fecha_contacto timestamptz not null default now(),
  proximo_contacto date,
  created_at timestamptz not null default now()
);

create index on public.quote_followups (quote_id);
create index on public.quote_followups (fecha_contacto);

alter table public.quote_followups enable row level security;

create policy qf_select on public.quote_followups for select using (
  public.is_admin() or exists (
    select 1 from public.quotes q where q.id = quote_id and q.usuario_id = auth.uid()
  )
);

create policy qf_insert on public.quote_followups for insert with check (
  usuario_id = auth.uid() and (
    public.is_admin() or exists (
      select 1 from public.quotes q where q.id = quote_id and q.usuario_id = auth.uid()
    )
  )
);

create policy qf_delete on public.quote_followups for delete using (
  public.is_admin() or usuario_id = auth.uid()
);
