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
  
  await supabase.from('sessions').update({
    is_splitting: false,
    group_role: 'solo',
    partner_emails: [],
    partner_names: [],
  }).eq('id', session_id);
  
  // Cancel any pending partner sessions in same group
  const { data: session } = await supabase
    .from('sessions').select('group_id')
    .eq('id', session_id).single();
  
  if (session?.group_id) {
    await supabase.from('sessions')
      .update({ status: 'cancelled' })
      .eq('group_id', session.group_id)
      .neq('id', session_id)
      .eq('status', 'pending');
  }
  
  return Response.redirect(
    `${APP_URL}/session/${session_id}/status?converted=solo`
  );
}
