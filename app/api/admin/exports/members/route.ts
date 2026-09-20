import { NextResponse } from 'next/server';
import { getCurrentPortalUser } from '@/lib/portal-auth';
import { prisma } from '@/lib/db';

function csvCell(value: unknown): string {
  let text = value == null ? '' : value instanceof Date ? value.toISOString() : String(value);
  // Stop spreadsheet software from treating stored text as a formula.
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function csv(rows: unknown[][]): string {
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
}

export async function GET(request: Request) {
  const user = await getCurrentPortalUser();
  if (!user || user.role !== 'ADMIN' || user.isTest) {
    return NextResponse.json({ error: 'Admin access is required.' }, { status: 403 });
  }

  const list = new URL(request.url).searchParams.get('list');
  const today = new Date().toISOString().slice(0, 10);
  let body: string;
  let filename: string;

  if (list === 'committee') {
    const committee = await prisma.committeeMember.findMany({
      where: { isTest: false },
      orderBy: { createdAt: 'asc' },
      include: { portalUser: { select: { active: true, lastLoginAt: true } } },
    });
    body = csv([
      ['Name', 'Role', 'Professional title', 'Email', 'Can approve applications', 'Portal access', 'Last sign-in'],
      ...committee.map((member) => [member.name, member.role, member.title, member.email, member.canApproveApplications ? 'Yes' : 'No', member.portalUser?.active ? 'Active' : 'Inactive', member.portalUser?.lastLoginAt]),
    ]);
    filename = `amsma-committee-${today}.csv`;
  } else if (list === 'members') {
    const members = await prisma.member.findMany({ orderBy: [{ status: 'asc' }, { organizationName: 'asc' }] });
    body = csv([
      ['Member number', 'Organisation', 'Contact name', 'Email', 'Phone', 'Category', 'Address', 'City', 'State', 'PAN', 'GST number', 'Crushing capacity MT/month', 'Admitted at', 'Expires at', 'Status'],
      ...members.map((member) => [member.memberNo, member.organizationName, member.contactName, member.email, member.phone, member.tier, member.address, member.city, member.state, member.pan, member.gstNumber, member.crushingCapacityMtMonth, member.admittedAt, member.expiresAt, member.status]),
    ]);
    filename = `amsma-approved-members-${today}.csv`;
  } else {
    return NextResponse.json({ error: 'Choose a valid export list.' }, { status: 400 });
  }

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
