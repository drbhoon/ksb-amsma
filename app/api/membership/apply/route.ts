import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { MEMBERSHIP_TIERS } from '@/config/membership';
import {
  generateApplicationNo,
  reviewTokenExpiryFromNow,
} from '@/lib/membership';
import { generateToken } from '@/lib/tokens';
import { applicationSchema, toFieldErrors } from '@/lib/application-schema';
import { recordAudit } from '@/lib/audit';
import {
  sendReviewInvitation,
  sendApplicationConfirmation,
} from '@/lib/email';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = applicationSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = toFieldErrors(parsed.error);
      const count = Object.keys(fieldErrors).length;
      return NextResponse.json(
        {
          error:
            count === 1
              ? Object.values(fieldErrors)[0]
              : `Please correct ${count} fields before submitting.`,
          fieldErrors,
        },
        { status: 400 }
      );
    }
    const d = parsed.data;
    const tier = MEMBERSHIP_TIERS[d.tier];

    // --- Business validation ---
    // Capacity thresholds and tier/capacity agreement are enforced by
    // applicationSchema, so by here they are known good. Only the parsed
    // integer is still needed for persistence.
    const capacityInt = tier.requiresCrushingCapacity
      ? parseInt(String(d.crushingCapacityMtMonth || ''), 10)
      : null;

    // Proposer and seconder must be different, active committee approvers because
    // their endorsements are recorded through the access-controlled portal.
    const [proposer, seconder] = await Promise.all([
      prisma.committeeMember.findUnique({ where: { slug: d.proposerSlug }, include: { portalUser: true } }),
      prisma.committeeMember.findUnique({ where: { slug: d.seconderSlug }, include: { portalUser: true } }),
    ]);
    const missing: Record<string, string> = {};
    if (!proposer?.canApproveApplications || !proposer.portalUser?.active) {
      missing.proposerSlug = 'Select the proposer again from the committee-member dropdown.';
    }
    if (!seconder?.canApproveApplications || !seconder.portalUser?.active) {
      missing.seconderSlug = 'Select the seconder again from the committee-member dropdown.';
    }
    if (d.proposerSlug === d.seconderSlug) {
      missing.seconderSlug = 'The proposer and seconder must be different committee members.';
    }
    if (Object.keys(missing).length) {
      return NextResponse.json(
        {
          error:
            Object.keys(missing).length === 1
              ? Object.values(missing)[0]
              : 'Neither the proposer nor the seconder is a recognised committee member.',
          fieldErrors: missing,
        },
        { status: 400 }
      );
    }

    // Prevent duplicate active applications by contact email
    const existing = await prisma.membershipApplication.findFirst({
      where: {
        contactEmail: d.contactEmail.toLowerCase().trim(),
        status: { in: ['SUBMITTED', 'SPONSOR_REVIEW', 'COMMITTEE_REVIEW', 'PAUSED_NO_QUORUM', 'ADMIN_REVIEW', 'UNDER_REVIEW', 'PAYMENT_PENDING', 'ACTIVE'] },
      },
    });
    if (existing) {
      return NextResponse.json(
        {
          error: `An application (${existing.applicationNo}) with this contact email is already in progress.`,
          fieldErrors: {
            contactEmail: `Already used by application ${existing.applicationNo}. Use a different contact email, or contact the Secretariat about the existing application.`,
          },
        },
        { status: 409 }
      );
    }

    // --- Create application + review invites in a single transaction ---
    const applicationNo = await generateApplicationNo();
    if (!proposer || !seconder) {
      return NextResponse.json({ error: 'The selected sponsors are not available.' }, { status: 400 });
    }

    const application = await prisma.$transaction(async (tx) => {
      const app = await tx.membershipApplication.create({
        data: {
          applicationNo,
          tier: d.tier,
          status: 'SPONSOR_REVIEW',
          organizationName: d.organizationName,
          contactName: d.contactName,
          contactEmail: d.contactEmail.toLowerCase().trim(),
          contactPhone: d.contactPhone,
          addressLine: d.addressLine,
          city: d.city,
          state: d.state,
          pincode: d.pincode,
          pan: d.pan.toUpperCase(),
          gstNumber: d.gstNumber || null,
          crushingCapacityMtMonth: capacityInt,
          natureOfBusiness: d.natureOfBusiness || null,
          signatoryName: d.signatoryName,
          signatoryDesignation: d.signatoryDesignation,
          signatoryEmail: d.signatoryEmail.toLowerCase().trim(),
          signatoryPhone: d.signatoryPhone,
          companyProofUrl: d.companyProofUrl,
          companyProofType: d.companyProofType,
          proposerName: proposer.name,
          proposerEmail: proposer.email,
          seconderName: seconder.name,
          seconderEmail: seconder.email,
          annualFeePaise: tier.annualFeePaise,
          sponsorReviewDeadlineAt: reviewTokenExpiryFromNow(),
        },
      });

      // Only the proposer and seconder review at this stage. Their endorsements
      // also count toward the later five-of-eight committee quorum.
      const tokenExpiry = reviewTokenExpiryFromNow();
      await tx.applicationReview.createMany({
        data: [proposer, seconder].map((a) => ({
          applicationId: app.id,
          committeeMemberId: a.id,
          token: generateToken(),
          tokenExpiresAt: tokenExpiry,
          phase: 'SPONSOR',
          decision: 'PENDING',
        })),
      });

      return app;
    });

    // Fetch reviews with the tokens we just created, alongside committee member data
    const reviews = await prisma.applicationReview.findMany({
      where: { applicationId: application.id },
      include: { committeeMember: true },
    });

    await recordAudit({
      applicationId: application.id,
      event: 'APPLICATION_SUBMITTED',
      details: { proposerId: proposer.id, seconderId: seconder.id },
    });

    // Wait for the delivery attempts. Serverless work can stop after the response.
    await Promise.allSettled([
      // Confirmation to applicant
      sendApplicationConfirmation({
        applicantEmail: application.contactEmail,
        contactName: application.contactName,
        applicationNo: application.applicationNo,
        organizationName: application.organizationName,
        tierLabel: tier.label,
      }),
      // One review invite per committee member
      ...reviews.map((r) =>
        sendReviewInvitation({
          committeeMemberEmail: r.committeeMember.email,
          committeeMemberName: r.committeeMember.name,
          applicationNo: application.applicationNo,
          organizationName: application.organizationName,
          tierLabel: tier.label,
          contactName: application.contactName,
          reviewToken: r.token,
          phase: 'SPONSOR',
          deadline: r.tokenExpiresAt,
        }).then((result) =>
          'success' in result && result.success
            ? prisma.applicationReview.update({ where: { id: r.id }, data: { emailSentAt: new Date() } })
            : undefined
        )
      ),
    ]);

    return NextResponse.json({
      success: true,
      applicationNo: application.applicationNo,
      sponsorsAssigned: reviews.length,
      reviewersNotified: reviews.length,
    });
  } catch (err) {
    console.error('[membership/apply]', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again or contact secretary@amsma.in.' },
      { status: 500 }
    );
  }
}
