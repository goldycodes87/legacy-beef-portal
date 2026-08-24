export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * Copies a previous order's cut sheet onto this one.
 *
 * Two uses, one code path. `markComplete: true` is "use my same cut sheet" —
 * the answers land finished and the customer goes straight to review.
 * `markComplete: false` seeds the wizard so every section opens on what they
 * chose last time instead of the house default, and they walk through
 * comparing and changing whatever they want.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params;
  const supabase = getSupabaseAdmin();

  let body: { sourceSessionId?: string; markComplete?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const sourceSessionId = body.sourceSessionId;
  const markComplete = body.markComplete === true;

  if (!sourceSessionId) {
    return NextResponse.json({ error: 'sourceSessionId required' }, { status: 400 });
  }
  if (sourceSessionId === uuid) {
    return NextResponse.json({ error: 'Cannot copy an order onto itself' }, { status: 400 });
  }

  // Both sessions must belong to the same customer. Without this check anyone
  // holding one order id could pull the cut sheet off any other order.
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, customer_id, cut_sheet_complete')
    .in('id', [uuid, sourceSessionId]);

  const target = (sessions || []).find((s) => s.id === uuid);
  const source = (sessions || []).find((s) => s.id === sourceSessionId);

  if (!target || !source) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
  if (!target.customer_id || target.customer_id !== source.customer_id) {
    return NextResponse.json({ error: 'Not your order' }, { status: 403 });
  }
  if (target.cut_sheet_complete) {
    return NextResponse.json(
      { error: 'This cut sheet is already locked and cannot be replaced.' },
      { status: 409 }
    );
  }

  const { data: previous } = await supabase
    .from('cut_sheet_answers')
    .select('section, answers, half')
    .eq('session_id', sourceSessionId);

  if (!previous || previous.length === 0) {
    return NextResponse.json({ error: 'That order has no cut sheet to copy' }, { status: 404 });
  }

  const rows = previous.map((p) => {
    // A copied answer is the customer's own previous choice. If their last
    // sheet was filled from the house defaults, carrying that flag over would
    // keep labelling it "house default" on an order they hand-picked.
    const { house_default: _ignored, ...answers } = (p.answers ?? {}) as Record<string, unknown>;
    return {
      session_id: uuid,
      section: p.section,
      half: p.half ?? null,
      answers,
      completed: markComplete,
      locked: false,
      updated_at: new Date().toISOString(),
    };
  });

  const { error } = await supabase
    .from('cut_sheet_answers')
    .upsert(rows, { onConflict: 'session_id,section,half' });

  if (error) {
    console.error('Failed to copy cut sheet:', error);
    return NextResponse.json(
      { error: 'We could not copy that cut sheet. Please try again.' },
      { status: 500 }
    );
  }

  // If the sheet we copied was split into halves, this order is a dual sheet
  // too — otherwise the wizard would look for answers that have no half and
  // find nothing.
  const isDual = rows.some((r) => r.half !== null);
  await supabase.from('sessions').update({ dual_cut_sheet: isDual }).eq('id', uuid);

  return NextResponse.json({ success: true, sections: rows.length, markComplete, dual: isDual });
}
