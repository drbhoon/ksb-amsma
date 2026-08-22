import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { MEMBERSHIP_TIERS } from '@/config/membership';
import {
  tallyReviews,
  computeStatus,
  paymentExpiryFromNow,
} from '@/lib/membership';
import { generateToken } from '@/lib/tokens';
import { sendApprovalNotification, sendRejectionNotification } from '@/lib/email';

const schema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  comment: z.string().max(500).optional(),
});

type Ctx = { params: { token: string } };

export async function POST(req: Request, { params }: Ctx) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
    }
    if (parsed.data.decision === 'REJECT' && !parsed.data.comment?.trim()) {
      return NextResponse.json(
        { error: 'A reason is required when rejecting an application.' },
        { status: 400 }
      );
    }

    // Look up review by magic-link token
    const review = await prisma.applicationReview.findUnique({
      where: { token: params.token },
      include: { application: true, committeeMember: true },
    });
    if (!review) {
      return NextResponse.json({ error: 'Invalid review link.' }, { status: 404 });
    }
    if (review.tokenExpiresAt < new Date()) {
      return NextResponse.json({ error: 'This review link has expired.' }, { status: 410 });
    }
    if (review.decision !== 'PENDING') {
      return NextResponse.json({ error: 'You have already recorded your vote.' }, { status: 409 });
    }
    if (
      review.application.status !== 'UNDER_REVIEW' &&
      review.application.status !== 'SUBMITTED'
    ) {
      return NextResponse.json(
        { error: 'This application is no longer under review.' },
        { status: 409 }
      );
    }

    // Record the vote
    await prisma.applicationReview.update({
      where: { id: review.id },
      data: {
        decision: parsed.data.decision,
        comment: parsed.data.comment,
        decidedAt: new Date(),
      },
    });

    // Recompute tally and status
    const { approvals, rejections } = await tallyReviews(review.applicationId);
    const { newStatus, decided } = computeStatus(
      approvals,
      rejections,
      review.application.status
    );

    // If we've reached a decision (approved or rejected), update the application
    // and trigger the appropriate follow-up email.
    if (decided) {
      if (newStatus === 'PAYMENT_PENDING') {
        const paymentToken = generateToken();
        const paymentExpiresAt = paymentExpiryFromNow();
        const tier = MEMBERSHIP_TIERS[review.application.tier];

        await prisma.membershipApplication.update({
          where: { id: review.applicationId },
          data: {
            status: 'PAYMENT_PENDING',
            decidedAt: new Date(),
            paymentToken,
            paymentExpiresAt,
            paymentLinkSentAt: new Date(),
          },
        });

        // Fire and forget
        sendApprovalNotification({
          applicantEmail: review.application.contactEmail,
          contactName: review.application.contactName,
          applicationNo: review.application.applicationNo,
          organizationName: review.application.organizationName,
          amountRupees: tier.annualFeeRupees,
          paymentToken,
          paymentExpiresAt,
        }).catch((e) => console.error('[vote] approval email failed', e));
      } else if (newStatus === 'REJECTED') {
        // Gather all rejection comments for context
        const rejections = await prisma.applicationReview.findMany({
          where: { applicationId: review.applicationId, decision: 'REJECT' },
          select: { comment: true },
        });
        const reasons = rejections
          .map((r) => r.comment)
          .filter(Boolean)
          .join(' · ');

        await prisma.membershipApplication.update({
          where: { id: review.applicationId },
          data: {
            status: 'REJECTED',
            decidedAt: new Date(),
            rejectionReason: reasons || null,
          },
        });

        sendRejectionNotification({
          applicantEmail: review.application.contactEmail,
          contactName: review.application.contactName,
          applicationNo: review.application.applicationNo,
          organizationName: review.application.organizationName,
          reason: reasons,
        }).catch((e) => console.error('[vote] rejection email failed', e));
      }
    }

    return NextResponse.json({
      success: true,
      decision: parsed.data.decision,
      newStatus,
      approvals,
      rejections,
    });
  } catch (err) {
    console.error('[review/vote]', err);
    return NextResponse.json({ error: 'Vote could not be recorded.' }, { status: 500 });
  }
}
