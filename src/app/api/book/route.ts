export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getConfig, getPricePerLb, getDepositAmount } from '@/lib/config';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://legacylandandcattleco.com';

function purchaseTypeLabel(type: string): string {
  switch (type) {
    case 'whole': return 'Whole Beef';
    case 'half': return 'Half Beef';
    case 'quarter': return 'Quarter Beef';
    default: return type;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, address, city, state, zip, animal_id, purchase_type,
      is_splitting, partner_emails, partner_names, group_size, cut_sheet_choice } = body;

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

    // Fast feedback before we create records. The real guarantee is the
    // atomic claim below — this check alone would let two simultaneous
    // bookings both pass and oversell the animal.
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
    const price_per_lb = getPricePerLb(config, purchase_type, animal.animal_type);
    const deposit = getDepositAmount(config, purchase_type, is_splitting, animal.animal_type);
    const effective_price = price_per_lb;

    // Generate group_id for split bookings
    const group_id = is_splitting ? crypto.randomUUID() : null;

    // Claim capacity atomically before creating the reservation. The database
    // locks the animal row, so simultaneous bookings queue instead of both
    // claiming the last slot.
    const { error: claimError } = await supabaseAdmin.rpc('adjust_animal_units', {
      p_animal_id: animal_id,
      p_delta: unitCost,
    });

    if (claimError) {
      if (claimError.message?.includes('insufficient_capacity')) {
        return NextResponse.json({
          error: 'That spot was just taken. Please go back and choose another date.',
        }, { status: 409 });
      }
      console.error('Error claiming animal capacity:', claimError);
      return NextResponse.json({ error: 'Failed to reserve this spot' }, { status: 500 });
    }

    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .insert({
        customer_id:     customerId,
        animal_id:       animal_id,
        purchase_type:   purchase_type,
        price_per_lb:    effective_price,
        deposit_amount:  deposit,
        status:          'draft',
        partner_approved: false,
        owner_approved:   false,
        last_saved:       new Date().toISOString(),
        is_splitting:     is_splitting || false,
        group_role:       is_splitting ? 'owner' : 'solo',
        group_size:       group_size || 1,
        partner_emails:   partner_emails || [],
        partner_names:    partner_names || [],
        cut_sheet_role:   cut_sheet_choice === 'separate' ? 'owner' : cut_sheet_choice === 'shared' ? 'master' : 'solo',
        invite_expires_at: is_splitting ? new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() : null,
        group_id,
        intended_payment_method: 'card',
      })
      .select('id')
      .single();

    if (sessionError || !sessionData) {
      console.error('Error creating session:', sessionError);
      // Give the capacity back rather than stranding it forever.
      await supabaseAdmin.rpc('adjust_animal_units', {
        p_animal_id: animal_id,
        p_delta: -unitCost,
      });
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    const sessionId = sessionData.id;

    // Send Grant new reservation notification
    try {
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey && resendKey !== 're_placeholder_set_in_vercel') {
        const { data: animalData } = await supabaseAdmin
          .from('animals')
          .select('name, butcher_date, animal_type')
          .eq('id', animal_id)
          .single();
        const { Resend } = await import('resend');
        const resend = new Resend(resendKey);
        const purchaseLabel = purchaseTypeLabel(purchase_type);
        const animalType = animalData?.animal_type === 'grass_fed' ? 'Grass-Fed'
          : animalData?.animal_type === 'grain_finished' ? 'Grain-Finished' : 'Wagyu';
        const butcherDate = animalData?.butcher_date
          ? new Date(animalData.butcher_date + 'T00:00:00').toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric'
            })
          : 'TBD';
        await resend.emails.send({
          from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
          to: 'orders@legacylandandcattleco.com',
          subject: `New Reservation: ${purchaseLabel} ${animalType} — ${name}`,
          html: `<ul>
            <li><strong>Customer:</strong> ${name}</li>
            <li><strong>Phone:</strong> ${phone || 'not given'}</li>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Reserved:</strong> ${purchaseLabel} — ${animalType}${is_splitting ? ' (splitting)' : ''}</li>
            <li><strong>Butcher Date:</strong> ${butcherDate}</li>
            <li><strong>Deposit Due:</strong> ${Number(deposit).toFixed(2)} — payment method not yet chosen</li>
            <li><strong>Session ID:</strong> ${sessionId}</li>
          </ul>`,
        });
      }
    } catch (notifyErr) {
      console.error('Grant reservation notify error:', notifyErr);
    }

    // Text alert too, when Twilio is configured.
    const { sendAdminSms } = await import('@/lib/sms');
    await sendAdminSms(
      `🐄 New reservation: ${name}, ${purchaseTypeLabel(purchase_type)}, deposit ${Number(deposit).toFixed(2)}. ${phone || 'no phone'}`
    );

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
