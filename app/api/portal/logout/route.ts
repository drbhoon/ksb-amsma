import { NextResponse } from 'next/server';
import { clearPortalSession } from '@/lib/portal-auth';

export async function POST() {
  if (process.env.PORTAL_TEST_AUTH !== 'true') return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  await clearPortalSession();
  return NextResponse.json({ success: true });
}
