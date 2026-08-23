import { NextResponse } from 'next/server';
import { sendTestEmail, emailProvider, emailMode } from '@/lib/email';

/**
 * Confirm the mail transport actually delivers, without having to submit a
 * whole membership application to find out.
 *
 * Guarded by DEV_ACCESS_KEY, like the test console. In redirect mode the
 * message can only reach the EMAIL_REDIRECT_TO addresses regardless of the
 * `to` parameter, so this cannot be used to mail arbitrary people.
 */
export async function GET(req: Request) {
  const expected = process.env.DEV_ACCESS_KEY;
  const url = new URL(req.url);
  if (!expected || url.searchParams.get('key') !== expected) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const to = url.searchParams.get('to') || 'test@example.invalid';
  const result = await sendTestEmail(to);

  return NextResponse.json({
    provider: emailProvider(),
    mode: emailMode(),
    requestedRecipient: to,
    result,
  });
}
