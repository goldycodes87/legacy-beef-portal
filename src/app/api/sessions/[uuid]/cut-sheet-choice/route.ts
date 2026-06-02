export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params;
  const { dual } = await request.json();
  const supabase = getSupabaseAdmin();

  await supabase.from('sessions')
    .update({ dual_cut_sheet: dual })
    .eq('id', uuid);

  return NextResponse.json({ ok: true });
}
