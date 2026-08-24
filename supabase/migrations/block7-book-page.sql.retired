-- Legacy Land & Cattle — Block 7: Book Page Schema Updates
-- Run this in the Supabase SQL editor to add address fields to customers

-- Add city, state, zip to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS zip TEXT;

-- Note: The existing `address` column remains for the street address line.
-- The book API combines street+city+state+zip into the address field as a fallback
-- for compatibility with sessions that don't have separate fields yet.

-- Allow slot_id to be nullable in sessions for animals-based bookings
ALTER TABLE sessions ALTER COLUMN slot_id DROP NOT NULL;
