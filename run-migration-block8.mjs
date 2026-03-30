import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve('/home/clawoperator/chet/projects/legacy-beef-portal/.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

async function runSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SECRET_KEY,
      'Authorization': `Bearer ${SECRET_KEY}`
    },
    body: JSON.stringify({ query: sql })
  });
  const text = await res.text();
  return { status: res.status, body: text };
}

const migrationSQL = `
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_splitting boolean DEFAULT false;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS deposit_amount integer;
`;

console.log('Running Block 8 migrations...');
const result = await runSQL(migrationSQL);
console.log('Migration result:', result.status, result.body);

// Verify
const verifySQL = `SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'sessions' AND column_name IN ('is_splitting', 'deposit_amount');`;
const verifyResult = await runSQL(verifySQL);
console.log('Verify result:', verifyResult.status, verifyResult.body);
