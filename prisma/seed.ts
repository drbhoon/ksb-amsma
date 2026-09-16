import { PrismaClient, CommitteeRole } from '@prisma/client';
import { COMMITTEE_MEMBERS } from '../config/committee-members';

const prisma = new PrismaClient();

const roleMap: Record<string, CommitteeRole> = {
  'Founder Patron': 'FOUNDER_PATRON',
  'Founder President': 'FOUNDER_PRESIDENT',
  'First President': 'FIRST_PRESIDENT',
  'Vice President': 'VICE_PRESIDENT',
  'Secretary': 'SECRETARY',
  'Treasurer': 'TREASURER',
  'Founder Member': 'FOUNDER_MEMBER',
};

async function main() {
  console.log('🌱 Seeding committee members...');
  for (const member of COMMITTEE_MEMBERS) {
    const role = roleMap[member.role];
    if (!role) throw new Error(`Unknown committee role: ${member.role}`);
    const email = member.email.toLowerCase().trim();
    const committeeMember = await prisma.committeeMember.upsert({
      where: { slug: member.slug },
      update: {
        name: member.name, email, role, title: member.title,
        canApproveApplications: member.canApproveApplications, isTest: false,
      },
      create: {
        slug: member.slug, name: member.name, email, role, title: member.title,
        canApproveApplications: member.canApproveApplications, isTest: false,
      },
    });
    await prisma.portalUser.upsert({
      where: { committeeMemberId: committeeMember.id },
      update: { email, name: member.name, role: 'COMMITTEE', active: true, passwordHash: null },
      create: { email, name: member.name, role: 'COMMITTEE', committeeMemberId: committeeMember.id },
    });
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

  console.log('✓ Committee and admin access ready. No test accounts or emails were created.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
