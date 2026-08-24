export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getAccountData, PURCHASE_LABEL, ANIMAL_TYPE_LABEL } from '@/lib/account';

/**
 * The signed-in customer's most recent cut sheet, other than the one they are
 * working on now. Answers "have you done this before, and can we offer it?"
 *
 * Reads the customer from the access cookie rather than trusting anything the
 * page sends, and looks up their own sessions only.
 */
export async function GET(request: NextRequest) {
  const exclude = request.nextUrl.searchParams.get('exclude') || '';

  const account = await getAccountData();
  if (!account) return NextResponse.json({ available: false });

  // Newest first, and only orders that actually got a cut sheet filled in.
  const candidates = account.orders.filter(
    (o) => o.id !== exclude && o.cutSheetComplete && o.status !== 'cancelled'
  );
  if (candidates.length === 0) return NextResponse.json({ available: false });

  const supabase = getSupabaseAdmin();

  for (const order of candidates) {
    const { count } = await supabase
      .from('cut_sheet_answers')
      .select('section', { count: 'exact', head: true })
      .eq('session_id', order.id);

    if ((count ?? 0) > 0) {
      return NextResponse.json({
        available: true,
        sourceSessionId: order.id,
        sections: count,
        label: `${PURCHASE_LABEL[order.purchaseType] || order.purchaseLabel}${
          order.animalType ? ` · ${ANIMAL_TYPE_LABEL[order.animalType] || ''}` : ''
        }`,
        butcherDateLabel: order.butcherDateLabel,
      });
    }
  }

  return NextResponse.json({ available: false });
}
