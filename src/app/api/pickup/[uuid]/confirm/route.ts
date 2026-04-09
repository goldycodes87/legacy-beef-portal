// This is a wrapper to handle GET requests that confirm and display confirmation
// The actual confirmation happens in the parent POST route.
// This stub handles any GET requests for confirmation display.
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params;
  return NextResponse.json({
    message: 'Pickup confirmed for session ' + uuid,
  });
}
