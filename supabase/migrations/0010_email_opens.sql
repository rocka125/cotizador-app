-- Email open tracking. No insert policy at all for anon/authenticated --
-- the ONLY way a row lands here is record_email_open(), a SECURITY DEFINER
-- function, called by the public tracking-pixel route using the plain
-- anon-key client (the recipient's mail client has no Supabase session).
-- Ports the PHP app's proxy-vs-real-human open detection: only non-proxy
-- hits bump the denormalized counters on quotes and auto-log a followup.

create table public.email_opens (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references public.quotes(id) on delete cascade,
  email_token uuid not null,
  ip inet,
  user_agent text,
  es_proxy boolean not null default false,
  opened_at timestamptz not null default now()
);

alter table public.email_opens enable row level security;

create policy email_opens_select_admin on public.email_opens for select using (public.is_admin());

create or replace function public.record_email_open(
  p_token uuid, p_ip text, p_ua text, p_es_proxy boolean
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_quote_id uuid; v_owner uuid;
begin
  select id, usuario_id into v_quote_id, v_owner from public.quotes where email_token = p_token;
  if v_quote_id is null then
    return; -- unknown/expired token: no-op, caller still returns the pixel image
  end if;

  insert into public.email_opens (quote_id, email_token, ip, user_agent, es_proxy)
  values (v_quote_id, p_token, nullif(p_ip, '')::inet, p_ua, p_es_proxy);

  if not p_es_proxy then
    update public.quotes
      set email_opened_at = coalesce(email_opened_at, now()),
          email_open_count = email_open_count + 1
      where id = v_quote_id;

    insert into public.quote_followups (quote_id, usuario_id, tipo, descripcion)
      values (v_quote_id, v_owner, 'apertura_email', 'Apertura de correo detectada');
  end if;
end;
$$;

grant execute on function public.record_email_open(uuid, text, text, boolean) to anon, authenticated;
