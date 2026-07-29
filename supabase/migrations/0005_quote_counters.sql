-- Atomic per-year quote numbering: COT-YYYY-NNNN.
-- No RLS policies at all on quote_counters (default-deny) -- the only way
-- in is next_quote_number(), a SECURITY DEFINER function.

create table public.quote_counters (
  anio int primary key,
  ultimo int not null default 0
);

alter table public.quote_counters enable row level security;

create or replace function public.next_quote_number(p_anio int)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_ultimo int;
begin
  insert into public.quote_counters (anio, ultimo) values (p_anio, 1)
  on conflict (anio) do update set ultimo = quote_counters.ultimo + 1
  returning ultimo into v_ultimo;
  return 'COT-' || p_anio || '-' || lpad(v_ultimo::text, 4, '0');
end;
$$;

grant execute on function public.next_quote_number(int) to authenticated;
