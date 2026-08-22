import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { activateMembership } from '@/lib/membership';

/**
 * Razorpay webhook — server-side reconciliation.
 *
 * Handles the case where the client-side handler in PaymentCheckout fails
 * (e.g. user closes browser mid-transaction). Razorpay retries this endpoint
 * with the same event, so all logic must be idempotent.
 *
 * Configure in Razorpay Dashboard:
 *   URL: https://amsma.in/api/payments/webhook
 *   Events: payment.captured
 *   Secret: match RAZORPAY_WEBHOOK_SECRET env var
 */

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || '';

    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error('[webhook] signature verification failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    // We only act on payment.captured
    if (event.event !== 'payment.captured') {
      return NextResponse.json({ received: true, ignored: event.event });
    }

    const payment = event.payload?.payment?.entity;
    if (!payment?.order_id || !payment?.id) {
      return NextResponse.json({ error: 'Missing payment data' }, { status: 400 });
    }

    // Look up the application via Razorpay order id
    const app = await prisma.membershipApplication.findFirst({
      where: { razorpayOrderId: payment.order_id },
    });
    if (!app) {
      console.warn('[webhook] no application found for order', payment.order_id);
      return NextResponse.json({ received: true, note: 'no matching application' });
    }

    // activateMembership is idempotent, so Razorpay's retries are safe and a
    // race with the client-side verify callback cannot double-create a Member.
    const { memberNo, already } = await activateMembership({
      applicationId: app.id,
      paymentRef: payment.id,
      amountPaidPaise: app.annualFeePaise,
    });

    if (already) return NextResponse.json({ received: true, already: true, memberNo });

    return NextResponse.json({ received: true, activated: true, memberNo });
  } catch (err) {
    console.error('[webhook]', err);
    // Return 500 so Razorpay retries
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
