-- Applied to production via MCP on 2026-09-28.
-- Explicit SMS opt-in captured by the reservation form's consent checkbox
-- (A2P 10DLC campaign vetting wants a checkbox, not implied consent).
ALTER TABLE customers ADD COLUMN IF NOT EXISTS sms_consent boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN customers.sms_consent IS 'Checked the SMS consent box on the reservation form (A2P 10DLC explicit opt-in).';
