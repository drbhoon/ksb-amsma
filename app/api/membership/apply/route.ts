import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { MEMBERSHIP_TIERS } from '@/config/membership';
import {
  generateApplicationNo,
  reviewTokenExpiryFromNow,
} from '@/lib/membership';
import { generateToken } from '@/lib/tokens';
import {
  sendReviewInvitation,
  sendApplicationConfirmation,
} from '@/lib/email';

const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

const schema = z.object({
  tier: z.enum(['ORDINARY_LARGE', 'ORDINARY_REGULAR', 'ASSOCIATE', 'INSTITUTIONAL']),
  organizationName: z.string().min(2).max(200),
  contactName: z.string().min(2).max(120),
  contactEmail: z.string().email().max(200),
  contactPhone: z.string().min(6).max(20),
  addressLine: z.string().min(5).max(400),
  city: z.string().min(2).max(80),
  state: z.string().min(2).max(80),
  pincode: z.string().regex(/^[0-9]{6}$/, 'PIN must be 6 digits'),
  pan: z.string().regex(panRegex, 'Invalid PAN format'),
  gstNumber: z.string().max(15).optional().or(z.literal('')),
  crushingCapacityMtMonth: z.string().optional().or(z.literal('')),
  natureOfBusiness: z.string().max(200).optional().or(z.literal('')),
  signatoryName: z.string().min(2).max(120),
  signatoryDesignation: z.string().min(2).max(120),
  signatoryEmail: z.string().email().max(200),
  signatoryPhone: z.string().min(6).max(20),
  companyProofUrl: z.string().url('Must be a valid URL').max(500),
  companyProofType: z.enum(['incorporation', 'gst_cert', 'partnership_deed']),
  proposerName: z.string().min(2).max(120),
  proposerEmail: z.string().email().max(200),
  seconderName: z.string().min(2).max(120),
  seconderEmail: z.string().email().max(200),
  agreeRules: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the Rules & Regulations' }),
  }),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }
    const d = parsed.data;
    const tier = MEMBERSHIP_TIERS[d.tier];

    // --- Business validation ---

    // Ordinary tiers require crushing capacity
    let capacityInt: number | null = null;
    if (tier.requiresCrushingCapacity) {
      capacityInt = parseInt(d.crushingCapacityMtMonth || '', 10);
      if (Number.isNaN(capacityInt) || capacityInt < 50_000) {
        return NextResponse.json(
          { error: 'Ordinary Members require a minimum crushing capacity of 50,000 MT/month' },
          { status: 400 }
        );
      }
      // Auto-adjust tier based on capacity threshold
      const chosenTier =
        capacityInt >= 100_000 ? MEMBERSHIP_TIERS.ORDINARY_LARGE : MEMBERSHIP_TIERS.ORDINARY_REGULAR;
      if (chosenTier.id !== d.tier) {
        return NextResponse.json(
          {
            error: `Capacity of ${capacityInt.toLocaleString('en-IN')} MT/month qualifies for "${chosenTier.label}". Please select the correct category.`,
          },
          { status: 400 }
        );
      }
    }

    // Proposer/Seconder must be existing committee members (Phase 1: only founders exist)
    const proposerLower = d.proposerEmail.toLowerCase().trim();
    const seconderLower = d.seconderEmail.toLowerCase().trim();
    if (proposerLower === seconderLower) {
      return NextResponse.json(
        { error: 'Proposer and Seconder must be different persons' },
        { status: 400 }
      );
    }
    const [proposer, seconder] = await Promise.all([
      prisma.committeeMember.findUnique({ where: { email: proposerLower } }),
      prisma.committeeMember.findUnique({ where: { email: seconderLower } }),
    ]);
    if (!proposer) {
      return NextResponse.json(
        { error: `Proposer email "${d.proposerEmail}" is not a recognised committee member.` },
        { status: 400 }
      );
    }
    if (!seconder) {
      return NextResponse.json(
        { error: `Seconder email "${d.seconderEmail}" is not a recognised committee member.` },
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
        { error: `An application (${existing.applicationNo}) with this contact email is already in progress.` },
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
