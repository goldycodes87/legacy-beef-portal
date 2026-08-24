-- Legacy Land & Cattle — Block 8: Contract eSign Schema
-- Run this in the Supabase SQL editor

-- Add contract signature fields to sessions
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS contract_signed BOOLEAN DEFAULT FALSE;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS contract_signed_at TIMESTAMPTZ;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS contract_ip TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS contract_signature TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS contract_version TEXT;

-- Add is_splitting to sessions (captured during select-size)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_splitting BOOLEAN DEFAULT FALSE;

-- Add deposit_amount to sessions (for contract display)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS deposit_amount INTEGER;

-- Add city, state, zip to customers if not already done (block7 migration)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS zip TEXT;
