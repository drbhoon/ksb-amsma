import { prisma } from './db';
import { APPROVAL_QUORUM, REJECTION_THRESHOLD } from '@/config/committee-members';
import type {
  MembershipApplication,
  ApplicationStatus,
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
  const count = await prisma.member.count();
  return `AMSMA-M-${String(count + 1).padStart(4, '0')}`;
}

/**
 * Tally votes on an application and return the resulting status.
 * Called after each committee-member vote.
 *
 * Logic:
 *   - approvals ≥ APPROVAL_QUORUM (6/8) → APPROVED → PAYMENT_PENDING
 *   - rejections ≥ REJECTION_THRESHOLD (3/8, mathematically blocks approval) → REJECTED
 *   - Otherwise → UNDER_REVIEW (still waiting)
 */
export function computeStatus(
  approvals: number,
  rejections: number,
  current: ApplicationStatus
): { newStatus: ApplicationStatus; decided: boolean } {
  // Terminal states — don't move
  if (current === 'ACTIVE' || current === 'EXPIRED') {
    return { newStatus: current, decided: false };
  }
  if (current === 'PAYMENT_PENDING' && approvals >= APPROVAL_QUORUM) {
    return { newStatus: current, decided: false };
  }

  if (approvals >= APPROVAL_QUORUM) {
    return { newStatus: 'PAYMENT_PENDING', decided: true };
  }
  if (rejections >= REJECTION_THRESHOLD) {
    return { newStatus: 'REJECTED', decided: true };
  }
  return { newStatus: 'UNDER_REVIEW', decided: false };
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

/** Magic-link review token expiry (14 days). */
export const REVIEW_TOKEN_WINDOW_DAYS = 14;

export function reviewTokenExpiryFromNow(): Date {
  const d = new Date();
  d.setDate(d.getDate() + REVIEW_TOKEN_WINDOW_DAYS);
  return d;
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
