import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Routes that require authentication
const PROTECTED_ROUTES = ['/session'];

// Routes that are always public
const PUBLIC_ROUTES = ['/auth', '/book', '/api', '/payment-success', '/token', '/api/token', '/'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for non-protected routes
  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  if (!isProtected) {
    return NextResponse.next();
  }

  // Create a response to hold updated cookies
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // The session id this request is for, e.g. /session/<uuid>/cuts
  const requestedSessionId = pathname.match(/^\/session\/([^/]+)/)?.[1] ?? null;

  // A cookie grants access only to its own session. Exact match — a substring
  // check would let an empty cookie value unlock every order.
  const grantsAccess = (value: string | undefined) =>
    !!value && !!requestedSessionId && value === requestedSessionId;

  if (grantsAccess(request.cookies.get('payment_just_completed')?.value)) {
    return NextResponse.next();
  }

  if (grantsAccess(request.cookies.get('order_access')?.value)) {
    return NextResponse.next();
  }
  // Also allow the /access/* routes through
  if (pathname.startsWith('/access')) {
    return NextResponse.next();
  }

  // Check session — IMPORTANT: do not run arbitrary code between createServerClient and getUser
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Extract session UUID from /session/[uuid]/... path
    const sessionMatch = pathname.match(/^\/session\/([^\/]+)/);
    if (sessionMatch) {
      const sessionId = sessionMatch[1];
      const redirectUrl = new URL(`/access/${sessionId}`, request.url);
      return NextResponse.redirect(redirectUrl);
    }
    // Fallback for any other protected route
    const redirectUrl = new URL('/access', request.url);
    redirectUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
