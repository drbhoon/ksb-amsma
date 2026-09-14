import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getCurrentPortalUser } from '@/lib/portal-auth';
import { recordAudit } from '@/lib/audit';
import { advanceAfterReview, pauseExpiredCommitteeReviews } from '@/lib/approval-workflow';

const schema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  comment: z.string().max(500).optional(),
});

type Ctx = { params: Promise<{ token: string }> };

export async function POST(req: Request, { params }: Ctx) {
  try {
    const { token } = await params;
    const user = await getCurrentPortalUser();
    if (!user || user.role !== 'COMMITTEE' || !user.committeeMemberId) {
      return NextResponse.json({ error: 'Please sign in with the assigned committee account.' }, { status: 401 });
    }
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
    }
    if (parsed.data.decision === 'REJECT' && !parsed.data.comment?.trim()) {
      return NextResponse.json({ error: 'A reason is required when rejecting an application.' }, { status: 400 });
    }

    await pauseExpiredCommitteeReviews();
    const review = await prisma.applicationReview.findUnique({
      where: { token },
      include: { application: true },
    });
    if (!review) return NextResponse.json({ error: 'Invalid review link.' }, { status: 404 });
    if (review.committeeMemberId !== user.committeeMemberId) {
      return NextResponse.json({ error: 'This review is assigned to another committee member.' }, { status: 403 });
    }
    if (review.tokenExpiresAt < new Date()) {
      return NextResponse.json({ error: 'This review period has ended.' }, { status: 410 });
    }
    if (review.decision !== 'PENDING') {
      return NextResponse.json({ error: 'You have already recorded this decision.' }, { status: 409 });
    }
    const expectedStatus = review.phase === 'SPONSOR' ? 'SPONSOR_REVIEW' : 'COMMITTEE_REVIEW';
    if (review.application.status !== expectedStatus) {
      return NextResponse.json({ error: 'This application is not open for your decision.' }, { status: 409 });
    }

    const result = await prisma.applicationReview.updateMany({
      where: { id: review.id, decision: 'PENDING' },
      data: {
        decision: parsed.data.decision,
        comment: parsed.data.comment?.trim() || null,
        decidedAt: new Date(),
      },
    });
    if (result.count !== 1) {
      return NextResponse.json({ error: 'This decision was already recorded.' }, { status: 409 });
    }
    await recordAudit({
      applicationId: review.applicationId,
      actorUserId: user.id,
      event: review.phase === 'SPONSOR' ? 'SPONSOR_DECISION_RECORDED' : 'COMMITTEE_VOTE_RECORDED',
      details: { decision: parsed.data.decision, reviewerId: review.committeeMemberId },
    });
    const outcome = await advanceAfterReview(review.applicationId, user.id);
    return NextResponse.json({ success: true, decision: parsed.data.decision, ...outcome });
  } catch (err) {
    console.error('[review/vote]', err);
    return NextResponse.json({ error: 'The decision could not be recorded.' }, { status: 500 });
  }
}
