import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^=#][^=]*)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}

const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY);

// Try to use the query() method from the newer Supabase client
console.log('Client methods:', Object.keys(client).filter(k => typeof client[k] === 'function'));

// Check if pg functions exist in public schema
const { data, error } = await client
  .rpc('pg_catalog.pg_get_functiondef', { funcid: 1 })
  .catch(e => ({ error: { message: e.message } }));
console.log('pg_catalog RPC:', JSON.stringify({ data, error }));
