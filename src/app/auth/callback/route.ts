import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const errorParam = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle OAuth/OTP errors passed in URL
  if (errorParam) {
    console.error('Auth callback error:', errorParam, errorDescription);
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent(errorDescription || errorParam)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth?error=missing_code`);
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  // Exchange the code for a session
  const { data: authData, error: authError } = await supabase.auth.exchangeCodeForSession(code);

  if (authError || !authData.session) {
    console.error('Error exchanging code for session:', authError);
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent(authError?.message || 'auth_failed')}`
    );
  }

  const userEmail = authData.session.user.email;

  // Check if this customer has an existing session in our sessions table
  try {
    // Find customer by email in our customers table
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (customer) {
      // Find their most recent non-cancelled session
      const { data: customerSession } = await supabaseAdmin
        .from('sessions')
        .select('id')
        .eq('customer_id', customer.id)
        .not('status', 'eq', 'cancelled')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (customerSession) {
        // Existing customer with a session — send them to it
        return NextResponse.redirect(`${origin}/session/${customerSession.id}`);
      }
    }
  } catch (err) {
    console.error('Error looking up customer session:', err);
    // Non-fatal — fall through to /book
  }

  // New customer or no existing session — send to booking
  return NextResponse.redirect(`${origin}/book`);
}
