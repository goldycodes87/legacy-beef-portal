export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = getSupabaseAdmin();
  const { data: session } = await supabase
    .from('sessions')
    .select('id, access_token_expires_at, status')
    .eq('access_token', token)
    .single();

  if (!session) {
    return NextResponse.redirect(new URL('/access-expired', request.url));
  }
  if (new Date(session.access_token_expires_at) < new Date()) {
    return NextResponse.redirect(new URL('/access-expired', request.url));
  }

  const response = NextResponse.redirect(
    new URL(`/session/${session.id}/cuts`, request.url)
  );
  response.cookies.set('order_access', session.id, {
    httpOnly: true, secure: true, sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 90, path: '/',
  });
  return response;
}
