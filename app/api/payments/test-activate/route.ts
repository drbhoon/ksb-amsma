import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { activateMembership, testPaymentsEnabled } from '@/lib/membership';

/**
 * Test-mode activation — stands in for Razorpay while the Society is in
 * formation and no payment gateway account exists yet.
 *
 * Records the membership exactly as a real payment would, with a TEST-* payment
 * reference so test rows are trivially distinguishable in the Register of Members.
 *
 * Gated on TEST_MODE_PAYMENTS=true AND real payments being off, so enabling
 * Razorpay later automatically disables this route. Never set TEST_MODE_PAYMENTS
 * in production.
 */

const schema = z.object({ paymentToken: z.string().min(10).max(200) });

export async function POST(req: Request) {
  if (!testPaymentsEnabled()) {
    return NextResponse.json({ error: 'Test-mode payments are not enabled.' }, { status: 404 });
  }

  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

    const app = await prisma.membershipApplication.findUnique({
      where: { paymentToken: parsed.data.paymentToken },
    });
    if (!app) return NextResponse.json({ error: 'Invalid payment link.' }, { status: 404 });

    if (app.status === 'ACTIVE') {
      const existing = await prisma.member.findUnique({ where: { applicationId: app.id } });
      return NextResponse.json({ success: true, memberNo: existing?.memberNo, already: true });
    }
    if (app.status !== 'PAYMENT_PENDING') {
      return NextResponse.json(
        { error: 'This application is not awaiting payment.' },
        { status: 409 }
      );
    }
    if (app.paymentExpiresAt && app.paymentExpiresAt < new Date()) {
      return NextResponse.json({ error: 'Payment link has expired.' }, { status: 410 });
    }

    const { memberNo } = await activateMembership({
      applicationId: app.id,
      paymentRef: `TEST-${Date.now()}`,
      amountPaidPaise: app.annualFeePaise,
    });

    console.log(`[test-activate] ${app.applicationNo} → member ${memberNo} (TEST MODE, no money moved)`);
    return NextResponse.json({ success: true, memberNo });
  } catch (err) {
    console.error('[payments/test-activate]', err);
    return NextResponse.json({ error: 'Test activation failed.' }, { status: 500 });
  }
}
