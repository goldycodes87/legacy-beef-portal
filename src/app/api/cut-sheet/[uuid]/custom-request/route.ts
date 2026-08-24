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

  if (!section) {
    return NextResponse.json({ error: 'Missing section' }, { status: 400 });
  }

  // onConflict takes column names. This previously passed an index name, which
  // meant the upsert failed and the customer's request was silently discarded
  // while the route still reported success.
  const { error } = await supabase
    .from('cut_sheet_answers')
    .upsert({
      session_id: uuid,
      section,
      half: halfValue,
      custom_request: customRequest,
      custom_request_status: 'pending',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'session_id,section,half' });

  if (error) {
    console.error('Failed to save custom cut request:', error);
    return NextResponse.json(
      { error: 'We could not save that request. Please try again.', detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
