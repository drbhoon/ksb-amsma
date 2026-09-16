import { PrismaClient, CommitteeRole } from '@prisma/client';
import { COMMITTEE_MEMBERS } from '../config/committee-members';
import { generateToken } from '../lib/tokens';
import { sendReviewInvitation } from '../lib/email';
import { FORUM_TEST_EMAIL } from '../config/forum';

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

// These application numbers belong to earlier manual test rounds. They are
// listed explicitly so a one-time reset cannot remove a future real record by
// using a broad text rule.
const LEGACY_TEST_APPLICATION_NOS = [
  'AMSMA-2026-0001',
  'AMSMA-2026-0002',
  'AMSMA-2026-0003',
  'TEST-AMSMA-2026-0001',
];

async function resetPreviousTestDataOnce() {
  const resetId = (process.env.PORTAL_TEST_RESET_ID || '').trim();
  if (!resetId || process.env.PORTAL_TEST_WORKFLOW_ENABLED !== 'true') return;

  const resetEvent = `TEST_DATA_RESET:${resetId}`;
  const alreadyReset = await prisma.auditEvent.findFirst({ where: { event: resetEvent }, select: { id: true } });
  if (alreadyReset) {
    console.log(`✓ Test reset ${resetId} was already applied.`);
    return;
  }

  const applications = await prisma.membershipApplication.findMany({
    where: {
      OR: [
        { isTest: true },
        { applicationNo: { in: LEGACY_TEST_APPLICATION_NOS } },
      ],
    },
    select: { id: true, applicationNo: true },
  });
  const applicationIds = applications.map((application) => application.id);
  const testUsers = await prisma.portalUser.findMany({ where: { isTest: true }, select: { id: true } });
  const testUserIds = testUsers.map((user) => user.id);

  await prisma.$transaction([
    // The forum test topics and their posts must go before test users.
    prisma.forumTopic.deleteMany({ where: { isTest: true } }),
    prisma.member.deleteMany({ where: { applicationId: { in: applicationIds } } }),
    prisma.auditEvent.deleteMany({
      where: {
        OR: [
          { applicationId: { in: applicationIds } },
          { actorUserId: { in: testUserIds } },
        ],
      },
    }),
    // Application reviews are removed by the MembershipApplication cascade.
    prisma.membershipApplication.deleteMany({ where: { id: { in: applicationIds } } }),
    // Login challenges and sessions are removed by the PortalUser cascade.
    prisma.portalUser.deleteMany({ where: { id: { in: testUserIds } } }),
    prisma.committeeMember.deleteMany({ where: { isTest: true } }),
  ]);

  await prisma.auditEvent.create({
    data: {
      event: resetEvent,
      details: { removedApplications: applications.map((application) => application.applicationNo) },
    },
  });
  console.log(`✓ Removed ${applications.length} previous test applications and all linked test access data.`);
}

async function main() {
  await resetPreviousTestDataOnce();
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

  const total = await prisma.committeeMember.count({ where: { isTest: false } });
  const eligible = await prisma.committeeMember.count({
    where: { canApproveApplications: true, isTest: false },
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
  await prisma.portalUser.updateMany({
    where: { role: 'ADMIN', email: { not: adminEmail } },
    data: { active: false },
  });
  await prisma.portalUser.upsert({
    where: { email: adminEmail },
    update: { name: adminName, role: 'ADMIN', active: true, isTest: false },
    create: { email: adminEmail, name: adminName, role: 'ADMIN', isTest: false },
  });
  console.log(`  ✓ Admin login: ${adminEmail}`);

  const testReviewerEmails = (process.env.PORTAL_TEST_REVIEWER_EMAILS || '')
    .split(',')
    .map((value) => value.toLowerCase().trim())
    .filter(Boolean);
  if (testReviewerEmails.length === 3) {
    const testDefinitions = [
      { slug: 'test-proposer', name: 'Esha Bhoon', email: testReviewerEmails[0] },
      { slug: 'test-seconder', name: 'K. S. Bhoon', email: testReviewerEmails[1] },
      { slug: 'test-committee-member', name: 'Chunsikali', email: testReviewerEmails[2] },
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

    for (const [index, email] of testReviewerEmails.entries()) {
      await prisma.portalUser.upsert({
        where: { email },
        update: { name: testDefinitions[index].name, role: 'COMMITTEE', active: true, isTest: true, committeeMemberId: testMembers[index].id },
        create: { email, name: testDefinitions[index].name, role: 'COMMITTEE', active: true, isTest: true, committeeMemberId: testMembers[index].id },
      });
    }
    console.log('  ✓ Three isolated test committee logins created');

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
      // Deployment and routine seeding must never send review mail by accident.
      // Forum rollout does not send any mail to existing members.
      for (const review of process.env.PORTAL_TEST_SEND_REVIEW_EMAILS === 'true' ? pendingNotices : []) {
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
  } else if (testReviewerEmails.length > 0) {
    console.warn('  ⚠ Test workflow needs exactly three reviewer email addresses.');
  }
  // Only add the requested test address. Do not alter a real account with it.
  const forumTestUser = await prisma.portalUser.findUnique({ where: { email: FORUM_TEST_EMAIL } });
  if (!forumTestUser) {
    await prisma.portalUser.create({
      data: { email: FORUM_TEST_EMAIL, name: 'Forum Test', role: 'MEMBER', isTest: true },
    });
    console.log('  ✓ Isolated forum test login ready');
  } else if (!forumTestUser.isTest) {
    console.warn('  ⚠ Forum test email belongs to a live account; it was not changed.');
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
