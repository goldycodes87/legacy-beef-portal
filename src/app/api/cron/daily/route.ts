export const dynamic = 'force-dynamic';
export const maxDuration = 300;

import { NextRequest, NextResponse } from 'next/server';
import { GET as cleanupDrafts } from '../cleanup-drafts/route';
import { GET as reminder10Day } from '../reminder-10day/route';
import { GET as reminder1Day } from '../reminder-1day/route';
import { GET as autoLock } from '../auto-lock/route';

/**
 * The one cron Vercel actually runs. The Hobby plan registers at most two
 * cron jobs, so with four entries in vercel.json only cleanup-drafts (and at
 * most one reminder) ever fired — auto-lock and last-call silently never ran,
 * which is how a cut sheet could sail past its lock date untouched. This
 * route runs all four jobs in-process, in order, under a single schedule.
 *
 * Each sub-handler keeps its own CRON_SECRET check; the incoming
 * authorization header is forwarded as-is. One job failing must not stop
 * the rest.
 */

const JOBS: Array<[string, (req: NextRequest) => Promise<Response>]> = [
  ['cleanup_drafts', cleanupDrafts],
  ['reminder_10day', reminder10Day],
  ['reminder_1day', reminder1Day],
  ['auto_lock', autoLock],
];

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<string, unknown> = {};
  for (const [name, handler] of JOBS) {
    try {
      const req = new NextRequest(`http://internal/api/cron/${name}`, {
        headers: { authorization: authHeader },
      });
      const res = await handler(req);
      results[name] = { status: res.status, body: await res.json().catch(() => null) };
    } catch (err) {
      console.error(`Daily cron job ${name} failed:`, err);
      results[name] = { error: err instanceof Error ? err.message : 'failed' };
    }
  }

  console.log('Daily cron results:', JSON.stringify(results));
  return NextResponse.json(results);
}
