import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^=#][^=]*)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}

const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY);

// Test by querying a known table
const { data, error } = await client.from('sessions').select('id').limit(1);
console.log('Sessions query:', error ? 'FAILED: ' + JSON.stringify(error) : 'OK, rows: ' + (data?.length ?? 0));

// Try exec_sql RPC
const sqlStatements = [
  "ALTER TABLE sessions ADD COLUMN IF NOT EXISTS group_id uuid",
  "ALTER TABLE sessions ADD COLUMN IF NOT EXISTS group_role text DEFAULT 'solo'",
  "ALTER TABLE sessions ADD COLUMN IF NOT EXISTS group_size integer DEFAULT 1",
  "ALTER TABLE sessions ADD COLUMN IF NOT EXISTS discount_applied boolean DEFAULT false",
  "ALTER TABLE sessions ADD COLUMN IF NOT EXISTS invite_expires_at timestamptz",
  "ALTER TABLE sessions ADD COLUMN IF NOT EXISTS partner_emails text[]",
  "ALTER TABLE animals ADD COLUMN IF NOT EXISTS slots_whole integer DEFAULT 0",
  "ALTER TABLE animals ADD COLUMN IF NOT EXISTS slots_half integer DEFAULT 0",
  "ALTER TABLE animals ADD COLUMN IF NOT EXISTS slots_quarter integer DEFAULT 0",
  "ALTER TABLE animals ADD COLUMN IF NOT EXISTS slots_whole_used integer DEFAULT 0",
  "ALTER TABLE animals ADD COLUMN IF NOT EXISTS slots_half_used integer DEFAULT 0",
  "ALTER TABLE animals ADD COLUMN IF NOT EXISTS slots_quarter_used integer DEFAULT 0",
];

for (const stmt of sqlStatements) {
  const { error: e } = await client.rpc('exec_sql', { query: stmt });
  if (e) {
    console.log('RPC exec_sql failed:', e.message);
    break;
  }
  console.log('OK:', stmt.substring(0, 60));
}
