import { PrismaClient, CommitteeRole } from '@prisma/client';
import { COMMITTEE_MEMBERS } from '../config/committee-members';
import { generateToken } from '../lib/tokens';
import { sendReviewInvitation } from '../lib/email';

const prisma = new PrismaClient();

// Map friendly role labels to Prisma enum values
const roleMap: Record<string, CommitteeRole> = {
  'Founder Patron':    'FOUNDER_PATRON',
  'Founder President': 'FOUNDER_PRESIDENT',
  'First President':   'FIRST_PRESIDENT',
  'Vice President':    'VICE_PRESIDENT',
  'Secretary':         'SECRETARY',
  'Treasurer':         'TREASURER',
  'Founder Member':    'FOUNDER_MEMBER',
};

async function main() {
  console.log('🌱 Seeding committee members...\n');

  for (const m of COMMITTEE_MEMBERS) {
    const role = roleMap[m.role];
    // The apply route looks proposer/seconder up by lowercased email, so the
    // stored address must be lowercase or the lookup silently fails.
    const email = m.email.toLowerCase().trim();
    if (!role) {
      console.warn(`⚠  Unknown role "${m.role}" for ${m.name} — skipping`);
      continue;
    }

    const result = await prisma.committeeMember.upsert({
      where: { slug: m.slug },
      update: {
        name: m.name,
        email,
        role,
        title: m.title,
        canApproveApplications: m.canApproveApplications,
        isTest: false,
      },
      create: {
        slug: m.slug,
        name: m.name,
        email,
        role,
        title: m.title,
        canApproveApplications: m.canApproveApplications,
        isTest: false,
      },
    });

    console.log(`  ✓ ${result.name.padEnd(38)} <${result.email}>`);
  }

  const total = await prisma.committeeMember.count();
  const eligible = await prisma.committeeMember.count({
    where: { canApproveApplications: true },
  });

  console.log(`\n✓ Committee: ${total} members (${eligible} eligible to approve applications)`);
  console.log('✓ Interim quorum for approval: 5 approvals');

  console.log('\nCreating email sign-in portal allowlist...');
  for (const member of COMMITTEE_MEMBERS) {
    const committeeMember = await prisma.committeeMember.findUniqueOrThrow({ where: { slug: member.slug } });
    await prisma.portalUser.upsert({
      where: { committeeMemberId: committeeMember.id },
      update: { email: committeeMember.email, name: committeeMember.name, role: 'COMMITTEE', active: true, passwordHash: null },
      create: { email: committeeMember.email, name: committeeMember.name, role: 'COMMITTEE', committeeMemberId: committeeMember.id },
    });
    console.log(`  ✓ Committee login: ${committeeMember.email}`);
  }
  const adminEmail = (process.env.PORTAL_ADMIN_EMAIL || 'admin@amsma.in').toLowerCase().trim();
  const adminName = process.env.PORTAL_ADMIN_NAME || 'AMSMA Administrator';
  await prisma.portalUser.upsert({
    where: { email: adminEmail },
    update: { name: adminName, role: 'ADMIN', active: true, isTest: false },
    create: { email: adminEmail, name: adminName, role: 'ADMIN', isTest: false },
  });
  console.log(`  ✓ Admin login: ${adminEmail}`);

  const testAdminEmail = (process.env.PORTAL_TEST_ADMIN_EMAIL || '').toLowerCase().trim();
  const testReviewerEmails = (process.env.PORTAL_TEST_REVIEWER_EMAILS || '')
    .split(',')
    .map((value) => value.toLowerCase().trim())
    .filter(Boolean);
  if (testAdminEmail && testReviewerEmails.length === 2) {
    const testDefinitions = [
      { slug: 'test-proposer', name: 'Rachel Green', email: testReviewerEmails[0] },
      { slug: 'test-seconder', name: 'Chunsikali', email: testReviewerEmails[1] },
      { slug: 'test-committee-member', name: 'Esha Bhoon', email: testAdminEmail },
    ];
    const testMembers = [];
    for (const definition of testDefinitions) {
      testMembers.push(await prisma.committeeMember.upsert({
        where: { slug: definition.slug },
        update: {
          name: definition.name,
          email: definition.email,
          role: 'FOUNDER_MEMBER',
          title: 'Test account',
          canApproveApplications: true,
          isTest: true,
        },
        create: {
          ...definition,
          role: 'FOUNDER_MEMBER',
          title: 'Test account',
          canApproveApplications: true,
          isTest: true,
        },
      }));
    }

    await prisma.portalUser.upsert({
      where: { email: testAdminEmail },
      update: { name: testMembers[2].name, role: 'ADMIN', active: true, isTest: true, committeeMemberId: testMembers[2].id },
      create: { email: testAdminEmail, name: testMembers[2].name, role: 'ADMIN', active: true, isTest: true, committeeMemberId: testMembers[2].id },
    });
    for (const [index, email] of testReviewerEmails.entries()) {
      await prisma.portalUser.upsert({
        where: { email },
        update: { name: testDefinitions[index].name, role: 'COMMITTEE', active: true, isTest: true, committeeMemberId: testMembers[index].id },
        create: { email, name: testDefinitions[index].name, role: 'COMMITTEE', active: true, isTest: true, committeeMemberId: testMembers[index].id },
      });
    }
    console.log('  ✓ Test proposer, seconder, committee member and admin logins created');

    if (process.env.PORTAL_TEST_WORKFLOW_ENABLED === 'true') {
      const sponsorDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      let testApplication = await prisma.membershipApplication.findUnique({
        where: { applicationNo: 'TEST-AMSMA-2026-0001' },
      });
      if (!testApplication) {
        testApplication = await prisma.membershipApplication.create({
          data: {
            applicationNo: 'TEST-AMSMA-2026-0001',
            tier: 'ORDINARY_REGULAR',
            status: 'SPONSOR_REVIEW',
            isTest: true,
            organizationName: 'Test Aggregate Industries Pvt. Ltd.',
            contactName: 'Test Applicant',
            contactEmail: 'dummy-applicant@example.invalid',
            contactPhone: '9999999999',
            addressLine: 'Test address',
            city: 'Test City',
            state: 'Maharashtra',
            pincode: '400001',
            pan: 'AAAAA0000A',
            natureOfBusiness: 'Test membership workflow',
            signatoryName: 'Test Signatory',
            signatoryDesignation: 'Authorised Signatory',
            signatoryEmail: 'dummy-signatory@example.invalid',
            signatoryPhone: '9999999999',
            proposerName: testMembers[0].name,
            proposerEmail: testMembers[0].email,
            seconderName: testMembers[1].name,
            seconderEmail: testMembers[1].email,
            annualFeePaise: 2500000,
            sponsorReviewDeadlineAt: sponsorDeadline,
          },
        });
        await prisma.applicationReview.createMany({
          data: testMembers.slice(0, 2).map((member) => ({
            applicationId: testApplication!.id,
            committeeMemberId: member.id,
            token: generateToken(),
            tokenExpiresAt: sponsorDeadline,
            phase: 'SPONSOR',
            decision: 'PENDING',
          })),
        });
      } else {
        testApplication = await prisma.membershipApplication.update({
          where: { id: testApplication.id },
          data: {
            proposerName: testMembers[0].name,
            proposerEmail: testMembers[0].email,
            seconderName: testMembers[1].name,
            seconderEmail: testMembers[1].email,
          },
        });
      }

      const pendingNotices = await prisma.applicationReview.findMany({
        where: {
          applicationId: testApplication.id,
          phase: 'SPONSOR',
          decision: 'PENDING',
          emailSentAt: null,
        },
        include: { committeeMember: true },
      });
      for (const review of pendingNotices) {
        const result = await sendReviewInvitation({
          committeeMemberEmail: review.committeeMember.email,
          committeeMemberName: review.committeeMember.name,
          applicationNo: testApplication.applicationNo,
          organizationName: testApplication.organizationName,
          tierLabel: 'Ordinary Member',
          contactName: testApplication.contactName,
          reviewToken: review.token,
          phase: 'SPONSOR',
          deadline: review.tokenExpiresAt,
        });
        if ('success' in result && result.success) {
          await prisma.applicationReview.update({ where: { id: review.id }, data: { emailSentAt: new Date() } });
        }
      }
      console.log(`  ✓ Test application ready: ${testApplication.applicationNo}`);
    }
  } else if (testAdminEmail || testReviewerEmails.length > 0) {
    console.warn('  ⚠ Test workflow needs one admin email and exactly two reviewer emails.');
  }
  console.log('  Portal access uses one-time email codes for approved addresses only.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
