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
  const { section, answers, completed, custom_request } = body;
  const half = body.half === 'A' || body.half === 'B' ? body.half : null;

  if (!section) return NextResponse.json({ error: 'section required' }, { status: 400 });

  // Check if record exists
  let existQuery = supabase
    .from('cut_sheet_answers')
    .select('id')
    .eq('session_id', uuid)
    .eq('section', section);
  if (half !== null) {
    existQuery = existQuery.eq('half', half);
  } else {
    existQuery = existQuery.is('half', null);
  }
  const { data: existing } = await existQuery.maybeSingle();

  let data, error;
  if (existing?.id) {
    ({ data, error } = await supabase
      .from('cut_sheet_answers')
      .update({
        answers: answers ?? {},
        completed: completed ?? false,
        custom_request: custom_request ?? null,
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
        custom_request: custom_request ?? null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single());
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
