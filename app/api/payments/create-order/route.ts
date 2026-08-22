import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { createOrder } from '@/lib/razorpay';

const schema = z.object({ paymentToken: z.string().min(10).max(200) });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

    const app = await prisma.membershipApplication.findUnique({
      where: { paymentToken: parsed.data.paymentToken },
    });
    if (!app) return NextResponse.json({ error: 'Invalid payment link.' }, { status: 404 });
    if (app.status !== 'PAYMENT_PENDING') {
      return NextResponse.json({ error: 'Payment is not available for this application.' }, { status: 409 });
    }
    if (app.paymentExpiresAt && app.paymentExpiresAt < new Date()) {
      return NextResponse.json({ error: 'Payment link has expired.' }, { status: 410 });
    }

    const order = await createOrder({
      amountPaise: app.annualFeePaise,
      receipt: app.applicationNo,
      notes: {
        application_id: app.id,
        application_no: app.applicationNo,
        organization: app.organizationName,
      },
    });

    // Persist order id for reconciliation with webhook
    await prisma.membershipApplication.update({
      where: { id: app.id },
      data: { razorpayOrderId: order.id },
    });

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
    if (!keyId) {
      return NextResponse.json({ error: 'Payment not configured.' }, { status: 500 });
    }

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    });
  } catch (err) {
    console.error('[payments/create-order]', err);
    return NextResponse.json({ error: 'Could not create order.' }, { status: 500 });
  }
}
