export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params;
  const supabase = getSupabaseAdmin();
  const { section, request: customRequest } = await request.json();

  await supabase
    .from('cut_sheet_answers')
    .upsert({
      session_id: uuid,
      section,
      custom_request: customRequest,
      custom_request_status: 'pending',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'session_id,section' });

  // TODO Block 15: send Telegram notification to Grant

  return NextResponse.json({ success: true });
}
