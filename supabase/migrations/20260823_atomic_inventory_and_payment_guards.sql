-- Applied 2026-08-23.
--
-- 1. Atomic inventory. Booking used to read units_used, add to it in
--    JavaScript, and write it back, so two concurrent bookings could both
--    claim the last slot (and cancel/move could lose an update the same way).
-- 2. Payment guards. Backstops the application-level checks so a retry or a
--    double click cannot record two real deposits or two real balances.

create or replace function public.adjust_animal_units(
  p_animal_id uuid,
  p_delta numeric
)
returns numeric
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_total numeric;
  v_used  numeric;
  v_new   numeric;
begin
  -- Row lock serialises concurrent callers.
  select coalesce(total_animals, 0), coalesce(units_used, 0)
    into v_total, v_used
  from public.animals
  where id = p_animal_id
  for update;

  if not found then
    raise exception 'animal_not_found';
  end if;

  v_new := v_used + p_delta;

  if v_new < 0 then
    v_new := 0;
  end if;

  if v_new > v_total then
    raise exception 'insufficient_capacity';
  end if;

  update public.animals set units_used = v_new where id = p_animal_id;
  return v_new;
end;
$$;

grant execute on function public.adjust_animal_units(uuid, numeric) to service_role;

-- Zero-dollar rows are excluded: they are artifacts of the auto-settle job,
-- not payments, and must not block a genuine deposit later.
create unique index if not exists payments_one_paid_deposit_per_session
  on public.payments (session_id)
  where type = 'deposit' and status = 'paid' and amount_cents > 0;

create unique index if not exists payments_one_paid_balance_per_session
  on public.payments (session_id)
  where type = 'balance' and status = 'paid' and amount_cents > 0;
