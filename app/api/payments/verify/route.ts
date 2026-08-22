import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { verifyCheckoutSignature } from '@/lib/razorpay';
import { activateMembership } from '@/lib/membership';

const schema = z.object({
  paymentToken: z.string().min(10).max(200),
  razorpay_order_id: z.string().min(5),
  razorpay_payment_id: z.string().min(5),
  razorpay_signature: z.string().min(20),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

    const d = parsed.data;
    const app = await prisma.membershipApplication.findUnique({
      where: { paymentToken: d.paymentToken },
    });
    if (!app) return NextResponse.json({ error: 'Invalid payment link.' }, { status: 404 });

    // Verify order id matches what we generated
    if (app.razorpayOrderId !== d.razorpay_order_id) {
      return NextResponse.json({ error: 'Order mismatch.' }, { status: 400 });
    }

    // Verify HMAC signature
    const validSig = verifyCheckoutSignature({
      orderId: d.razorpay_order_id,
      paymentId: d.razorpay_payment_id,
      signature: d.razorpay_signature,
    });
    if (!validSig) {
      console.error('[payments/verify] signature mismatch', { app: app.applicationNo });
      return NextResponse.json({ error: 'Payment signature verification failed.' }, { status: 400 });
    }

    // Activate — idempotent, so a racing webhook is harmless
    const { memberNo, already } = await activateMembership({
      applicationId: app.id,
      paymentRef: d.razorpay_payment_id,
      amountPaidPaise: app.annualFeePaise,
    });

    return NextResponse.json({ success: true, memberNo, already });
  } catch (err) {
    console.error('[payments/verify]', err);
    return NextResponse.json({ error: 'Payment verification failed.' }, { status: 500 });
  }
}
