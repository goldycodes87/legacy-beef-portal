-- Applied to production via MCP on 2026-10-30.
-- Customer-facing SMS threads live in agent_messages under channel
-- 'customer_sms', keyed by the customer's normalized phone — fully separate
-- from Rusty's back-office conversation with Grant.
ALTER TABLE agent_messages ADD COLUMN IF NOT EXISTS counterparty text;
CREATE INDEX IF NOT EXISTS agent_messages_counterparty_idx ON agent_messages (channel, counterparty, created_at);
COMMENT ON COLUMN agent_messages.counterparty IS 'Normalized phone of the non-Grant party for customer_sms threads; null for Grant''s own channels.';
