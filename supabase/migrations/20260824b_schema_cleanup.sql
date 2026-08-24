-- Applied 2026-08-24, after the schema audit.
--
-- 1. Cut sheet upserts had nothing to conflict on. The only unique index was an
--    expression over COALESCE(half,''), which the client cannot target by
--    column name, so every upsert failed with "no unique or exclusion
--    constraint matching the ON CONFLICT specification". A customer's custom
--    cut request was accepted by the page, rejected by the database, and the
--    route still reported success.
alter table public.cut_sheet_answers
  add constraint cut_sheet_answers_session_section_half_key
  unique nulls not distinct (session_id, section, half);

drop index if exists public.cut_sheet_answers_session_section_half_idx;

-- 2. sessions had only its primary key, so every magic-link click scanned the
--    whole table, as did lookups by customer, animal and group.
create index if not exists sessions_access_token_idx   on public.sessions (access_token);
create index if not exists sessions_customer_id_idx    on public.sessions (customer_id);
create index if not exists sessions_animal_id_idx      on public.sessions (animal_id);
create index if not exists sessions_group_id_idx       on public.sessions (group_id);
create index if not exists sessions_status_idx         on public.sessions (status);

create index if not exists payments_session_id_idx            on public.payments (session_id);
create index if not exists notifications_session_id_idx       on public.notifications (session_id);
create index if not exists pickup_appointments_session_id_idx on public.pickup_appointments (session_id);
create index if not exists animal_costs_animal_id_idx         on public.animal_costs (animal_id);
create index if not exists animals_butcher_date_idx           on public.animals (butcher_date);

-- 3. These tables had row level security enabled with no policies at all, so
--    the intent was undocumented and any non-service-role read would silently
--    return nothing.
do $$
declare t text;
begin
  foreach t in array array['config','waitlist','push_subscriptions','animal_costs','invites']
  loop
    execute format(
      'create policy service_role_all_%1$s on public.%1$I for all to service_role using (true) with check (true)', t
    );
  end loop;
end $$;

-- 4. deposit_amount was an integer, so a deposit of $437.50 would silently
--    round. Every other dollar amount is numeric.
alter table public.sessions
  alter column deposit_amount type numeric(10,2) using deposit_amount::numeric(10,2);

-- 5. Chet-VPS was a separate, now-dead project sharing this database. Its six
--    objects are referenced by neither beef app. invites was superseded by
--    sessions.group_id and partner_emails and was empty.
--    Moved rather than dropped so they can be restored with:
--      alter table graveyard.<name> set schema public;
create schema if not exists graveyard;

alter table public.beef_competitor_prices set schema graveyard;
alter table public.futures_prices        set schema graveyard;
alter table public.market_alerts         set schema graveyard;
alter table public.sale_barn_results     set schema graveyard;
alter table public.usda_reports          set schema graveyard;
alter view  public.weekly_summaries      set schema graveyard;
alter table public.invites               set schema graveyard;
