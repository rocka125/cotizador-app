-- Tags every notification with a `tipo` so the bell can play a distinct
-- sound per kind of event (see src/lib/notifSound.ts) instead of one
-- generic ping for everything. Run this AFTER 0018_quote_alerts.sql --
-- it re-creates the two functions that migration adds, plus
-- record_email_open() from 0016, so all three start stamping tipo.

alter table public.notifications
  add column tipo text check (tipo in (
    'creacion', 'edicion', 'eliminacion', 'estado',
    'email_abierto', 'nota_ajena', 'urgente', 'vigencia'
  ));

-- ── record_email_open() (0016) -- adds tipo = 'email_abierto' ─────────────
create or replace function public.record_email_open(
  p_token uuid, p_ip text, p_ua text, p_es_proxy boolean
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_quote_id uuid;
  v_owner uuid;
  v_numero text;
  v_cliente text;
  v_already_opened boolean;
begin
  select id, usuario_id, numero_cotizacion, coalesce(nullif(cliente_empresa, ''), cliente_atencion),
         (email_opened_at is not null)
    into v_quote_id, v_owner, v_numero, v_cliente, v_already_opened
    from public.quotes where email_token = p_token;

  if v_quote_id is null then
    return;
  end if;

  insert into public.email_opens (quote_id, email_token, ip, user_agent, es_proxy)
  values (v_quote_id, p_token, nullif(p_ip, '')::inet, p_ua, p_es_proxy);

  if not v_already_opened then
    update public.quotes
      set email_opened_at = now(),
          email_open_count = email_open_count + 1
      where id = v_quote_id;

    insert into public.quote_followups (quote_id, usuario_id, tipo, descripcion)
      values (
        v_quote_id, v_owner, 'apertura_email',
        '👁 Cotización ' || v_numero || ' abierta por el cliente' ||
          case when v_cliente is not null and v_cliente <> '' then ' (' || v_cliente || ')' else '' end
      );

    if v_owner is not null then
      insert into public.notifications (usuario_id, quote_id, mensaje, creado_por, tipo)
        values (v_owner, v_quote_id, '👁 Correo abierto — ' || v_numero || ': ' || coalesce(v_cliente, 'el cliente') || ' abrió la cotización.', null, 'email_abierto');
    end if;
  else
    update public.quotes set email_open_count = email_open_count + 1 where id = v_quote_id;
  end if;
end;
$$;

-- ── notify_owner_on_foreign_followup() (0018) -- adds tipo = 'nota_ajena' ─
create or replace function public.notify_owner_on_foreign_followup()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_owner uuid;
  v_numero text;
begin
  select usuario_id, numero_cotizacion into v_owner, v_numero
    from public.quotes where id = new.quote_id;

  if v_owner is not null and v_owner <> new.usuario_id then
    insert into public.notifications (usuario_id, quote_id, mensaje, creado_por, tipo)
      values (
        v_owner, new.quote_id,
        '📝 Nueva nota (' || new.tipo || ') en ' || coalesce(v_numero, 'una cotización'),
        new.usuario_id, 'nota_ajena'
      );
  end if;
  return new;
end;
$$;

-- ── check_quote_alerts() (0018) -- adds tipo = 'urgente' / 'vigencia' ─────
create or replace function public.check_quote_alerts()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r record;
begin
  for r in
    select q.id, q.usuario_id, q.numero_cotizacion, q.cliente_empresa,
           coalesce(max(f.fecha_contacto), q.created_at) as ultimo_contacto
      from public.quotes q
      left join public.quote_followups f on f.quote_id = q.id
     where q.seguimiento_oculto = false
       and (q.urgente_notificado_at is null or q.urgente_notificado_at < now() - interval '3 days')
     group by q.id, q.usuario_id, q.numero_cotizacion, q.cliente_empresa, q.urgente_notificado_at
    having now() - coalesce(max(f.fecha_contacto), q.created_at) >= interval '5 days'
  loop
    insert into public.notifications (usuario_id, quote_id, mensaje, creado_por, tipo)
      values (
        r.usuario_id, r.id,
        '⏰ ' || r.numero_cotizacion || ' lleva ' ||
          extract(day from now() - r.ultimo_contacto)::int || ' días sin seguimiento' ||
          case when coalesce(r.cliente_empresa, '') <> '' then ' (' || r.cliente_empresa || ')' else '' end,
        null, 'urgente'
      );
    update public.quotes set urgente_notificado_at = now() where id = r.id;
  end loop;

  for r in
    select q.id, q.usuario_id, q.numero_cotizacion, q.cliente_empresa,
           (q.fecha::timestamptz + (coalesce(q.vigencia_dias, 30)::text || ' days')::interval) as fecha_vence
      from public.quotes q
     where q.seguimiento_oculto = false
       and q.estado = 'pendiente'
       and q.vigencia_alertada_at is null
       and (q.fecha::timestamptz + (coalesce(q.vigencia_dias, 30)::text || ' days')::interval)
             between now() and now() + interval '3 days'
  loop
    insert into public.notifications (usuario_id, quote_id, mensaje, creado_por, tipo)
      values (
        r.usuario_id, r.id,
        '📅 ' || r.numero_cotizacion || ' vence el ' || to_char(r.fecha_vence, 'DD/MM/YYYY') ||
          case when coalesce(r.cliente_empresa, '') <> '' then ' (' || r.cliente_empresa || ')' else '' end,
        null, 'vigencia'
      );
    update public.quotes set vigencia_alertada_at = now() where id = r.id;
  end loop;
end;
$$;
