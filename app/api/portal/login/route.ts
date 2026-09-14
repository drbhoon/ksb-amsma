import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { createPortalSession, safePortalReturnPath } from '@/lib/portal-auth';
import { verifyPassword } from '@/lib/passwords';
import { recordAudit } from '@/lib/audit';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
  next: z.string().optional(),
});

export async function POST(request: Request) {
  if (process.env.PORTAL_TEST_AUTH !== 'true') {
    return NextResponse.json({ error: 'Password test login is disabled.' }, { status: 404 });
  }
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Enter a valid email address and password.' }, { status: 400 });
  }
  const user = await prisma.portalUser.findUnique({
    where: { email: parsed.data.email.toLowerCase().trim() },
  });
  if (!user || !user.active || !user.passwordHash || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return NextResponse.json({ error: 'The email address or password is incorrect.' }, { status: 401 });
  }
  await createPortalSession(user.id);
  await recordAudit({ actorUserId: user.id, event: 'PORTAL_LOGIN' });
  const fallback = user.role === 'ADMIN' ? '/admin' : '/portal';
  const next = parsed.data.next ? safePortalReturnPath(parsed.data.next) : fallback;
  return NextResponse.json({ success: true, next, role: user.role });
}
