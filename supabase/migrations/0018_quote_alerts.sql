-- Three new in-app notification triggers, on top of the existing ones
-- (email opened, admin decision, quote created/edited by a non-admin):
--
--   1. "Urgente sin seguimiento" -- a quote with no contact in 5+ days,
--      mirroring the Seguimiento board's own "Urgente" badge logic
--      (SeguimientoBoard.tsx: daysSince(lastContactAt ?? created_at) >= 5).
--      Throttled to one notification every 3 days per quote so it doesn't
--      spam the owner daily while it stays urgent.
--   2. "Por vencer" -- a still-pending quote whose vigencia_dias window
--      runs out within 3 days. Fires once (vigencia_alertada_at is a
--      one-shot flag, not throttled/repeated like the urgent one).
--   3. "Nota de otro usuario" -- event-driven, not time-based: whenever
--      someone other than the quote's owner adds a quote_followups entry
--      (e.g. an admin logging a call on a vendedor's quote), notify the
--      owner immediately via an AFTER INSERT trigger.
--
-- 1 and 2 are time-based (nothing INSERTs/UPDATEs to hang a trigger off of)
-- so they're driven by check_quote_alerts(), called periodically by the
-- Vercel Cron job at /api/cron/quote-alerts.

alter table public.quotes
  add column urgente_notificado_at timestamptz,
  add column vigencia_alertada_at timestamptz;

-- ── 3. Nota de otro usuario -> notifica al dueño de inmediato ──────────────
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

  -- Own note (including the apertura_email auto-note, always logged under
  -- the owner's own usuario_id -- see record_email_open()) never notifies.
  if v_owner is not null and v_owner <> new.usuario_id then
    insert into public.notifications (usuario_id, quote_id, mensaje, creado_por)
      values (
        v_owner, new.quote_id,
        '📝 Nueva nota (' || new.tipo || ') en ' || coalesce(v_numero, 'una cotización'),
        new.usuario_id
      );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_owner_on_foreign_followup on public.quote_followups;
create trigger trg_notify_owner_on_foreign_followup
  after insert on public.quote_followups
  for each row execute function public.notify_owner_on_foreign_followup();

-- ── 1 & 2. Alertas por tiempo -- llamadas periódicamente por el cron ───────
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
    insert into public.notifications (usuario_id, quote_id, mensaje, creado_por)
      values (
        r.usuario_id, r.id,
        '⏰ ' || r.numero_cotizacion || ' lleva ' ||
          extract(day from now() - r.ultimo_contacto)::int || ' días sin seguimiento' ||
          case when coalesce(r.cliente_empresa, '') <> '' then ' (' || r.cliente_empresa || ')' else '' end,
        null
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
    insert into public.notifications (usuario_id, quote_id, mensaje, creado_por)
      values (
        r.usuario_id, r.id,
        '📅 ' || r.numero_cotizacion || ' vence el ' || to_char(r.fecha_vence, 'DD/MM/YYYY') ||
          case when coalesce(r.cliente_empresa, '') <> '' then ' (' || r.cliente_empresa || ')' else '' end,
        null
      );
    update public.quotes set vigencia_alertada_at = now() where id = r.id;
  end loop;
end;
$$;

-- Called from the cron route using the plain anon-key client (no user
-- session in a scheduled job) -- same trust model as record_email_open().
grant execute on function public.check_quote_alerts() to anon, authenticated;
