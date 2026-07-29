-- The quote CRUD routes need to notify admins when a vendedor creates/edits
-- a quote, and to show "owner: carlos" on dossier cards / audit trails --
-- both require reading OTHER users' id/email/nombre/role, not just your own.
-- The original 0002 policy (auth.uid() = id or is_admin()) blocks a
-- vendedor from seeing anyone else's profile row at all, which breaks this.
--
-- Profiles here only hold id/email/nombre/role (no passwords, no other
-- PII) and names/emails already surface everywhere in the shared UI
-- (dossier cards, audit log usuario_nombre, seguimiento) -- for a small
-- internal team tool, hiding the profiles table itself while denormalizing
-- names everywhere else is inconsistent. Open read for any authenticated
-- user; writes remain admin-only (profiles_update_admin_only, unchanged).

drop policy if exists profiles_select on public.profiles;

create policy profiles_select on public.profiles
  for select using (auth.role() = 'authenticated');
