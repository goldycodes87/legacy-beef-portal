-- Legacy Land & Cattle — Block 6: Inventory Slots Table
-- Run this in the Supabase SQL editor

-- =============================================
-- TABLE: slot_inventory
-- Tracks capacity and usage per size + animal type.
-- One row per (size, animal_type) combination.
-- =============================================
CREATE TABLE IF NOT EXISTS slot_inventory (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_type         TEXT NOT NULL DEFAULT 'all',  -- 'grass_fed', 'grain_finished', 'wagyu', 'no_preference', 'all'
  slots_whole         INTEGER NOT NULL DEFAULT 0,
  slots_whole_used    INTEGER NOT NULL DEFAULT 0,
  slots_half          INTEGER NOT NULL DEFAULT 0,
  slots_half_used     INTEGER NOT NULL DEFAULT 0,
  slots_quarter       INTEGER NOT NULL DEFAULT 0,
  slots_quarter_used  INTEGER NOT NULL DEFAULT 0,
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE slot_inventory ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "service_role_all_slot_inventory"
  ON slot_inventory
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Anon can read inventory (needed for /select-size page)
CREATE POLICY "anon_read_slot_inventory"
  ON slot_inventory
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- =============================================
-- SEED DATA: Default inventory rows
-- =============================================
INSERT INTO slot_inventory (animal_type, slots_whole, slots_whole_used, slots_half, slots_half_used, slots_quarter, slots_quarter_used)
VALUES
  ('grass_fed',       5, 0, 10, 0, 8, 0),
  ('grain_finished',  3, 0,  6, 0, 6, 0),
  ('wagyu',           2, 0,  4, 0, 0, 0),
  ('no_preference',   0, 0,  0, 0, 0, 0),
  ('all',            10, 0, 20, 0, 16, 0)
ON CONFLICT DO NOTHING;

-- =============================================
-- TEST: Sold-out scenario for deliverable #3
-- Run this to test "Whole Beef = Sold Out":
-- UPDATE slot_inventory SET slots_whole=1, slots_whole_used=1 WHERE animal_type='grass_fed';
-- =============================================
