-- ============================================================================
-- Legacy Land & Cattle — database schema
--
-- GENERATED FROM PRODUCTION on 2026-08-24. Do not hand-edit.
--
-- The previous version of this file was a snapshot of the very first build and
-- had drifted badly: it described 6 tables when production had 22, forbade
-- quarter beef, forbade most order statuses, required a slot_id the booking
-- code stopped setting, and did not allow the animal statuses the admin app
-- writes. Running it would have produced a system unable to take an order.
--
-- To regenerate after a schema change, dump the live database rather than
-- editing this by hand. Every change should also land as a dated file in
-- supabase/migrations/ so the history is reconstructable.
--
-- Not included here, deliberately:
--   * snapshot_20260824  — pre-cleanup data snapshot, safe to drop later
--   * graveyard          — retired tables kept for recovery
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------
-- CUSTOMERS
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id                             uuid NOT NULL DEFAULT uuid_generate_v4(),
  name                           text NOT NULL,
  email                          text NOT NULL,
  phone                          text NOT NULL,
  address                        text NOT NULL,
  created_at                     timestamp with time zone DEFAULT now(),
  city                           text,
  state                          text,
  zip                            text,
  archived_at                    timestamp with time zone,
  stripe_customer_id             text   -- retired; Stripe is no longer used
);

ALTER TABLE customers ADD CONSTRAINT customers_pkey PRIMARY KEY (id);
ALTER TABLE customers ADD CONSTRAINT customers_email_key UNIQUE (email);
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------
-- ANIMALS  (one row per butcher date and animal type)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS animals (
  id                             uuid NOT NULL DEFAULT uuid_generate_v4(),
  name                           text NOT NULL,
  type                           text NOT NULL,
  butcher_date                   date,
  estimated_ready_date           date,
  status                         text NOT NULL DEFAULT 'pending'::text,
  hanging_weight_lbs             integer,
  price_per_lb                   numeric(6,2),
  created_at                     timestamp with time zone DEFAULT now(),
  animal_type                    text DEFAULT 'grass_fed'::text,
  wagyu_active                   boolean DEFAULT false,
  -- slots_* are the original capacity model, superseded by total_animals and
  -- units_used. Nothing reads them.
  slots_whole                    integer DEFAULT 0,
  slots_half                     integer DEFAULT 0,
  slots_quarter                  integer DEFAULT 0,
  slots_whole_used               integer DEFAULT 0,
  slots_half_used                integer DEFAULT 0,
  slots_quarter_used             integer DEFAULT 0,
  total_animals                  integer DEFAULT 1,
  units_used                     numeric(10,2) DEFAULT 0.00,
  home_raised                    boolean DEFAULT false
);

ALTER TABLE animals ADD CONSTRAINT animals_pkey PRIMARY KEY (id);
ALTER TABLE animals ADD CONSTRAINT animals_type_check
  CHECK ((type = ANY (ARRAY['whole'::text, 'half'::text])));
ALTER TABLE animals ADD CONSTRAINT animals_status_check
  CHECK ((status = ANY (ARRAY['available'::text, 'pending'::text, 'butchered'::text,
                              'ready'::text, 'delivered'::text, 'archived'::text])));

CREATE INDEX IF NOT EXISTS animals_butcher_date_idx ON public.animals USING btree (butcher_date);
ALTER TABLE animals ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------
-- BUTCHER_SLOTS  (retired capacity model; kept only for the sessions.slot_id
-- foreign key on historical rows)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS butcher_slots (
  id                             uuid NOT NULL DEFAULT uuid_generate_v4(),
  animal_id                      uuid NOT NULL,
  slot_type                      text NOT NULL,
  status                         text NOT NULL DEFAULT 'available'::text,
  customer_id                    uuid,
  created_at                     timestamp with time zone DEFAULT now(),
  animal_type                    text,
  purchase_type                  text
);

ALTER TABLE butcher_slots ADD CONSTRAINT butcher_slots_pkey PRIMARY KEY (id);
ALTER TABLE butcher_slots ADD CONSTRAINT butcher_slots_animal_id_fkey
  FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE;
ALTER TABLE butcher_slots ADD CONSTRAINT butcher_slots_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES customers(id);
ALTER TABLE butcher_slots ADD CONSTRAINT butcher_slots_slot_type_check
  CHECK ((slot_type = ANY (ARRAY['whole'::text, 'half_a'::text, 'half_b'::text])));
ALTER TABLE butcher_slots ADD CONSTRAINT butcher_slots_status_check
  CHECK ((status = ANY (ARRAY['available'::text, 'booked'::text, 'processing'::text])));
ALTER TABLE butcher_slots ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------
-- SESSIONS  (one reservation)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  id                             uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id                    uuid NOT NULL,
  slot_id                        uuid,          -- retired, always null on new rows
  animal_id                      uuid NOT NULL,
  purchase_type                  text NOT NULL,
  status                         text NOT NULL DEFAULT 'draft'::text,
  partner_session_id             uuid,
  partner_email                  text,          -- superseded by partner_emails
  partner_approved               boolean DEFAULT false,
  owner_approved                 boolean DEFAULT false,
  created_at                     timestamp with time zone DEFAULT now(),
  last_saved                     timestamp with time zone DEFAULT now(),
  group_id                       uuid,
  group_role                     text DEFAULT 'solo'::text,
  group_size                     integer DEFAULT 1,
  discount_applied               boolean DEFAULT false,  -- superseded by discount_amount
  invite_expires_at              timestamp with time zone,
  partner_emails                 text[],
  contract_signed                boolean DEFAULT false,
  contract_signed_at             timestamp with time zone,
  contract_ip                    text,
  contract_signature             text,
  contract_version               text DEFAULT '2026-v1'::text,
  is_splitting                   boolean DEFAULT false,
  deposit_amount                 numeric(10,2),  -- dollars quoted at booking
  cut_sheet_role                 text DEFAULT 'solo'::text,
  cut_sheet_partner_session_id   uuid,
  cut_sheet_approved             boolean DEFAULT false,
  cut_sheet_approved_at          timestamp with time zone,
  cut_sheet_complete             boolean DEFAULT false,
  cut_sheet_locked_at            timestamp with time zone,
  access_token                   text,
  access_token_expires_at        timestamp with time zone,
  hanging_weight_lbs             numeric(8,2),
  balance_due                    numeric(10,2),
  balance_paid                   boolean DEFAULT false,
  balance_paid_at                timestamp with time zone,
  balance_payment_method         text,
  beef_ready_at                  timestamp with time zone,
  price_per_lb                   numeric(10,2),  -- price quoted at booking
  admin_notes                    text,
  partner_names                  text[] DEFAULT '{}'::text[],
  intended_payment_method        text DEFAULT 'card'::text,
  discount_amount                numeric(10,2) DEFAULT 0,
  discount_note                  text,
  last_viewed_at                 timestamp with time zone,
  nudge_sent_at                  timestamp with time zone,
  dual_cut_sheet                 boolean DEFAULT false,
  half_a_complete                boolean DEFAULT false,
  half_b_complete                boolean DEFAULT false,
  half_a_locked_at               timestamp with time zone,
  half_b_locked_at               timestamp with time zone
);

ALTER TABLE sessions ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);
ALTER TABLE sessions ADD CONSTRAINT sessions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id);
ALTER TABLE sessions ADD CONSTRAINT sessions_animal_id_fkey FOREIGN KEY (animal_id) REFERENCES animals(id);
ALTER TABLE sessions ADD CONSTRAINT sessions_slot_id_fkey FOREIGN KEY (slot_id) REFERENCES butcher_slots(id);
ALTER TABLE sessions ADD CONSTRAINT sessions_partner_session_id_fkey FOREIGN KEY (partner_session_id) REFERENCES sessions(id);
ALTER TABLE sessions ADD CONSTRAINT sessions_cut_sheet_partner_session_id_fkey FOREIGN KEY (cut_sheet_partner_session_id) REFERENCES sessions(id);
ALTER TABLE sessions ADD CONSTRAINT sessions_purchase_type_check
  CHECK ((purchase_type = ANY (ARRAY['whole'::text, 'half'::text, 'quarter'::text])));
ALTER TABLE sessions ADD CONSTRAINT sessions_status_check
  CHECK ((status = ANY (ARRAY['draft'::text, 'in_progress'::text, 'complete'::text,
                              'locked'::text, 'processing'::text, 'beef_ready'::text,
                              'deposit_paid'::text, 'cancelled'::text, 'payment_pending'::text,
                              'paid_in_full'::text, 'picked_up'::text])));

CREATE INDEX IF NOT EXISTS sessions_access_token_idx ON public.sessions USING btree (access_token);
CREATE INDEX IF NOT EXISTS sessions_animal_id_idx    ON public.sessions USING btree (animal_id);
CREATE INDEX IF NOT EXISTS sessions_customer_id_idx  ON public.sessions USING btree (customer_id);
CREATE INDEX IF NOT EXISTS sessions_group_id_idx     ON public.sessions USING btree (group_id);
CREATE INDEX IF NOT EXISTS sessions_status_idx       ON public.sessions USING btree (status);
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------
-- PAYMENTS
-- amount_cents includes the card surcharge; surcharge_cents records how much
-- of it was the processing fee. Money toward beef is the difference.
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id                             uuid NOT NULL DEFAULT uuid_generate_v4(),
  session_id                     uuid NOT NULL,
  type                           text NOT NULL,
  method                         text NOT NULL,
  amount_cents                   integer NOT NULL,
  surcharge_cents                integer NOT NULL DEFAULT 0,
  status                         text NOT NULL DEFAULT 'pending'::text,
  stripe_payment_intent_id       text,   -- retired; Stripe is no longer used
  paid_at                        timestamp with time zone,
  created_at                     timestamp with time zone DEFAULT now(),
  check_number                   text,
  square_payment_id              text
);

ALTER TABLE payments ADD CONSTRAINT payments_pkey PRIMARY KEY (id);
ALTER TABLE payments ADD CONSTRAINT payments_session_id_fkey FOREIGN KEY (session_id) REFERENCES sessions(id);
ALTER TABLE payments ADD CONSTRAINT payments_type_check
  CHECK ((type = ANY (ARRAY['deposit'::text, 'balance'::text])));
ALTER TABLE payments ADD CONSTRAINT payments_method_check
  CHECK ((method = ANY (ARRAY['card'::text, 'echeck'::text, 'cash'::text, 'check'::text])));
ALTER TABLE payments ADD CONSTRAINT payments_status_check
  CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'waived'::text])));

-- At most one real paid deposit and one real paid balance per reservation.
-- Zero-dollar rows are auto-settle artifacts and are excluded.
CREATE UNIQUE INDEX IF NOT EXISTS payments_one_paid_deposit_per_session
  ON public.payments USING btree (session_id)
  WHERE ((type = 'deposit'::text) AND (status = 'paid'::text) AND (amount_cents > 0));
CREATE UNIQUE INDEX IF NOT EXISTS payments_one_paid_balance_per_session
  ON public.payments USING btree (session_id)
  WHERE ((type = 'balance'::text) AND (status = 'paid'::text) AND (amount_cents > 0));
CREATE INDEX IF NOT EXISTS payments_session_id_idx ON public.payments USING btree (session_id);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------
-- CUT_SHEET_ANSWERS
-- half is 'A' or 'B' for a split cut sheet, otherwise null. NULLS NOT
-- DISTINCT so a null half still conflicts, which is what upserts rely on.
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cut_sheet_answers (
  id                             uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id                     uuid NOT NULL,
  section                        text NOT NULL,
  answers                        jsonb DEFAULT '{}'::jsonb,
  completed                      boolean DEFAULT false,
  locked                         boolean DEFAULT false,
  custom_request                 text,
  custom_request_status          text DEFAULT 'pending'::text,
  updated_at                     timestamp with time zone DEFAULT now(),
  half                           text
);

ALTER TABLE cut_sheet_answers ADD CONSTRAINT cut_sheet_answers_pkey PRIMARY KEY (id);
ALTER TABLE cut_sheet_answers ADD CONSTRAINT cut_sheet_answers_session_id_fkey
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE;
ALTER TABLE cut_sheet_answers ADD CONSTRAINT cut_sheet_answers_session_section_half_key
  UNIQUE NULLS NOT DISTINCT (session_id, section, half);

CREATE INDEX IF NOT EXISTS cut_sheet_answers_session_id_idx ON public.cut_sheet_answers USING btree (session_id);
ALTER TABLE cut_sheet_answers ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------
-- NOTIFICATIONS
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id                             uuid NOT NULL DEFAULT uuid_generate_v4(),
  session_id                     uuid NOT NULL,
  type                           text NOT NULL,
  channel                        text NOT NULL,
  sent_at                        timestamp with time zone,
  status                         text NOT NULL DEFAULT 'pending'::text
);

ALTER TABLE notifications ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
ALTER TABLE notifications ADD CONSTRAINT notifications_session_id_fkey FOREIGN KEY (session_id) REFERENCES sessions(id);
ALTER TABLE notifications ADD CONSTRAINT notifications_channel_check
  CHECK ((channel = ANY (ARRAY['email'::text, 'sms'::text])));
ALTER TABLE notifications ADD CONSTRAINT notifications_status_check
  CHECK ((status = ANY (ARRAY['pending'::text, 'sent'::text, 'failed'::text])));

CREATE INDEX IF NOT EXISTS notifications_session_id_idx ON public.notifications USING btree (session_id);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------
-- CONFIG  (prices, deposits, card surcharge — the single source of truth)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS config (
  id                             uuid NOT NULL DEFAULT gen_random_uuid(),
  key                            text NOT NULL,
  value                          text NOT NULL,
  updated_at                     timestamp with time zone DEFAULT now()
);

ALTER TABLE config ADD CONSTRAINT config_pkey PRIMARY KEY (id);
ALTER TABLE config ADD CONSTRAINT config_key_key UNIQUE (key);
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------
-- COUPON_CODES
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coupon_codes (
  id                             uuid NOT NULL DEFAULT gen_random_uuid(),
  code                           text NOT NULL,
  type                           text NOT NULL,
  value                          numeric(10,2),
  expires_at                     timestamp with time zone,
  single_use                     boolean DEFAULT true,
  redeemed                       boolean DEFAULT false,
  redeemed_at                    timestamp with time zone,
  redeemed_by                    uuid,
  created_at                     timestamp with time zone DEFAULT now()
);

ALTER TABLE coupon_codes ADD CONSTRAINT coupon_codes_pkey PRIMARY KEY (id);
ALTER TABLE coupon_codes ADD CONSTRAINT coupon_codes_code_key UNIQUE (code);
ALTER TABLE coupon_codes ADD CONSTRAINT coupon_codes_redeemed_by_fkey FOREIGN KEY (redeemed_by) REFERENCES sessions(id);
ALTER TABLE coupon_codes ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------
-- PICKUP_WINDOWS / PICKUP_APPOINTMENTS
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pickup_windows (
  id                             uuid NOT NULL DEFAULT gen_random_uuid(),
  label                          text NOT NULL,
  pickup_date                    date NOT NULL,
  start_time                     time without time zone NOT NULL,
  end_time                       time without time zone NOT NULL,
  max_slots                      integer DEFAULT 999,
  active                         boolean DEFAULT true,
  created_at                     timestamp with time zone DEFAULT now()
);

ALTER TABLE pickup_windows ADD CONSTRAINT pickup_windows_pkey PRIMARY KEY (id);
ALTER TABLE pickup_windows ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS pickup_appointments (
  id                             uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id                     uuid,
  pickup_window_id               uuid,
  pickup_person_name             text,
  pickup_person_email            text,
  pickup_person_phone            text,
  is_alternate_pickup            boolean DEFAULT false,
  waiver_signed                  boolean DEFAULT false,
  waiver_signed_at               timestamp with time zone,
  confirmed_at                   timestamp with time zone DEFAULT now(),
  created_at                     timestamp with time zone DEFAULT now()
);

ALTER TABLE pickup_appointments ADD CONSTRAINT pickup_appointments_pkey PRIMARY KEY (id);
ALTER TABLE pickup_appointments ADD CONSTRAINT pickup_appointments_session_id_fkey FOREIGN KEY (session_id) REFERENCES sessions(id);
ALTER TABLE pickup_appointments ADD CONSTRAINT pickup_appointments_pickup_window_id_fkey FOREIGN KEY (pickup_window_id) REFERENCES pickup_windows(id);

CREATE INDEX IF NOT EXISTS pickup_appointments_session_id_idx ON public.pickup_appointments USING btree (session_id);
ALTER TABLE pickup_appointments ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------
-- WAITLIST  (Wagyu, and anyone who arrived when a date was sold out)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS waitlist (
  id                             uuid NOT NULL DEFAULT gen_random_uuid(),
  animal_type                    text NOT NULL DEFAULT 'wagyu'::text,
  customer_name                  text NOT NULL,
  email                          text NOT NULL,
  phone                          text,
  size_preference                text NOT NULL,
  status                         text NOT NULL DEFAULT 'waiting'::text,
  notified_at                    timestamp with time zone,
  expires_at                     timestamp with time zone,
  created_at                     timestamp with time zone DEFAULT now()
);

ALTER TABLE waitlist ADD CONSTRAINT waitlist_pkey PRIMARY KEY (id);
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------
-- ANIMAL_COSTS  (per-animal P&L)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS animal_costs (
  id                             uuid NOT NULL DEFAULT gen_random_uuid(),
  animal_id                      uuid,
  type                           text NOT NULL,
  description                    text,
  amount                         numeric(10,2) NOT NULL DEFAULT 0,
  date                           date DEFAULT CURRENT_DATE,
  created_at                     timestamp with time zone DEFAULT now()
);

ALTER TABLE animal_costs ADD CONSTRAINT animal_costs_pkey PRIMARY KEY (id);
ALTER TABLE animal_costs ADD CONSTRAINT animal_costs_animal_id_fkey
  FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE;
ALTER TABLE animal_costs ADD CONSTRAINT animal_costs_type_check
  CHECK ((type = ANY (ARRAY['purchase'::text, 'feed'::text, 'butcher'::text, 'other'::text])));

CREATE INDEX IF NOT EXISTS animal_costs_animal_id_idx ON public.animal_costs USING btree (animal_id);
ALTER TABLE animal_costs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------
-- CUSTOMER_LINKS  (household relationships)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customer_links (
  id                             uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id_a                  uuid,
  customer_id_b                  uuid,
  relationship                   text,
  created_at                     timestamp with time zone DEFAULT now()
);

ALTER TABLE customer_links ADD CONSTRAINT customer_links_pkey PRIMARY KEY (id);
ALTER TABLE customer_links ADD CONSTRAINT customer_links_customer_id_a_customer_id_b_key UNIQUE (customer_id_a, customer_id_b);
ALTER TABLE customer_links ADD CONSTRAINT customer_links_customer_id_a_fkey FOREIGN KEY (customer_id_a) REFERENCES customers(id) ON DELETE CASCADE;
ALTER TABLE customer_links ADD CONSTRAINT customer_links_customer_id_b_fkey FOREIGN KEY (customer_id_b) REFERENCES customers(id) ON DELETE CASCADE;
ALTER TABLE customer_links ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------
-- PUSH_SUBSCRIPTIONS  (admin browser notifications)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id                             uuid NOT NULL DEFAULT gen_random_uuid(),
  endpoint                       text NOT NULL,
  p256dh                         text NOT NULL,
  auth                           text NOT NULL,
  created_at                     timestamp with time zone DEFAULT now()
);

ALTER TABLE push_subscriptions ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);
ALTER TABLE push_subscriptions ADD CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint);
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Atomically reserve or release capacity on an animal. Booking used to read
-- units_used, add to it in JavaScript, and write it back, so two simultaneous
-- bookings could both claim the last slot. The row lock serialises callers.
CREATE OR REPLACE FUNCTION public.adjust_animal_units(
  p_animal_id uuid,
  p_delta numeric
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
declare
  v_total numeric;
  v_used  numeric;
  v_new   numeric;
begin
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

GRANT EXECUTE ON FUNCTION public.adjust_animal_units(uuid, numeric) TO service_role;

-- ============================================================================
-- ROW LEVEL SECURITY
--
-- Both applications connect with the service key, which bypasses RLS. These
-- policies state that intent explicitly rather than leaving tables with RLS
-- enabled and no policy at all, which silently returns nothing to any other
-- caller. animals and butcher_slots additionally allow anonymous reads, which
-- predates the current API and is harmless.
-- ============================================================================
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'customers','animals','butcher_slots','sessions','payments','notifications',
    'cut_sheet_answers','config','coupon_codes','pickup_windows',
    'pickup_appointments','waitlist','animal_costs','customer_links',
    'push_subscriptions'
  ]
  LOOP
    EXECUTE format(
      'CREATE POLICY service_role_all_%1$s ON public.%1$I FOR ALL TO service_role USING (true) WITH CHECK (true)', t
    );
  END LOOP;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;
