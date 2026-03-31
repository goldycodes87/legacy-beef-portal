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

// Step 1: Add columns
console.log('--- Step 1: Adding columns ---');
const addColumnsSQL = `
ALTER TABLE animals ADD COLUMN IF NOT EXISTS total_animals integer DEFAULT 1;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS units_used decimal(10,2) DEFAULT 0.00;
`;
const addResult = await runSQL(addColumnsSQL);
console.log('Add columns result:', addResult.status, addResult.body);

// Step 2: Populate values
console.log('\n--- Step 2: Populating values ---');
const updateSQL = `
UPDATE animals SET 
  total_animals = GREATEST(slots_whole, CEIL(slots_half::decimal/2), CEIL(slots_quarter::decimal/4)),
  units_used = (slots_whole_used * 1.0) + (slots_half_used * 0.5) + (slots_quarter_used * 0.25)
WHERE total_animals IS NULL OR total_animals = 1;
`;
const updateResult = await runSQL(updateSQL);
console.log('Update result:', updateResult.status, updateResult.body);

// Verify 1: Columns exist
console.log('\n--- Verify 1: Column existence ---');
const colCheckSQL = `SELECT column_name FROM information_schema.columns WHERE table_name='animals' AND column_name IN ('total_animals', 'units_used');`;
const colCheckResult = await runSQL(colCheckSQL);
console.log('Column check:', colCheckResult.status, colCheckResult.body);

// Verify 2: Sample values
console.log('\n--- Verify 2: Sample rows ---');
const sampleSQL = `SELECT id, total_animals, units_used FROM animals LIMIT 5;`;
const sampleResult = await runSQL(sampleSQL);
console.log('Sample rows:', sampleResult.status, sampleResult.body);

// Verify 3: Row count
console.log('\n--- Verify 3: Row count ---');
const countSQL = `SELECT COUNT(*) FROM animals WHERE total_animals > 0;`;
const countResult = await runSQL(countSQL);
console.log('Row count:', countResult.status, countResult.body);
