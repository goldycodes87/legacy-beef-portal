export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params;
  const supabase = getSupabaseAdmin();

  // Lock all sections
  await supabase
    .from('cut_sheet_answers')
    .update({ locked: true })
    .eq('session_id', uuid);

  // Update session status
  await supabase
    .from('sessions')
    .update({ 
      status: 'locked',
      cut_sheet_complete: true,
      cut_sheet_locked_at: new Date().toISOString()
    })
    .eq('id', uuid);

  return NextResponse.json({ success: true });
}
