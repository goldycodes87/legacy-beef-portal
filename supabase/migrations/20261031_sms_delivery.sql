-- Applied to production via MCP on 2026-10-31.
--
-- sms_delivery: ground truth for "did that text actually arrive?" — written by
-- the Twilio status-callback webhook (/api/webhooks/twilio-status on the admin),
-- read by the admin agent (check_sms_delivery). One row per outbound message;
-- Twilio posts each status change and the row keeps the furthest-along status.
-- Tracking begins 2026-10-31 — texts sent before then have no rows here.
CREATE TABLE IF NOT EXISTS sms_delivery (
  message_sid  text NOT NULL,
  to_phone     text,
  from_phone   text,
  status       text NOT NULL,
  error_code   text,
  delivered_at timestamp with time zone,
  created_at   timestamp with time zone DEFAULT now(),
  updated_at   timestamp with time zone DEFAULT now(),
  CONSTRAINT sms_delivery_pkey PRIMARY KEY (message_sid)
);
CREATE INDEX IF NOT EXISTS sms_delivery_to_phone_idx ON public.sms_delivery USING btree (to_phone);
CREATE INDEX IF NOT EXISTS sms_delivery_updated_idx ON public.sms_delivery USING btree (updated_at DESC);
ALTER TABLE sms_delivery ENABLE ROW LEVEL SECURITY;
