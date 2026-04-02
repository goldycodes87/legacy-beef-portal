export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as 'magiclink' | 'email' | null;

  if (!token_hash || !type) {
    return NextResponse.redirect(`${origin}/auth?error=missing_token`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.verifyOtp({ token_hash, type });

  if (error || !data.session) {
    return NextResponse.redirect(`${origin}/auth?error=link_expired`);
  }

  // Find their session and redirect to cut sheet
  const supabaseAdmin = getSupabaseAdmin();
  const { data: customer } = await supabaseAdmin
    .from('customers')
    .select('id')
    .eq('email', data.session.user.email!)
    .single();

  if (customer) {
    const { data: beefSession } = await supabaseAdmin
      .from('sessions')
      .select('id, cut_sheet_complete')
      .eq('customer_id', customer.id)
      .not('status', 'eq', 'cancelled')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (beefSession) {
      const destination = beefSession.cut_sheet_complete
        ? `/session/${beefSession.id}`
        : `/session/${beefSession.id}/cuts`;
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/`);
}
