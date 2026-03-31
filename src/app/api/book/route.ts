import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://legacylandandcattleco.com';

function depositAmount(purchaseType: string): number {
  switch (purchaseType) {
    case 'whole':   return 850;
    case 'half':    return 500;
    case 'quarter': return 250;
    default:        return 500;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, address, city, state, zip, animal_id, purchase_type } = body;

    // Validate required fields
    if (!name || !email || !phone || !address || !animal_id || !purchase_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Verify the animal is still available with spots remaining
    const { data: animal, error: animalError } = await supabaseAdmin
      .from('animals')
      .select('id, name, status, total_animals, units_used, animal_type')
      .eq('id', animal_id)
      .eq('status', 'available')
      .single();

    if (animalError || !animal) {
      return NextResponse.json({
        error: 'This animal is no longer available. Please go back and select another.',
      }, { status: 409 });
    }

    // Compute spots remaining using unit-based capacity
    const unitCost = purchase_type === 'whole' ? 1.0 : purchase_type === 'half' ? 0.5 : 0.25;
    const remaining = (animal.total_animals || 1) - (animal.units_used || 0);

    if (remaining < unitCost) {
      return NextResponse.json({
        error: 'No spots remaining for this selection. Please go back and choose another.',
      }, { status: 409 });
    }

    // 2. Upsert customer (match on email)
    let customerId: string;
    const { data: existingCustomer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('email', email)
      .single();

    if (existingCustomer) {
      await supabaseAdmin
        .from('customers')
        .update({ name, phone, address, city, state, zip })
        .eq('id', existingCustomer.id);
      customerId = existingCustomer.id;
    } else {
      const { data: newCustomer, error: customerError } = await supabaseAdmin
        .from('customers')
        .insert({ name, email, phone, address, city, state, zip })
        .select('id')
        .single();

      if (customerError || !newCustomer) {
        console.error('Error creating customer:', customerError);
        return NextResponse.json({ error: 'Failed to create customer record' }, { status: 500 });
      }
      customerId = newCustomer.id;
    }

    // 3. Create session record (slot_id is nullable per block7 migration)
    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .insert({
        customer_id:     customerId,
        animal_id:       animal_id,
        purchase_type:   purchase_type,
        status:          'draft',
        partner_approved: false,
        owner_approved:   false,
        last_saved:       new Date().toISOString(),
      })
      .select('id')
      .single();

    if (sessionError || !sessionData) {
      console.error('Error creating session:', sessionError);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    const sessionId = sessionData.id;

    // 4. Increment units_used on the animal (optimistic — race condition handled by check above)
    const { error: updateError } = await supabaseAdmin
      .from('animals')
      .update({ units_used: (animal.units_used || 0) + unitCost })
      .eq('id', animal_id);

    if (updateError) {
      console.error('Error updating animal slots_used:', updateError);
      // Non-fatal — log but continue
    }

    // NOTE: No confirmation email sent here.
    // A single comprehensive confirmation email is sent by /api/payments/confirm
    // after the deposit is successfully paid.

    return NextResponse.json({
      success:     true,
      session_id:  sessionId,
      customer_id: customerId,
      message:     'Booking confirmed! You will receive a confirmation email after your deposit is processed.',
    });
  } catch (err) {
    console.error('Unexpected booking error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
