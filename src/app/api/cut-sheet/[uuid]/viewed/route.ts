export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params;
  await supabaseAdmin
    .from('sessions')
    .update({ last_viewed_at: new Date().toISOString() })
    .eq('id', uuid);
  return NextResponse.json({ ok: true });
}
