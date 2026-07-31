-- Adds public.notifications to Supabase's Realtime publication so the bell
-- (NotificationBell.tsx) gets new rows pushed over a websocket the instant
-- they're inserted, instead of waiting for the next 45s poll. RLS still
-- applies to the realtime stream (notif_select: usuario_id = auth.uid()),
-- so this doesn't leak other users' notifications over the socket.
--
-- Wrapped in a guard because ALTER PUBLICATION ... ADD TABLE errors if the
-- table is already a member (e.g. re-running this migration).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
