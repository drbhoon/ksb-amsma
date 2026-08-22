import { PrismaClient, CommitteeRole } from '@prisma/client';
import { COMMITTEE_MEMBERS } from '../config/committee-members';

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
    if (!role) {
      console.warn(`⚠  Unknown role "${m.role}" for ${m.name} — skipping`);
      continue;
    }

    const result = await prisma.committeeMember.upsert({
      where: { email: m.email },
      update: {
        name: m.name,
        slug: m.slug,
        role,
        title: m.title,
        canApproveApplications: m.canApproveApplications,
      },
      create: {
        slug: m.slug,
        name: m.name,
        email: m.email,
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
  console.log(`✓ Quorum for approval: ${Math.ceil((eligible * 2) / 3)} approvals`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
