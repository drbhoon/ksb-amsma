import { prisma } from './db';
import { generateToken } from './tokens';
import {
  committeeReviewExpiryFromNow,
  paymentExpiryFromNow,
  tallyReviews,
  reviewTokenExpiryFromNow,
} from './membership';
import { APPROVAL_QUORUM, REJECTION_THRESHOLD } from '@/config/committee-members';
import { MEMBERSHIP_TIERS } from '@/config/membership';
import { recordAudit } from './audit';
import {
  sendAdminDecisionRequest,
  sendApprovalNotification,
  sendCommitteeFinalNotice,
  sendCommitteeStageNotice,
  sendRejectionNotification,
  sendReviewInvitation,
} from './email';

const TEST_APPROVAL_QUORUM = 3;
const TEST_REJECTION_THRESHOLD = 1;

function approvalThresholds(isTest: boolean) {
  return isTest
    ? { quorum: TEST_APPROVAL_QUORUM, rejectionThreshold: TEST_REJECTION_THRESHOLD }
    : { quorum: APPROVAL_QUORUM, rejectionThreshold: REJECTION_THRESHOLD };
}

export async function advanceAfterReview(applicationId: string, actorUserId: string) {
  const application = await prisma.membershipApplication.findUnique({
    where: { id: applicationId },
    include: {
      reviews: { include: { committeeMember: true } },
    },
  });
  if (!application) throw new Error('Application not found.');

  if (application.status === 'SPONSOR_REVIEW') {
    const sponsorReviews = application.reviews.filter((review) => review.phase === 'SPONSOR');
    const declined = sponsorReviews.find((review) => review.decision === 'REJECT');
    if (declined) {
      const reason = declined.comment || 'A required sponsor did not endorse the application.';
      const claim = await prisma.membershipApplication.updateMany({
        where: { id: application.id, status: 'SPONSOR_REVIEW' },
        data: {
          status: 'REJECTED',
          committeeResult: 'REJECTED',
          decidedAt: new Date(),
          rejectionReason: reason,
        },
      });
      if (claim.count !== 1) return { status: 'REJECTED' as const };
      await recordAudit({
        applicationId,
        actorUserId,
        event: 'SPONSOR_ENDORSEMENT_DECLINED',
        details: { reviewerId: declined.committeeMemberId },
      });
      await sendRejectionNotification({
        applicantEmail: application.contactEmail,
        contactName: application.contactName,
        applicationNo: application.applicationNo,
        organizationName: application.organizationName,
        reason: 'The required sponsor endorsements were not completed.',
      });
      return { status: 'REJECTED' as const };
    }

    if (sponsorReviews.length === 2 && sponsorReviews.every((review) => review.decision === 'APPROVE')) {
      const deadline = committeeReviewExpiryFromNow();
      const approvers = await prisma.committeeMember.findMany({
        where: { canApproveApplications: true, isTest: application.isTest },
      });
      const existingReviewerIds = new Set(sponsorReviews.map((review) => review.committeeMemberId));
      const remaining = approvers.filter((member) => !existingReviewerIds.has(member.id));

      const transitioned = await prisma.$transaction(async (tx) => {
        const claim = await tx.membershipApplication.updateMany({
          where: { id: applicationId, status: 'SPONSOR_REVIEW' },
          data: {
            status: 'COMMITTEE_REVIEW',
            committeeResult: 'PENDING',
            committeeReviewStartedAt: new Date(),
            committeeReviewDeadlineAt: deadline,
          },
        });
        if (claim.count !== 1) return false;
        await tx.applicationReview.createMany({
          data: remaining.map((member) => ({
            applicationId,
            committeeMemberId: member.id,
            phase: 'COMMITTEE',
            decision: 'PENDING',
            token: generateToken(),
            tokenExpiresAt: deadline,
          })),
          skipDuplicates: true,
        });
        return true;
      });
      if (!transitioned) return { status: 'COMMITTEE_REVIEW' as const };

      const allReviews = await prisma.applicationReview.findMany({
        where: { applicationId },
        include: { committeeMember: true },
      });
      const emailTasks = allReviews.map((review) => {
        if (review.phase === 'SPONSOR') {
          return sendCommitteeStageNotice({
            committeeMemberEmail: review.committeeMember.email,
            committeeMemberName: review.committeeMember.name,
            applicationNo: application.applicationNo,
            organizationName: application.organizationName,
            deadline,
          });
        }
        return sendReviewInvitation({
          committeeMemberEmail: review.committeeMember.email,
          committeeMemberName: review.committeeMember.name,
          applicationNo: application.applicationNo,
          organizationName: application.organizationName,
          tierLabel: MEMBERSHIP_TIERS[application.tier].label,
          contactName: application.contactName,
          reviewToken: review.token,
          phase: 'COMMITTEE',
          deadline,
        }).then((result) =>
          'success' in result && result.success
            ? prisma.applicationReview.update({ where: { id: review.id }, data: { emailSentAt: new Date() } })
            : undefined
        );
      });
      await Promise.allSettled(emailTasks);
      await recordAudit({
        applicationId,
        actorUserId,
        event: 'COMMITTEE_REVIEW_STARTED',
        details: { deadline: deadline.toISOString(), sponsorVotesCounted: 2 },
      });
      return { status: 'COMMITTEE_REVIEW' as const, deadline };
    }
    return { status: 'SPONSOR_REVIEW' as const };
  }

  if (application.status === 'COMMITTEE_REVIEW') {
    const { approvals, rejections } = await tallyReviews(applicationId);
    const thresholds = approvalThresholds(application.isTest);
    let result: 'APPROVED' | 'REJECTED' | null = null;
    if (approvals >= thresholds.quorum) result = 'APPROVED';
    else if (rejections >= thresholds.rejectionThreshold) result = 'REJECTED';
    if (!result) return { status: 'COMMITTEE_REVIEW' as const, approvals, rejections };

    const claimed = await prisma.membershipApplication.updateMany({
      where: { id: applicationId, status: 'COMMITTEE_REVIEW', committeeResult: 'PENDING' },
      data: { status: 'ADMIN_REVIEW', committeeResult: result },
    });
    if (claimed.count !== 1) return { status: 'ADMIN_REVIEW' as const, result, approvals, rejections };
    await recordAudit({
      applicationId,
      actorUserId,
      event: 'COMMITTEE_RESULT_REACHED',
      details: { result, approvals, rejections, quorum: thresholds.quorum, isTest: application.isTest },
    });
    await notifyAdmins(application.applicationNo, application.organizationName, result, approvals, rejections);
    return { status: 'ADMIN_REVIEW' as const, result, approvals, rejections };
  }

  return { status: application.status };
}

async function notifyAdmins(
  applicationNo: string,
  organizationName: string,
  result: 'APPROVED' | 'REJECTED' | 'NO_QUORUM',
  approvals: number,
  rejections: number
) {
  // The same approved Secretariat admin handles real and isolated test flows.
  // Test isolation applies to committee reviewers, not to the admin account.
  const admins = await prisma.portalUser.findMany({ where: { role: 'ADMIN', active: true } });
  await Promise.allSettled(
    admins.map((admin) =>
      sendAdminDecisionRequest({
        adminEmail: admin.email,
        adminName: admin.name,
        applicationNo,
        organizationName,
        result,
        approvals,
        rejections,
      })
    )
  );
}

export async function pauseExpiredCommitteeReviews() {
  const expired = await prisma.membershipApplication.findMany({
    where: { status: 'COMMITTEE_REVIEW', committeeReviewDeadlineAt: { lte: new Date() } },
  });
  let paused = 0;
  for (const application of expired) {
    const tally = await tallyReviews(application.id);
    const claimed = await prisma.membershipApplication.updateMany({
      where: { id: application.id, status: 'COMMITTEE_REVIEW' },
      data: { status: 'PAUSED_NO_QUORUM', committeeResult: 'NO_QUORUM' },
    });
    if (claimed.count !== 1) continue;
    paused += 1;
    await recordAudit({
      applicationId: application.id,
      event: 'COMMITTEE_REVIEW_PAUSED_NO_QUORUM',
      details: tally,
    });
    await notifyAdmins(
      application.applicationNo,
      application.organizationName,
      'NO_QUORUM',
      tally.approvals,
      tally.rejections
    );
  }
  return paused;
}

export async function extendCommitteeReview(applicationId: string, adminUserId: string) {
  const application = await prisma.membershipApplication.findUnique({ where: { id: applicationId } });
  if (!application || application.status !== 'PAUSED_NO_QUORUM') {
    throw new Error('Only a paused review can be extended.');
  }
  const deadline = committeeReviewExpiryFromNow();
  const [claim] = await prisma.$transaction([
    prisma.membershipApplication.updateMany({
      where: { id: applicationId, status: 'PAUSED_NO_QUORUM' },
      data: {
        status: 'COMMITTEE_REVIEW',
        committeeResult: 'PENDING',
        committeeReviewDeadlineAt: deadline,
      },
    }),
    prisma.applicationReview.updateMany({
      where: { applicationId, decision: 'PENDING' },
      data: { tokenExpiresAt: deadline },
    }),
  ]);
  if (claim.count !== 1) throw new Error('This review was already changed.');
  const pending = await prisma.applicationReview.findMany({
    where: { applicationId, decision: 'PENDING' },
    include: { committeeMember: true },
  });
  await Promise.allSettled(
    pending.map((review) =>
      sendReviewInvitation({
        committeeMemberEmail: review.committeeMember.email,
        committeeMemberName: review.committeeMember.name,
        applicationNo: application.applicationNo,
        organizationName: application.organizationName,
        tierLabel: MEMBERSHIP_TIERS[application.tier].label,
        contactName: application.contactName,
        reviewToken: review.token,
        phase: 'COMMITTEE',
        deadline,
      })
    )
  );
  await recordAudit({
    applicationId,
    actorUserId: adminUserId,
    event: 'COMMITTEE_REVIEW_EXTENDED',
    details: { deadline: deadline.toISOString() },
  });
  return deadline;
}

export async function extendSponsorReview(applicationId: string, adminUserId: string) {
  const application = await prisma.membershipApplication.findUnique({ where: { id: applicationId } });
  if (!application || application.status !== 'SPONSOR_REVIEW') {
    throw new Error('Only an open sponsor review can be extended.');
  }
  const deadline = reviewTokenExpiryFromNow();
  await prisma.$transaction([
    prisma.membershipApplication.update({ where: { id: applicationId }, data: { sponsorReviewDeadlineAt: deadline } }),
    prisma.applicationReview.updateMany({
      where: { applicationId, phase: 'SPONSOR', decision: 'PENDING' },
      data: { tokenExpiresAt: deadline },
    }),
  ]);
  const pending = await prisma.applicationReview.findMany({
    where: { applicationId, phase: 'SPONSOR', decision: 'PENDING' },
    include: { committeeMember: true },
  });
  await Promise.allSettled(pending.map((review) => sendReviewInvitation({
    committeeMemberEmail: review.committeeMember.email,
    committeeMemberName: review.committeeMember.name,
    applicationNo: application.applicationNo,
    organizationName: application.organizationName,
    tierLabel: MEMBERSHIP_TIERS[application.tier].label,
    contactName: application.contactName,
    reviewToken: review.token,
    phase: 'SPONSOR',
    deadline,
  })));
  await recordAudit({
    applicationId,
    actorUserId: adminUserId,
    event: 'SPONSOR_REVIEW_EXTENDED',
    details: { deadline: deadline.toISOString() },
  });
  return deadline;
}

export async function confirmCommitteeResult(
  applicationId: string,
  adminUserId: string,
  note?: string
) {
  const application = await prisma.membershipApplication.findUnique({ where: { id: applicationId } });
  if (!application || application.status !== 'ADMIN_REVIEW') {
    throw new Error('This application is not ready for admin confirmation.');
  }
  if (application.committeeResult !== 'APPROVED' && application.committeeResult !== 'REJECTED') {
    throw new Error('The committee has not reached a final result.');
  }

  const now = new Date();
  if (application.committeeResult === 'APPROVED') {
    const tier = MEMBERSHIP_TIERS[application.tier];
    const paymentToken = generateToken();
    const paymentExpiresAt = paymentExpiryFromNow();
    const claim = await prisma.membershipApplication.updateMany({
      where: { id: applicationId, status: 'ADMIN_REVIEW', committeeResult: 'APPROVED' },
      data: {
        status: 'PAYMENT_PENDING',
        decidedAt: now,
        adminConfirmedAt: now,
        adminConfirmedById: adminUserId,
        adminNote: note || null,
        paymentToken,
        paymentExpiresAt,
      },
    });
    if (claim.count !== 1) throw new Error('This result was already confirmed.');
    const delivery = await sendApprovalNotification({
      applicantEmail: application.contactEmail,
      contactName: application.contactName,
      applicationNo: application.applicationNo,
      organizationName: application.organizationName,
      amountRupees: tier.annualFeeRupees,
      paymentToken,
      paymentExpiresAt,
    });
    if ('success' in delivery && delivery.success) {
      await prisma.membershipApplication.update({ where: { id: applicationId }, data: { paymentLinkSentAt: new Date() } });
    }
  } else {
    const claim = await prisma.membershipApplication.updateMany({
      where: { id: applicationId, status: 'ADMIN_REVIEW', committeeResult: 'REJECTED' },
      data: {
        status: 'REJECTED',
        decidedAt: now,
        adminConfirmedAt: now,
        adminConfirmedById: adminUserId,
        adminNote: note || null,
        rejectionReason: note || 'The Managing Committee did not approve the application.',
      },
    });
    if (claim.count !== 1) throw new Error('This result was already confirmed.');
    await sendRejectionNotification({
      applicantEmail: application.contactEmail,
      contactName: application.contactName,
      applicationNo: application.applicationNo,
      organizationName: application.organizationName,
      reason: note,
    });
  }

  const committee = await prisma.committeeMember.findMany({ where: { isTest: application.isTest } });
  await Promise.allSettled(
    committee.map((member) =>
      sendCommitteeFinalNotice({
        committeeMemberEmail: member.email,
        committeeMemberName: member.name,
        applicationNo: application.applicationNo,
        organizationName: application.organizationName,
        result: application.committeeResult as 'APPROVED' | 'REJECTED',
      })
    )
  );
  await recordAudit({
    applicationId,
    actorUserId: adminUserId,
    event: 'ADMIN_CONFIRMED_COMMITTEE_RESULT',
    details: { result: application.committeeResult, note: note || null },
  });
  return application.committeeResult;
}
