export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest, { params }: { params: Promise<{ group_id: string }> }) {
  const supabase = getSupabaseAdmin();
  const { group_id } = await params;

  const { data: ownerSession, error: ownerError } = await supabase
    .from('sessions')
    .select(`
      id, animal_id, purchase_type, group_size, price_per_lb, invite_expires_at,
      customers (id, name, email),
      animals (id, name, butcher_date)
    `)
    .eq('group_id', group_id)
    .eq('group_role', 'owner')
    .single();

  if (ownerError || !ownerSession) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  const isExpired = new Date(ownerSession.invite_expires_at) < new Date();
  const { data: partnerCount } = await supabase
    .from('sessions')
    .select('id')
    .eq('group_id', group_id)
    .eq('group_role', 'partner')
    .neq('status', 'cancelled');

  const depositMap: Record<string, number> = { whole: 500, half: 250, quarter: 250 };
  const depositAmount = depositMap[ownerSession.purchase_type] || 250;

  const customers = ownerSession.customers as unknown as { id: string; name: string; email: string };
  const animals = ownerSession.animals as unknown as { id: string; name: string; butcher_date: string };

  return NextResponse.json({
    owner_name: customers.name,
    animal_name: animals.name,
    butcher_date: animals.butcher_date,
    purchase_type: ownerSession.purchase_type,
    deposit_amount: depositAmount,
    price_per_lb: ownerSession.price_per_lb,
    is_expired: isExpired,
    is_claimed: (partnerCount?.length || 0) > 0,
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ group_id: string }> }) {
  const supabase = getSupabaseAdmin();
  const { group_id } = await params;
  const { name, email, phone, address, city, state, zip } = await request.json();

  // Load owner session to get animal_id, purchase_type, price_per_lb, cut_sheet_choice
  const { data: ownerSession } = await supabase
    .from('sessions')
    .select('id, animal_id, purchase_type, price_per_lb, group_size, cut_sheet_choice')
    .eq('group_id', group_id)
    .eq('group_role', 'owner')
    .single();

  if (!ownerSession) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  // Upsert customer
  const { data: customer } = await supabase
    .from('customers')
    .upsert({ name, email, phone, address, city, state, zip }, { onConflict: 'email' })
    .select('id')
    .single();

  if (!customer) {
    return NextResponse.json({ error: 'Failed to create customer record' }, { status: 500 });
  }

  // Create partner session (no units_used increment)
  const { data: partnerSession, error: sessionError } = await supabase
    .from('sessions')
    .insert({
      customer_id: customer.id,
      animal_id: ownerSession.animal_id,
      purchase_type: ownerSession.purchase_type,
      group_id,
      group_role: 'partner',
      group_size: ownerSession.group_size,
      price_per_lb: ownerSession.price_per_lb,
      is_splitting: true,
      status: 'draft',
    })
    .select('id')
    .single();

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 });
  }

  // Link sessions for split half collaboration
  if (partnerSession && ownerSession.id) {
    // Set owner's partner reference
    await supabase
      .from('sessions')
      .update({ cut_sheet_partner_session_id: partnerSession.id })
      .eq('id', ownerSession.id);

    // Set partner's owner reference
    await supabase
      .from('sessions')
      .update({ cut_sheet_partner_session_id: ownerSession.id })
      .eq('id', partnerSession.id);

    // Set cut sheet roles based on choice
    if (ownerSession.cut_sheet_choice === 'shared') {
      // Both can edit
      await supabase
        .from('sessions')
        .update({ cut_sheet_role: 'partner' })
        .eq('id', partnerSession.id);
    } else if (ownerSession.cut_sheet_choice === 'master') {
      // Owner fills out, partner is read-only
      await supabase
        .from('sessions')
        .update({ cut_sheet_role: 'readonly' })
        .eq('id', partnerSession.id);
    }
  }

  return NextResponse.json({ session_id: partnerSession.id });
}
