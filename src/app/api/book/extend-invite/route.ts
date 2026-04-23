export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 
  'https://www.legacylandandcattleco.com';

export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  const session_id = 
    request.nextUrl.searchParams.get('session_id');
  
  if (!session_id)
    return new Response('Missing session_id', { status: 400 });
  
  const newExpiry = new Date(
    Date.now() + 24 * 60 * 60 * 1000).toISOString();
  
  await supabase.from('sessions')
    .update({ invite_expires_at: newExpiry })
    .eq('id', session_id);
  
  return Response.redirect(
    `${APP_URL}/session/${session_id}/status?extended=true`
  );
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  const { session_id } = await request.json();

  // Extend invite by 24 hours
  const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from('sessions')
    .update({ invite_expires_at: newExpiry })
    .eq('id', session_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
