-- Legacy Land & Cattle — Block 1 Schema
-- Run this in the Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLE: customers
-- =============================================
CREATE TABLE IF NOT EXISTS customers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  phone       TEXT NOT NULL,
  address     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "service_role_all_customers"
  ON customers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- =============================================
-- TABLE: animals
-- =============================================
CREATE TABLE IF NOT EXISTS animals (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                  TEXT NOT NULL,
  type                  TEXT NOT NULL CHECK (type IN ('whole', 'half')),
  butcher_date          DATE,
  estimated_ready_date  DATE,
  status                TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'butchered', 'ready', 'delivered')),
  hanging_weight_lbs    INTEGER,
  price_per_lb          NUMERIC(6,2),
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE animals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_animals"
  ON animals
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Anon can read animals (needed for /book page slot display)
CREATE POLICY "anon_read_animals"
  ON animals
  FOR SELECT
  TO anon, authenticated
  USING (true);


-- =============================================
-- TABLE: butcher_slots
-- =============================================
CREATE TABLE IF NOT EXISTS butcher_slots (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id    UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  slot_type    TEXT NOT NULL CHECK (slot_type IN ('whole', 'half_a', 'half_b')),
  status       TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'processing')),
  customer_id  UUID REFERENCES customers(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE butcher_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_butcher_slots"
  ON butcher_slots
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Anon can read available slots
CREATE POLICY "anon_read_available_slots"
  ON butcher_slots
  FOR SELECT
  TO anon, authenticated
  USING (status = 'available');


-- =============================================
-- TABLE: sessions
-- =============================================
CREATE TABLE IF NOT EXISTS sessions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id         UUID NOT NULL REFERENCES customers(id),
  slot_id             UUID NOT NULL REFERENCES butcher_slots(id),
  animal_id           UUID NOT NULL REFERENCES animals(id),
  purchase_type       TEXT NOT NULL CHECK (purchase_type IN ('whole', 'half')),
  status              TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'complete', 'locked', 'processing', 'beef_ready')),
  partner_session_id  UUID REFERENCES sessions(id),
  partner_email       TEXT,
  partner_approved    BOOLEAN DEFAULT FALSE,
  owner_approved      BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  last_saved          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_sessions"
  ON sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- =============================================
-- TABLE: payments
-- =============================================
CREATE TABLE IF NOT EXISTS payments (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id                UUID NOT NULL REFERENCES sessions(id),
  type                      TEXT NOT NULL CHECK (type IN ('deposit', 'balance')),
  method                    TEXT NOT NULL CHECK (method IN ('card', 'echeck', 'cash', 'check')),
  amount_cents              INTEGER NOT NULL,
  surcharge_cents           INTEGER NOT NULL DEFAULT 0,
  status                    TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'waived')),
  stripe_payment_intent_id  TEXT,
  paid_at                   TIMESTAMPTZ,
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_payments"
  ON payments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- =============================================
-- TABLE: notifications
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id  UUID NOT NULL REFERENCES sessions(id),
  type        TEXT NOT NULL,
  channel     TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  sent_at     TIMESTAMPTZ,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed'))
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_notifications"
  ON notifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- =============================================
-- SEED DATA: Test animal + slot
-- =============================================
-- Uncomment and run to insert test data:
/*
INSERT INTO animals (name, type, butcher_date, estimated_ready_date, hanging_weight_lbs, price_per_lb, status)
VALUES ('Test Steer #1', 'half', '2026-04-15', '2026-05-01', 500, 8.50, 'pending');

-- Then grab the animal ID and insert a slot:
INSERT INTO butcher_slots (animal_id, slot_type, status)
SELECT id, 'half_a', 'available'
FROM animals
WHERE name = 'Test Steer #1'
LIMIT 1;
*/
