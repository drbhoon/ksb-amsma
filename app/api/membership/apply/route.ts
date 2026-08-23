import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { MEMBERSHIP_TIERS } from '@/config/membership';
import {
  generateApplicationNo,
  reviewTokenExpiryFromNow,
} from '@/lib/membership';
import { generateToken } from '@/lib/tokens';
import { applicationSchema, toFieldErrors } from '@/lib/application-schema';
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

    // Proposer/Seconder must be existing committee members (Phase 1: only founders exist)
    const proposerLower = d.proposerEmail.toLowerCase().trim();
    const seconderLower = d.seconderEmail.toLowerCase().trim();
    const [proposer, seconder] = await Promise.all([
      prisma.committeeMember.findUnique({ where: { email: proposerLower } }),
      prisma.committeeMember.findUnique({ where: { email: seconderLower } }),
    ]);
    const missing: Record<string, string> = {};
    if (!proposer) {
      missing.proposerEmail = `"${d.proposerEmail}" is not a committee member. Use one of the committee email addresses listed above.`;
    }
    if (!seconder) {
      missing.seconderEmail = `"${d.seconderEmail}" is not a committee member. Use one of the committee email addresses listed above.`;
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
        status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'PAYMENT_PENDING', 'ACTIVE'] },
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
    const approvers = await prisma.committeeMember.findMany({
      where: { canApproveApplications: true },
    });

    const application = await prisma.$transaction(async (tx) => {
      const app = await tx.membershipApplication.create({
        data: {
          applicationNo,
          tier: d.tier,
          status: 'SUBMITTED',
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
          proposerName: d.proposerName,
          proposerEmail: proposerLower,
          seconderName: d.seconderName,
          seconderEmail: seconderLower,
          annualFeePaise: tier.annualFeePaise,
        },
      });

      // Create one review record per approver with unique magic-link token
      const tokenExpiry = reviewTokenExpiryFromNow();
      await tx.applicationReview.createMany({
        data: approvers.map((a) => ({
          applicationId: app.id,
          committeeMemberId: a.id,
          token: generateToken(),
          tokenExpiresAt: tokenExpiry,
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

    // Mark status transitioned + send emails (async, don't block response)
    await prisma.membershipApplication.update({
      where: { id: application.id },
      data: { status: 'UNDER_REVIEW' },
    });

    // Dispatch emails in background
    Promise.allSettled([
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
        }).then(() =>
          prisma.applicationReview.update({
            where: { id: r.id },
            data: { emailSentAt: new Date() },
          })
        )
      ),
    ]).catch((e) => console.error('[apply] background email dispatch failed', e));

    return NextResponse.json({
      success: true,
      applicationNo: application.applicationNo,
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
