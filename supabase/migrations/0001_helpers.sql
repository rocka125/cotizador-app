-- Helper functions shared by RLS policies across every table.
-- Run this file first.

-- Written in plpgsql (not sql) on purpose: plpgsql function bodies are only
-- validated against the catalog at first CALL, not at CREATE FUNCTION time,
-- so this can be created here even though public.profiles doesn't exist
-- until migration 0002 runs. A `language sql` version would fail to create.
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$;

grant execute on function public.is_admin() to authenticated, anon;
