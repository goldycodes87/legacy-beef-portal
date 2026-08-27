export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// GET — load all answers for a session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params;
  const halfParam = request.nextUrl.searchParams.get('half');
  const half = halfParam === 'A' || halfParam === 'B' ? halfParam : null;
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('cut_sheet_answers')
    .select('*')
    .eq('session_id', uuid)
    .order('section');

  if (half !== null) {
    query = query.eq('half', half);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST — upsert a single section's answers (auto-save)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params;
  const supabase = getSupabaseAdmin();
  const body = await request.json();
  const { section, answers, completed } = body;

  const { data: gateSession } = await supabase
    .from('sessions')
    .select('status, intended_payment_method')
    .eq('id', uuid)
    .maybeSingle();
  if (
    gateSession?.status === 'draft' &&
    (gateSession.intended_payment_method === 'cash' || gateSession.intended_payment_method === 'check')
  ) {
    return NextResponse.json(
      { error: 'deposit_pending', message: 'Your cut sheet opens once we receive your deposit.' },
      { status: 403 }
    );
  }

  const hasCustomRequest = Object.prototype.hasOwnProperty.call(body, 'custom_request');
  const half = body.half === 'A' || body.half === 'B' ? body.half : null;

  if (!section) return NextResponse.json({ error: 'section required' }, { status: 400 });

  // Check if record exists
  let existQuery = supabase
    .from('cut_sheet_answers')
    .select('id, locked')
    .eq('session_id', uuid)
    .eq('section', section);
  if (half !== null) {
    existQuery = existQuery.eq('half', half);
  } else {
    existQuery = existQuery.is('half', null);
  }
  const { data: existing } = await existQuery.maybeSingle();

  // The lock was only ever enforced in the UI, so a stale tab could overwrite
  // instructions already printed and handed to the butcher.
  if (existing?.locked) {
    return NextResponse.json(
      { error: 'cut_sheet_locked', message: 'This cut sheet is locked and can no longer be changed.' },
      { status: 409 }
    );
  }

  let data, error;
  if (existing?.id) {
    ({ data, error } = await supabase
      .from('cut_sheet_answers')
      .update({
        answers: answers ?? {},
        completed: completed ?? false,
        ...(hasCustomRequest ? { custom_request: body.custom_request ?? null } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single());
  } else {
    ({ data, error } = await supabase
      .from('cut_sheet_answers')
      .insert({
        session_id: uuid,
        section,
        half,
        answers: answers ?? {},
        completed: completed ?? false,
        ...(hasCustomRequest ? { custom_request: body.custom_request ?? null } : {}),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single());
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
