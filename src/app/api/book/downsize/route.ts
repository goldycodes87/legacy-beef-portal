export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 
  'https://www.legacylandandcattleco.com';

const DOWNSIZE_MAP: Record<string, string> = {
  whole: 'half',
  half: 'quarter',
};

export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  const session_id = 
    request.nextUrl.searchParams.get('session_id');
  
  if (!session_id)
    return new Response('Missing session_id', { status: 400 });
  
  const { data: session } = await supabase
    .from('sessions')
    .select('purchase_type, group_id')
    .eq('id', session_id).single();
  
  if (!session) 
    return new Response('Not found', { status: 404 });
  
  const newSize = DOWNSIZE_MAP[session.purchase_type];
  if (!newSize) 
    return new Response('Cannot downsize further', 
      { status: 400 });
  
  await supabase.from('sessions').update({
    purchase_type: newSize,
    is_splitting: false,
    group_role: 'solo',
    partner_emails: [],
    partner_names: [],
  }).eq('id', session_id);
  
  // Cancel pending partner sessions
  if (session.group_id) {
    // Get all pending partner sessions to be cancelled
    const { data: sessionsToCancel } = await supabase
      .from('sessions')
      .select('id, purchase_type, animal_id')
      .eq('group_id', session.group_id)
      .neq('id', session_id)
      .eq('status', 'pending');
    
    // Cancel them
    await supabase.from('sessions')
      .update({ status: 'cancelled' })
      .eq('group_id', session.group_id)
      .neq('id', session_id)
      .eq('status', 'pending');
    
    // Decrement units_used for each cancelled session
    if (sessionsToCancel) {
      for (const cancelledSession of sessionsToCancel) {
        const unitCost = cancelledSession.purchase_type === 'whole' ? 1.0 : 
          cancelledSession.purchase_type === 'half' ? 0.5 : 0.25;
        
        const { data: animal } = await supabase
          .from('animals')
          .select('units_used')
          .eq('id', cancelledSession.animal_id)
          .single();
        
        if (animal) {
          await supabase
            .from('animals')
            .update({ units_used: Math.max(0, (animal.units_used || 0) - unitCost) })
            .eq('id', cancelledSession.animal_id);
        }
      }
    }
  }
  
  return Response.redirect(
    `${APP_URL}/session/${session_id}/status?converted=downsize`
  );
}
