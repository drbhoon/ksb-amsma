import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { verifyCheckoutSignature } from '@/lib/razorpay';
import { generateMemberNo } from '@/lib/membership';
import { sendPaymentReceipt } from '@/lib/email';
import { MEMBERSHIP_TIERS } from '@/config/membership';

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

    // Idempotent: if webhook already ran, just return existing member
    if (app.status === 'ACTIVE') {
      const existing = await prisma.member.findUnique({ where: { applicationId: app.id } });
      return NextResponse.json({ success: true, memberNo: existing?.memberNo, already: true });
    }

    // Compute expiry: 12 months from now
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const memberNo = await generateMemberNo();
    const tier = MEMBERSHIP_TIERS[app.tier];

    // Transactionally: activate application + create Member row
    const [_updatedApp, member] = await prisma.$transaction([
      prisma.membershipApplication.update({
        where: { id: app.id },
        data: {
          status: 'ACTIVE',
          razorpayPaymentId: d.razorpay_payment_id,
          amountPaidPaise: app.annualFeePaise,
          paidAt: now,
        },
      }),
      prisma.member.create({
        data: {
          memberNo,
          applicationId: app.id,
          tier: app.tier,
          organizationName: app.organizationName,
          contactName: app.contactName,
          email: app.contactEmail,
          phone: app.contactPhone,
          address: `${app.addressLine}, ${app.city}, ${app.state} - ${app.pincode}`,
          city: app.city,
          state: app.state,
          pan: app.pan,
          gstNumber: app.gstNumber,
          crushingCapacityMtMonth: app.crushingCapacityMtMonth,
          expiresAt,
          admittedAt: now,
          status: 'ACTIVE',
        },
      }),
    ]);

    // Receipt email — fire and forget
    sendPaymentReceipt({
      applicantEmail: app.contactEmail,
      contactName: app.contactName,
      organizationName: app.organizationName,
      memberNo: member.memberNo,
      amountRupees: tier.annualFeeRupees,
      razorpayPaymentId: d.razorpay_payment_id,
      paidAt: now,
    }).catch((e) => console.error('[payments/verify] receipt email failed', e));

    return NextResponse.json({
      success: true,
      memberNo: member.memberNo,
    });
  } catch (err) {
    console.error('[payments/verify]', err);
    return NextResponse.json({ error: 'Payment verification failed.' }, { status: 500 });
  }
}
