-- Applied to production via MCP on 2026-09-25.
-- The admin agent grows into an employee: one conversation shared across
-- web / SMS / voice, durable memory, an editable persona, and pending
-- approvals decidable from any channel.

CREATE TABLE IF NOT EXISTS agent_messages (
  id         uuid NOT NULL DEFAULT gen_random_uuid(),
  channel    text NOT NULL DEFAULT 'web',
  role       text NOT NULL,
  content    jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT agent_messages_pkey PRIMARY KEY (id),
  CONSTRAINT agent_messages_role_check CHECK (role IN ('user','assistant'))
);
CREATE INDEX IF NOT EXISTS agent_messages_created_idx ON public.agent_messages USING btree (created_at DESC);
ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS agent_pending_actions (
  id          uuid NOT NULL DEFAULT gen_random_uuid(),
  tool_use_id text NOT NULL,
  tool        text NOT NULL,
  input       jsonb,
  status      text NOT NULL DEFAULT 'pending',
  channel     text NOT NULL DEFAULT 'web',
  created_at  timestamp with time zone DEFAULT now(),
  decided_at  timestamp with time zone,
  CONSTRAINT agent_pending_actions_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS agent_pending_status_idx ON public.agent_pending_actions USING btree (status, created_at DESC);
ALTER TABLE agent_pending_actions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS agent_config (
  id            int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name          text NOT NULL DEFAULT 'Rusty',
  extra_prompt  text,
  updated_at    timestamp with time zone DEFAULT now()
);
INSERT INTO agent_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
ALTER TABLE agent_config ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS agent_memory (
  id          int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  memory_text text,
  updated_at  timestamp with time zone DEFAULT now()
);
INSERT INTO agent_memory (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;
