import { NextResponse } from 'next/server';
import { pauseExpiredCommitteeReviews } from '@/lib/approval-workflow';

export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET;
  const supplied = request.headers.get('authorization');
  if (!expected || supplied !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 });
  }
  const paused = await pauseExpiredCommitteeReviews();
  return NextResponse.json({ success: true, paused });
}
