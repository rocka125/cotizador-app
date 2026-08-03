-- Adds 'mensaje' to notifications.tipo so an admin can send a vendor a
-- standalone personalized note about their quote (distinct from the
-- automatic creacion/edicion/estado notifications). The check constraint
-- from 0019 was added inline without an explicit name, so it's located
-- dynamically here instead of hardcoding Postgres's auto-generated name.

do $$
declare
  con_name text;
begin
  select con.conname into con_name
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
   where rel.relname = 'notifications'
     and con.contype = 'c'
     and pg_get_constraintdef(con.oid) ilike '%tipo%';

  if con_name is not null then
    execute format('alter table public.notifications drop constraint %I', con_name);
  end if;
end $$;

alter table public.notifications
  add constraint notifications_tipo_check check (tipo in (
    'creacion', 'edicion', 'eliminacion', 'estado',
    'email_abierto', 'nota_ajena', 'urgente', 'vigencia', 'mensaje'
  ));
