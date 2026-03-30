import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  const { uuid } = params;

  const { data: session, error } = await supabaseAdmin
    .from('sessions')
    .select('*, customers(*), animals(*)')
    .eq('id', uuid)
    .single();

  if (error || !session) {
    return NextResponse.json({ error: 'session_not_found' }, { status: 404 });
  }

  return NextResponse.json(session);
}
