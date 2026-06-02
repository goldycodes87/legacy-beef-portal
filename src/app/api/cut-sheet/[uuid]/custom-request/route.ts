export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params;
  const supabase = getSupabaseAdmin();
  const { section, request: customRequest, half } = await request.json();
  const halfValue = half === 'A' || half === 'B' ? half : null;

  await supabase
    .from('cut_sheet_answers')
    .upsert({
      session_id: uuid,
      section,
      half: halfValue,
      custom_request: customRequest,
      custom_request_status: 'pending',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'cut_sheet_answers_session_section_half_idx' });

  // TODO Block 15: send Telegram notification to Grant

  return NextResponse.json({ success: true });
}
