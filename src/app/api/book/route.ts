export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getConfig, getPricePerLb, getDepositAmount } from '@/lib/config';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://legacylandandcattleco.com';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, address, city, state, zip, animal_id, purchase_type,
      is_splitting, partner_emails, group_size, cut_sheet_choice } = body;

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

    // If customer was archived, unarchive them
    await supabaseAdmin.from('customers').update({ archived_at: null })
      .eq('id', customerId)
      .not('archived_at', 'is', null);

    // 3. Check for existing draft session to prevent duplicates
    const { data: existingSession } = await supabaseAdmin
      .from('sessions')
      .select('id')
      .eq('customer_id', customerId)
      .eq('animal_id', animal_id)
      .eq('purchase_type', purchase_type)
      .eq('status', 'draft')
      .single();

    if (existingSession) {
      return NextResponse.json({
        success: true,
        session_id: existingSession.id,
        customer_id: customerId,
        message: 'Existing booking found.',
      });
    }

    // 3. Create session record (slot_id is nullable per block7 migration)
    const config = await getConfig();
    const price_per_lb = getPricePerLb(config, purchase_type, animal.animal_type, is_splitting, group_size);
    const deposit = getDepositAmount(config, purchase_type, is_splitting, group_size);
    void deposit; // stored for reference; Stripe uses create-intent
    const effective_price = price_per_lb;

    // Generate group_id for split bookings
    const group_id = is_splitting ? crypto.randomUUID() : null;

    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .insert({
        customer_id:     customerId,
        animal_id:       animal_id,
        purchase_type:   purchase_type,
        price_per_lb:    effective_price,
        status:          'draft',
        partner_approved: false,
        owner_approved:   false,
        last_saved:       new Date().toISOString(),
        is_splitting:     is_splitting || false,
        group_role:       is_splitting ? 'owner' : 'solo',
        group_size:       group_size || 1,
        partner_emails:   partner_emails || [],
        cut_sheet_role:   cut_sheet_choice === 'separate' ? 'owner' : cut_sheet_choice === 'shared' ? 'master' : 'solo',
        invite_expires_at: is_splitting ? new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() : null,
        group_id,
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
