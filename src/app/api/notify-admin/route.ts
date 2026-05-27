export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { title, body, url } = await request.json();
  const secret = request.headers.get('x-notify-secret');
  if (secret !== process.env.ADMIN_NOTIFY_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.legacylandandcattleco.com';
  await fetch(`${adminUrl}/api/push/notify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-notify-secret': process.env.ADMIN_NOTIFY_SECRET!,
    },
    body: JSON.stringify({ title, body, url }),
  });
  return NextResponse.json({ success: true });
}
