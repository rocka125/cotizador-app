-- Safe to run any number of times, at any point in time. Handles the case
-- where rcampos@fortress8.com's auth user already existed BEFORE the
-- 0002 trigger was created (so the trigger never fired for them).
--
-- If this reports 0 rows updated, the auth user doesn't exist yet in
-- Supabase — create it once via Dashboard -> Authentication -> Users ->
-- Add user, then re-run this file (or just wait: the 0002 trigger will
-- set them to admin automatically the moment that account is created).

update public.profiles set role = 'admin' where email = 'rcampos@fortress8.com';
