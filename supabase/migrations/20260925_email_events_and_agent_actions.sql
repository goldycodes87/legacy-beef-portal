-- Applied to production via MCP on 2026-09-25.
--
-- email_events: ground truth for "did that email actually go out?" — written
-- by the Resend webhook (/api/webhooks/resend), read by the admin and its
-- agent. agent_actions: audit trail of every write the admin agent performs.

CREATE TABLE IF NOT EXISTS email_events (
  id               uuid NOT NULL DEFAULT gen_random_uuid(),
  resend_email_id  text,
  event_type       text NOT NULL,
  to_email         text,
  from_email       text,
  subject          text,
  payload          jsonb,
  created_at       timestamp with time zone DEFAULT now(),
  CONSTRAINT email_events_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS email_events_to_email_idx ON public.email_events USING btree (to_email);
CREATE INDEX IF NOT EXISTS email_events_resend_id_idx ON public.email_events USING btree (resend_email_id);
CREATE INDEX IF NOT EXISTS email_events_created_idx ON public.email_events USING btree (created_at DESC);
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS agent_actions (
  id          uuid NOT NULL DEFAULT gen_random_uuid(),
  tool        text NOT NULL,
  input       jsonb,
  result      jsonb,
  approved_by text DEFAULT 'admin',
  created_at  timestamp with time zone DEFAULT now(),
  CONSTRAINT agent_actions_pkey PRIMARY KEY (id)
);
ALTER TABLE agent_actions ENABLE ROW LEVEL SECURITY;
