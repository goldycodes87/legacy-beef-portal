import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^=#][^=]*)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}

const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY);

// The Supabase client's rpc() returns a PostgrestFilterBuilder which is thenable but not a promise
// We need to await it differently
async function rpc(fn, args) {
  const result = await client.rpc(fn, args);
  return result;
}

// Test connection
const testResult = await client.from('sessions').select('id').limit(0);
console.log('Connection test:', testResult.error ? 'FAILED: ' + testResult.error.message : 'OK');

// The only way to run DDL without direct DB access is through an RPC function in public schema
// Let's check if exec_sql or similar exists using information_schema
const funcCheck = await client
  .from('information_schema.routines')
  .select('routine_name, routine_type')
  .eq('routine_schema', 'public')
  .ilike('routine_name', '%sql%');
  
console.log('SQL functions:', JSON.stringify(funcCheck));
