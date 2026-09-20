'use server';

import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentPortalUser } from '@/lib/portal-auth';
import { prisma } from '@/lib/db';
import { generateMemberNo } from '@/lib/membership';

export type MemberActionState = { error?: string; ok?: string };

const memberSchema = z.object({
  organizationName: z.string().trim().min(2).max(180), contactName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(254), phone: z.string().trim().min(7).max(30),
  tier: z.enum(['ORDINARY_LARGE', 'ORDINARY_REGULAR', 'ASSOCIATE', 'INSTITUTIONAL']),
  address: z.string().trim().min(5).max(300), city: z.string().trim().min(2).max(100), state: z.string().trim().min(2).max(100),
  pan: z.string().trim().toUpperCase().min(5).max(20), gstNumber: z.string().trim().toUpperCase().max(30).optional(),
  crushingCapacityMtMonth: z.coerce.number().int().positive().optional(), admittedAt: z.coerce.date(), expiresAt: z.coerce.date(),
});

async function requireAdmin() {
  const user = await getCurrentPortalUser();
  if (!user || user.role !== 'ADMIN' || user.isTest) throw new Error('Admin access is required.');
  return user;
}

export async function addMember(_previous: MemberActionState, formData: FormData): Promise<MemberActionState> {
  const admin = await requireAdmin();
  const rawCapacity = String(formData.get('crushingCapacityMtMonth') || '').trim();
  const parsed = memberSchema.safeParse({
    organizationName: formData.get('organizationName'), contactName: formData.get('contactName'), email: formData.get('email'),
    phone: formData.get('phone'), tier: formData.get('tier'), address: formData.get('address'), city: formData.get('city'),
    state: formData.get('state'), pan: formData.get('pan'), gstNumber: String(formData.get('gstNumber') || '').trim() || undefined,
    crushingCapacityMtMonth: rawCapacity || undefined, admittedAt: formData.get('admittedAt'), expiresAt: formData.get('expiresAt'),
  });
  if (!parsed.success) return { error: 'Check all required details and enter valid dates, email, and contact information.' };
  const data = parsed.data;
  if (data.expiresAt <= data.admittedAt) return { error: 'The expiry date must be after the admission date.' };
  if (data.tier.startsWith('ORDINARY') && !data.crushingCapacityMtMonth) return { error: 'Enter crushing capacity for an Ordinary Member.' };

  const existing = await prisma.member.findUnique({ where: { email: data.email } });
  if (existing && existing.status !== 'TERMINATED') return { error: 'An approved member already uses this email address.' };
  const common = {
    tier: data.tier, organizationName: data.organizationName, contactName: data.contactName, email: data.email,
    phone: data.phone, address: data.address, city: data.city, state: data.state, pan: data.pan,
    gstNumber: data.gstNumber || null, crushingCapacityMtMonth: data.crushingCapacityMtMonth || null,
    admittedAt: data.admittedAt, expiresAt: data.expiresAt, status: 'ACTIVE' as const,
  };

  let memberNo: string;
  if (existing) {
    memberNo = existing.memberNo;
    await prisma.$transaction([
      prisma.member.update({ where: { id: existing.id }, data: common }),
      prisma.portalUser.updateMany({ where: { memberId: existing.id, role: 'MEMBER' }, data: { active: true, name: data.contactName } }),
      prisma.auditEvent.create({ data: { actorUserId: admin.id, event: 'MEMBER_RESTORED_BY_ADMIN', details: { memberNo, organizationName: data.organizationName } } }),
    ]);
  } else {
    memberNo = await generateMemberNo();
    await prisma.$transaction([
      prisma.member.create({ data: { ...common, memberNo, applicationId: `manual:${crypto.randomUUID()}` } }),
      prisma.auditEvent.create({ data: { actorUserId: admin.id, event: 'MEMBER_ADDED_BY_ADMIN', details: { memberNo, organizationName: data.organizationName } } }),
    ]);
  }
  revalidatePath('/portal/admin/members');
  return { ok: `${data.organizationName} was added as ${memberNo}.` };
}

export async function deleteMember(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get('id') || '');
  const member = await prisma.member.findUnique({ where: { id }, select: { memberNo: true, organizationName: true } });
  if (!member) return;
  await prisma.$transaction([
    prisma.portalUser.updateMany({ where: { memberId: id, role: 'MEMBER' }, data: { active: false, memberId: null } }),
    prisma.member.update({ where: { id }, data: { status: 'TERMINATED', expiresAt: new Date() } }),
    prisma.auditEvent.create({ data: { actorUserId: admin.id, event: 'MEMBER_REMOVED_BY_ADMIN', details: { memberNo: member.memberNo, organizationName: member.organizationName } } }),
  ]);
  revalidatePath('/portal/admin/members');
}
