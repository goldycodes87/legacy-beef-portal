import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rmolayrkbkcmtoahsiqj.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// We'll use the /rpc/exec_sql or direct Postgres connection via the Management API
// Since we don't have direct DB access, let's use the Supabase REST API to test table access
// and then report what needs to be run manually

async function checkAndCreateTables() {
  console.log('Checking Supabase connection...');
  
  const tables = ['customers', 'animals', 'butcher_slots', 'sessions', 'payments', 'notifications'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('id').limit(1);
    if (error && error.code === '42P01') {
      console.log(`❌ Table '${table}' does NOT exist — needs creation`);
    } else if (error) {
      console.log(`⚠️  Table '${table}': ${error.message}`);
    } else {
      console.log(`✅ Table '${table}' EXISTS`);
    }
  }
}

checkAndCreateTables().catch(console.error);
