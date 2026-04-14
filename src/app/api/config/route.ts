export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from('config').select('key, value');
  const result: Record<string, string> = {};
  (data || []).forEach((row: any) => {
    result[row.key] = row.value;
  });
  return NextResponse.json(result);
}
