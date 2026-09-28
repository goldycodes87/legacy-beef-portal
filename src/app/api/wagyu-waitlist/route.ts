export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const ANIMAL_TYPES = ['wagyu', 'grass_fed', 'grain_finished', 'any'];
const SIZES = ['whole', 'half', 'quarter', 'any'];

/**
 * Waitlist signups. Originally Wagyu-only; now also used when a butcher date
 * is fully claimed, so a sold-out page has somewhere to send people instead of
 * dead-ending them.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_name, email, phone, size_preference, animal_type } = body;

    if (!customer_name || !email) {
      return NextResponse.json(
        { error: 'Please give us a name and an email address.' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return NextResponse.json({ error: 'That email address looks incomplete.' }, { status: 400 });
    }

    const animalType = ANIMAL_TYPES.includes(animal_type) ? animal_type : 'wagyu';
    const size = SIZES.includes(size_preference) ? size_preference : 'any';

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('waitlist')
      .insert({
        animal_type: animalType,
        customer_name,
        email: String(email).toLowerCase().trim(),
        phone: phone || null,
        size_preference: size,
        status: 'waiting',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Waitlist insert error:', error);
      return NextResponse.json(
        { error: 'We could not save that. Please try again, or call us at (719) 258-1777.' },
        { status: 500 }
      );
    }

    const label = animalType === 'wagyu' ? 'Wagyu' : animalType === 'any' ? 'Any type' : animalType.replace('_', '-');

    const sizeLabel =
      size === 'whole' ? 'Whole Beef' : size === 'half' ? 'Half Beef' : size === 'quarter' ? 'Quarter Beef' : 'Any size';
    const wantsLabel = `${label} — ${sizeLabel}`;

    // Notify Grant, and confirm to the customer so joining the list doesn't
    // feel like shouting into the void.
    try {
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey && resendKey !== 're_placeholder_set_in_vercel') {
        const { Resend } = await import('resend');
        const resend = new Resend(resendKey);
        await resend.emails.send({
          from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
          to: 'grant@legacylandandcattleco.com',
          subject: `Waitlist: ${customer_name} — ${label} ${size}`,
          html: `<ul>
            <li><strong>Name:</strong> ${customer_name}</li>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Phone:</strong> ${phone || 'Not given'}</li>
            <li><strong>Wants:</strong> ${wantsLabel}</li>
          </ul>`,
        });

        const { build, waitlistConfirmation } = await import('@/lib/email-content');
        const firstName = String(customer_name).split(' ')[0] || 'there';
        const { subject, html } = build(waitlistConfirmation, { firstName, wantsLabel });
        await resend.emails.send({
          from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
          to: String(email).toLowerCase().trim(),
          subject,
          html,
        });
      }
    } catch (emailErr) {
      console.error('Waitlist notification email failed:', emailErr);
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    console.error('Waitlist error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
