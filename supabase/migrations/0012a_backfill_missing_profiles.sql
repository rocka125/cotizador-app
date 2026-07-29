-- Fixes the actual bug behind the "null value in column usuario_id"
-- error on 0013: the 0002 trigger only creates a profiles row when a NEW
-- row is inserted into auth.users. If rcampos@fortress8.com (or
-- carlos/iran) already existed as a Supabase Auth user BEFORE migration
-- 0002 ran, the trigger never fired for them, so they have an auth.users
-- row but no matching profiles row -- and the email lookup in 0013 quietly
-- returns null instead of erroring clearly.
--
-- Safe to run any number of times (WHERE NOT EXISTS guard). Backfills a
-- profiles row for every current auth.users row that's missing one, using
-- the same role-bootstrap rule as the 0002 trigger.

insert into public.profiles (id, email, nombre, role)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'nombre', split_part(u.email, '@', 1)),
  case when u.email = 'rcampos@fortress8.com' then 'admin' else 'vendedor' end
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-- Belt and suspenders: if rcampos's profile existed already but somehow
-- wasn't admin, fix that too (same as 0003).
update public.profiles set role = 'admin' where email = 'rcampos@fortress8.com';

-- Verification: run this file, then read the result below. You should see
-- exactly 3 rows, each with a non-null profile_id and the right role.
-- If a row is entirely MISSING (not even an auth_email), that Supabase Auth
-- user hasn't been created yet -- go create it in Dashboard -> Authentication
-- -> Users -> Add user with that EXACT email, then re-run this file.
select
  u.email as auth_email,
  p.id as profile_id,
  p.role as profile_role
from auth.users u
left join public.profiles p on p.id = u.id
where u.email in ('rcampos@fortress8.com', 'carlos@fortres8.com', 'iran12@gmail.com')
order by u.email;
