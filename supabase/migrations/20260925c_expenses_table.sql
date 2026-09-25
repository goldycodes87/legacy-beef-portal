-- Applied to production via MCP on 2026-09-25.
-- What the beef costs us: steer purchases, processing, feed, transport.
-- Written by the admin agent (approval-gated); the basis for profit-per-animal.
CREATE TABLE IF NOT EXISTS expenses (
  id           uuid NOT NULL DEFAULT gen_random_uuid(),
  category     text NOT NULL,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  note         text,
  butcher_date date,
  animal_type  text,
  spent_on     date DEFAULT CURRENT_DATE,
  created_at   timestamp with time zone DEFAULT now(),
  CONSTRAINT expenses_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS expenses_spent_on_idx ON public.expenses USING btree (spent_on DESC);
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
