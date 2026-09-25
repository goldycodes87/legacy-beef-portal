export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * Receives Resend webhook events (email.sent / delivered / bounced /
 * complained / delivery_delayed) and records them in email_events, so
 * "did that email go out?" is answerable from our own database — including
 * bounces, which Resend knows about and we otherwise never would.
 *
 * Setup (one time): Resend dashboard → Webhooks → Add endpoint
 *   https://www.legacylandandcattleco.com/api/webhooks/resend
 * then copy its signing secret into Vercel as RESEND_WEBHOOK_SECRET.
 *
 * Resend signs with Svix. Verification is mandatory: without the secret this
 * endpoint refuses, because accepting unsigned posts would let anyone write
 * fiction into the email log.
 */

function verifySvix(secret: string, headers: Headers, rawBody: string): boolean {
  const id = headers.get('svix-id');
  const timestamp = headers.get('svix-timestamp');
  const signatures = headers.get('svix-signature');
  if (!id || !timestamp || !signatures) return false;

  // Reject stale timestamps (5 minute window) to blunt replay.
  const ts = parseInt(timestamp, 10);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false;

  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const signedContent = `${id}.${timestamp}.${rawBody}`;
  const expected = crypto.createHmac('sha256', secretBytes).update(signedContent).digest('base64');

  // Header holds space-separated versioned signatures: "v1,<base64> v1,<base64>"
  return signatures.split(' ').some((part) => {
    const [version, sig] = part.split(',');
    if (version !== 'v1' || !sig) return false;
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
    } catch {
      return false;
    }
  });
}

export async function POST(request: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    // Not configured yet — refuse loudly rather than logging unverifiable data.
    return NextResponse.json({ error: 'webhook_not_configured' }, { status: 503 });
  }

  const rawBody = await request.text();
  if (!verifySvix(secret, request.headers, rawBody)) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
  }

  let event: {
    type?: string;
    data?: {
      email_id?: string;
      to?: string[] | string;
      from?: string;
      subject?: string;
    };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const to = Array.isArray(event.data?.to) ? event.data?.to[0] : event.data?.to;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('email_events').insert({
    resend_email_id: event.data?.email_id ?? null,
    event_type: event.type ?? 'unknown',
    to_email: to?.toLowerCase() ?? null,
    from_email: event.data?.from ?? null,
    subject: event.data?.subject ?? null,
    payload: event.data ?? {},
  });

  if (error) {
    console.error('email_events insert failed:', error);
    // 500 so Resend retries — better a duplicate row than a lost event.
    return NextResponse.json({ error: 'store_failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
