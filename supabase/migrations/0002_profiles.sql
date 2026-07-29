-- Roles: every auth.users row gets a matching profiles row via trigger,
-- defaulting to 'vendedor' unless the email matches the bootstrap admin.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nombre text,
  role text not null default 'vendedor' check (role in ('admin','vendedor')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy profiles_select on public.profiles
  for select using (auth.uid() = id or public.is_admin());

create policy profiles_update_admin_only on public.profiles
  for update using (public.is_admin());

-- Deliberately no INSERT policy for authenticated/anon — rows are created
-- only by the trigger below, which runs as owner and bypasses RLS.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, nombre, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    case when new.email = 'rcampos@fortress8.com' then 'admin' else 'vendedor' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
