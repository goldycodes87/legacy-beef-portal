-- Applied 2026-08-24.
--
-- The admin app archives a finished butcher date by setting animals.status to
-- 'archived', and filters lists with .neq('status','archived'). The check
-- constraint never allowed that value, so every archive — manual or automatic —
-- failed with a constraint violation. Manual archiving surfaced as a 500; the
-- automatic pass swallowed the error, so a finished date simply stayed put with
-- no explanation.

alter table public.animals drop constraint if exists animals_status_check;

alter table public.animals add constraint animals_status_check
  check (status = any (array[
    'available'::text,
    'pending'::text,
    'butchered'::text,
    'ready'::text,
    'delivered'::text,
    'archived'::text
  ]));
