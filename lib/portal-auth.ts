import crypto from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from './db';
import { generateToken } from './tokens';

const SESSION_COOKIE = 'amsma_portal_session';
const SESSION_HOURS = 12;

function tokenHash(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createPortalSession(userId: string): Promise<void> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
  await prisma.$transaction([
    prisma.portalSession.create({
      data: { userId, tokenHash: tokenHash(token), expiresAt },
    }),
    prisma.portalUser.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    }),
  ]);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export async function clearPortalSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.portalSession.deleteMany({ where: { tokenHash: tokenHash(token) } });
  }
  cookieStore.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', expires: new Date(0) });
}

export async function getCurrentPortalUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.portalSession.findUnique({
    where: { tokenHash: tokenHash(token) },
    include: { user: { include: { committeeMember: true } } },
  });
  if (!session || session.expiresAt <= new Date() || !session.user.active) {
    return null;
  }
  return session.user;
}

export function safePortalReturnPath(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/portal';
  return value;
}
