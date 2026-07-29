-- Fixes record_email_open() to match the real PHP app's API/api_track_open.php
-- logic exactly (read from the actual source file, not just from memory):
--
-- The original 0010 version wrongly gated the whole first-open update behind
-- "not proxy" -- meaning a quote opened for the first time via a Gmail/
-- Outlook image proxy (the overwhelmingly common case) would NEVER get
-- marked as opened at all. The PHP app's own comment explains why that's
-- wrong: "Gmail y Outlook precargan las imágenes a través de sus proxies.
-- Para clientes externos esto ES la apertura real -- si no contamos el
-- proxy nunca registraríamos la apertura porque todo pasa por el proxy de
-- Gmail." So: the FIRST hit ever (proxy or not) always counts as the real
-- open. es_proxy is recorded on the email_opens row purely for stats.
-- Subsequent hits just increment email_open_count, again regardless of proxy.

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
    return; -- unknown/expired token: no-op, caller still returns the pixel image
  end if;

  insert into public.email_opens (quote_id, email_token, ip, user_agent, es_proxy)
  values (v_quote_id, p_token, nullif(p_ip, '')::inet, p_ua, p_es_proxy);

  if not v_already_opened then
    -- First open ever (proxy or not) -- the real signal the user cares about.
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

    -- In-app notification for the owner -- stands in for the PHP app's Web
    -- Push here (push notifications are explicitly out of scope for now).
    if v_owner is not null then
      insert into public.notifications (usuario_id, quote_id, mensaje, creado_por)
        values (v_owner, v_quote_id, '👁 Correo abierto — ' || v_numero || ': ' || coalesce(v_cliente, 'el cliente') || ' abrió la cotización.', null);
    end if;
  else
    -- Already opened before -- just count this additional hit.
    update public.quotes set email_open_count = email_open_count + 1 where id = v_quote_id;
  end if;
end;
$$;
