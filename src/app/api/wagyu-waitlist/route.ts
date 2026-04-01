export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_name, email, phone, size_preference } = body;

    if (!customer_name || !email || !size_preference) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert into waitlist table
    const { data, error } = await supabase
      .from('waitlist')
      .insert({
        animal_type: 'wagyu',
        customer_name,
        email,
        phone: phone || null,
        size_preference,
        status: 'waiting',
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to save waitlist entry' }, { status: 500 });
    }

    // Send Telegram notification
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_GRANT_CHAT_ID;

    if (botToken && chatId) {
      const phoneDisplay = phone || 'N/A';
      const message = `🥩 New Wagyu waitlist: ${customer_name} wants a ${size_preference} — ${email} / ${phoneDisplay}`;

      try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
          }),
        });
      } catch (telegramError) {
        // Non-fatal: log but don't fail the request
        console.error('Telegram notification failed:', telegramError);
      }
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    console.error('Wagyu waitlist error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
