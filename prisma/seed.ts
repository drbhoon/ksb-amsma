import { PrismaClient, CommitteeRole } from '@prisma/client';
import { COMMITTEE_MEMBERS } from '../config/committee-members';
import { hashPassword } from '../lib/passwords';

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
      },
      create: {
        slug: m.slug,
        name: m.name,
        email,
        role,
        title: m.title,
        canApproveApplications: m.canApproveApplications,
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

  const testAuth = process.env.PORTAL_TEST_AUTH === 'true';
  const seedPassword = process.env.PORTAL_SEED_PASSWORD;
  if (testAuth && (!seedPassword || seedPassword.length < 12)) {
    throw new Error('PORTAL_TEST_AUTH requires PORTAL_SEED_PASSWORD with at least 12 characters.');
  }
  const passwordHash = testAuth && seedPassword ? await hashPassword(seedPassword) : null;
  console.log('\nCreating Google OAuth portal allowlist...');
  for (const member of COMMITTEE_MEMBERS) {
    const committeeMember = await prisma.committeeMember.findUniqueOrThrow({ where: { slug: member.slug } });
    await prisma.portalUser.upsert({
      where: { committeeMemberId: committeeMember.id },
      update: { email: committeeMember.email, name: committeeMember.name, role: 'COMMITTEE', active: true, ...(passwordHash ? { passwordHash } : {}) },
      create: { email: committeeMember.email, name: committeeMember.name, role: 'COMMITTEE', committeeMemberId: committeeMember.id, passwordHash },
    });
    console.log(`  ✓ Committee login: ${committeeMember.email}`);
  }
  const adminEmail = (process.env.PORTAL_ADMIN_EMAIL || 'admin@amsma.in').toLowerCase().trim();
  const adminName = process.env.PORTAL_ADMIN_NAME || 'AMSMA Administrator';
  await prisma.portalUser.upsert({
    where: { email: adminEmail },
    update: { name: adminName, role: 'ADMIN', active: true },
    create: { email: adminEmail, name: adminName, role: 'ADMIN', passwordHash },
  });
  console.log(`  ✓ Admin login: ${adminEmail}`);
  console.log(testAuth ? '  Test-only password access is enabled.' : '  Portal access uses approved Google accounts only.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
