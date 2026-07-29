-- In-app notification inbox (bell dropdown). No service-role key needed:
-- any authenticated user may insert a notification FOR SOMEONE ELSE as long
-- as they stamp themselves as creado_por -- this is what lets a vendedor's
-- action notify admins and an admin's action notify the quote owner.
-- Worst-case abuse is a logged-in user spamming notifications, always
-- attributable via creado_por -- low severity, acceptable tradeoff.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.profiles(id),
  quote_id uuid references public.quotes(id) on delete cascade,
  mensaje text not null,
  leido boolean not null default false,
  creado_por uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index on public.notifications (usuario_id, leido);

alter table public.notifications enable row level security;

create policy notif_select on public.notifications for select using (usuario_id = auth.uid());

create policy notif_update on public.notifications for update
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

create policy notif_insert on public.notifications for insert with check (creado_por = auth.uid());
