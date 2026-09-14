import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentPortalUser } from '@/lib/portal-auth';
import { confirmCommitteeResult, extendCommitteeReview, extendSponsorReview } from '@/lib/approval-workflow';
import { prisma } from '@/lib/db';

const schema = z.object({ action: z.enum(['CONFIRM', 'EXTEND', 'EXTEND_SPONSOR']), note: z.string().max(500).optional() });
type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const user = await getCurrentPortalUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access is required.' }, { status: 403 });
    const application = await prisma.membershipApplication.findUnique({ where: { id }, select: { isTest: true } });
    if (!application) {
      return NextResponse.json({ error: 'This account cannot access this application.' }, { status: 403 });
    }
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'The requested action is not valid.' }, { status: 400 });
    if (parsed.data.action === 'EXTEND') {
      const deadline = await extendCommitteeReview(id, user.id);
      return NextResponse.json({ success: true, deadline });
    }
    if (parsed.data.action === 'EXTEND_SPONSOR') {
      const deadline = await extendSponsorReview(id, user.id);
      return NextResponse.json({ success: true, deadline });
    }
    const result = await confirmCommitteeResult(id, user.id, parsed.data.note);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'The action failed.' }, { status: 409 });
  }
}
