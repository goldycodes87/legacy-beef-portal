import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^=#][^=]*)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}

const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY);

// Connection test
const connResult = await client.from('sessions').select('id').limit(0);
console.log('Connected:', !connResult.error);

// Sessions columns
const sessResult = await client.from('sessions').select('group_id, group_role, group_size, discount_applied, invite_expires_at, partner_emails').limit(0);
console.log('Sessions columns OK:', !sessResult.error, sessResult.error ? sessResult.error.message : '');

// Invites table
const invResult = await client.from('invites').select('id').limit(0);
console.log('Invites table OK:', !invResult.error, invResult.error ? invResult.error.message : '');

// Animals columns
const aniResult = await client.from('animals').select('slots_whole, slots_half, slots_quarter, slots_whole_used, slots_half_used, slots_quarter_used').limit(0);
console.log('Animals columns OK:', !aniResult.error, aniResult.error ? aniResult.error.message : '');
