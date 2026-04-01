export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// GET — load all answers for a session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params;
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('cut_sheet_answers')
    .select('*')
    .eq('session_id', uuid)
    .order('section');

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

  if (!section) return NextResponse.json({ error: 'section required' }, { status: 400 });

  const { data, error } = await supabase
    .from('cut_sheet_answers')
    .upsert({
      session_id: uuid,
      section,
      answers: answers ?? {},
      completed: completed ?? false,
      custom_request: custom_request ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'session_id,section' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
