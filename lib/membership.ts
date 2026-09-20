import { prisma } from './db';
import { sendPaymentReceipt } from './email';
import type {
  MembershipApplication,
  ReviewDecision,
} from '@prisma/client';

/**
 * Generate a human-friendly application number: AMSMA-2026-0001
 * Uses the count of existing applications in the current year as counter.
 * Not race-safe under extreme concurrency, but adequate for the expected volume
 * (a handful of applications per month).
 */
export async function generateApplicationNo(): Promise<string> {
  const year = new Date().getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const count = await prisma.membershipApplication.count({
    where: { submittedAt: { gte: startOfYear } },
  });
  return `AMSMA-${year}-${String(count + 1).padStart(4, '0')}`;
}

/**
 * Generate a member number for approved+paid applicants: AMSMA-M-0001
 */
export async function generateMemberNo(): Promise<string> {
  const latest = await prisma.member.findFirst({ orderBy: { memberNo: 'desc' }, select: { memberNo: true } });
  const current = Number(latest?.memberNo.match(/(\d+)$/)?.[1] || 0);
  return `AMSMA-M-${String(current + 1).padStart(4, '0')}`;
}

/** Count approvals and rejections for an application. */
export async function tallyReviews(applicationId: string) {
  const grouped = await prisma.applicationReview.groupBy({
    by: ['decision'],
    where: { applicationId },
    _count: true,
  });
  let approvals = 0;
  let rejections = 0;
  let pending = 0;
  grouped.forEach((g) => {
    if (g.decision === 'APPROVE') approvals = g._count;
    if (g.decision === 'REJECT') rejections = g._count;
    if (g.decision === 'PENDING') pending = g._count;
  });
  return { approvals, rejections, pending };
}

/** Payment window: how long applicant has to pay after approval (14 days). */
export const PAYMENT_WINDOW_DAYS = 14;

export function paymentExpiryFromNow(): Date {
  const d = new Date();
  d.setDate(d.getDate() + PAYMENT_WINDOW_DAYS);
  return d;
}

/** Sponsor endorsements can remain open for seven days. */
export const SPONSOR_REVIEW_WINDOW_DAYS = 7;

/** Full committee voting starts after both sponsors endorse and lasts 48 hours. */
export const COMMITTEE_REVIEW_WINDOW_HOURS = 48;

export function reviewTokenExpiryFromNow(): Date {
  const d = new Date();
  d.setDate(d.getDate() + SPONSOR_REVIEW_WINDOW_DAYS);
  return d;
}

export function committeeReviewExpiryFromNow(): Date {
  return new Date(Date.now() + COMMITTEE_REVIEW_WINDOW_HOURS * 60 * 60 * 1000);
}

export type ApplicationWithReviews = MembershipApplication & {
  reviews: Array<{
    id: string;
    decision: ReviewDecision;
    comment: string | null;
    decidedAt: Date | null;
    committeeMember: { name: string; role: string };
  }>;
};

/**
 * Activate a membership: flip the application to ACTIVE and write the Member row
 * (the Register of Members per Rules Sec 4.iii), then email a receipt.
 *
 * Shared by the Razorpay verify endpoint and — while Razorpay is on hold — the
 * test-mode activation endpoint, so both paths produce identical database state.
 * Idempotent: calling twice returns the member created the first time.
 */
export async function activateMembership(params: {
  applicationId: string;
  /** Razorpay payment id, or a TEST-* reference when payments are stubbed. */
  paymentRef: string;
  amountPaidPaise?: number;
}): Promise<{ memberNo: string; already: boolean }> {
  const app = await prisma.membershipApplication.findUnique({
    where: { id: params.applicationId },
  });
  if (!app) throw new Error(`Application ${params.applicationId} not found`);

  // Idempotency — a webhook and a client callback can both land here.
  if (app.status === 'ACTIVE') {
    const existing = await prisma.member.findUnique({ where: { applicationId: app.id } });
    if (existing) return { memberNo: existing.memberNo, already: true };
  }

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  const memberNo = await generateMemberNo();
  const amountPaise = params.amountPaidPaise ?? app.annualFeePaise;

  const [, member] = await prisma.$transaction([
    prisma.membershipApplication.update({
      where: { id: app.id },
      data: {
        status: 'ACTIVE',
        razorpayPaymentId: params.paymentRef,
        amountPaidPaise: amountPaise,
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

  sendPaymentReceipt({
    applicantEmail: app.contactEmail,
    contactName: app.contactName,
    organizationName: app.organizationName,
    memberNo: member.memberNo,
    amountRupees: Math.round(amountPaise / 100),
    razorpayPaymentId: params.paymentRef,
    paidAt: now,
  }).catch((e) => console.error('[activateMembership] receipt email failed', e));

  return { memberNo: member.memberNo, already: false };
}

/** True when Razorpay is configured and enabled. While the Society is in */
/** formation Razorpay is on hold, so this is false and the pay page shows  */
/** a test-mode activation instead.                                        */
export function paymentsEnabled(): boolean {
  return (
    process.env.PAYMENTS_ENABLED === 'true' &&
    Boolean(process.env.RAZORPAY_KEY_ID) &&
    Boolean(process.env.RAZORPAY_KEY_SECRET)
  );
}

/** Test-mode activation is only available when payments are stubbed. */
export function testPaymentsEnabled(): boolean {
  return process.env.TEST_MODE_PAYMENTS === 'true' && !paymentsEnabled();
}
