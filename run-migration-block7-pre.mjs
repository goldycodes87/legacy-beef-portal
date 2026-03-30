import { createClient } from '@supabase/supabase-js';
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

// Step 1: ALTER TABLE butcher_slots
const alterSQL = `
ALTER TABLE butcher_slots ADD COLUMN IF NOT EXISTS animal_type text DEFAULT 'grass_fed';
ALTER TABLE butcher_slots ADD COLUMN IF NOT EXISTS purchase_type text DEFAULT 'whole';
`;

console.log('Running ALTER TABLE butcher_slots...');
const alterResult = await runSQL(alterSQL);
console.log('ALTER result:', alterResult.status, alterResult.body);

// Step 2: INSERT animals
const insertSQL = `
INSERT INTO animals (name, type, animal_type, butcher_date, estimated_ready_date, status, price_per_lb, slots_whole, slots_half, slots_quarter)
VALUES 
  ('Spring 2026 — Grass-Fed', 'whole', 'grass_fed', '2026-05-15', '2026-06-05', 'available', 8.00, 3, 6, 12),
  ('Spring 2026 — Grain-Finished', 'whole', 'grain_finished', '2026-05-22', '2026-06-12', 'available', 8.00, 2, 4, 8),
  ('Summer 2026 — Grass-Fed', 'whole', 'grass_fed', '2026-07-10', '2026-07-31', 'available', 8.00, 4, 8, 16)
ON CONFLICT DO NOTHING;
`;

console.log('Running INSERT INTO animals...');
const insertResult = await runSQL(insertSQL);
console.log('INSERT result:', insertResult.status, insertResult.body);

// Step 3: Verify
const verifyColsSQL = `SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'butcher_slots' AND column_name IN ('animal_type', 'purchase_type');`;
const verifyAnimalsSQL = `SELECT id, name, animal_type, butcher_date, status FROM animals WHERE name LIKE '%2026%' ORDER BY butcher_date;`;

console.log('\nVerifying butcher_slots columns...');
const verifyCols = await runSQL(verifyColsSQL);
console.log('Columns result:', verifyCols.status, verifyCols.body);

console.log('\nVerifying animals rows...');
const verifyAnimals = await runSQL(verifyAnimalsSQL);
console.log('Animals result:', verifyAnimals.status, verifyAnimals.body);
