import crypto from 'crypto';
import { prisma } from './db';
import { generateToken } from './tokens';
import { safePortalReturnPath } from './portal-auth';

const CHALLENGE_MINUTES = 15;
const MAX_REQUESTS_PER_WINDOW = 5;
const MAX_CODE_ATTEMPTS = 5;

function loginSecret(): string {
  const secret = process.env.PORTAL_LOGIN_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV !== 'production') return 'amsma-local-development-only';
  throw new Error('PORTAL_LOGIN_SECRET is required in production.');
}

function digest(value: string): string {
  return crypto.createHmac('sha256', loginSecret()).update(value).digest('hex');
}

function secureEqual(left: string, right: string): boolean {
  const a = Buffer.from(left, 'hex');
  const b = Buffer.from(right, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function normalizePortalEmail(value: string): string {
  return value.toLowerCase().trim();
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return 'your approved email address';
  return `${local.slice(0, 1)}***@${domain}`;
}

async function createChallengeForUser(
  user: { id: string; email: string; name: string; role: 'ADMIN' | 'COMMITTEE'; isTest: boolean; active: boolean },
  nextValue: string | undefined
) {
  if (!user.active) return null;
  const email = normalizePortalEmail(user.email);

  const windowStart = new Date(Date.now() - CHALLENGE_MINUTES * 60 * 1000);
  const recentRequests = await prisma.portalLoginChallenge.count({
    where: { email, createdAt: { gte: windowStart } },
  });
  if (recentRequests >= MAX_REQUESTS_PER_WINDOW) return null;

  const code = String(crypto.randomInt(100000, 1000000));
  const token = generateToken();
  const expiresAt = new Date(Date.now() + CHALLENGE_MINUTES * 60 * 1000);
  const returnPath = safePortalReturnPath(nextValue);

  await prisma.$transaction([
    prisma.portalLoginChallenge.updateMany({
      where: { userId: user.id, consumedAt: null },
      data: { consumedAt: new Date() },
    }),
    prisma.portalLoginChallenge.create({
      data: {
        userId: user.id,
        email,
        codeHash: digest(code),
        tokenHash: digest(token),
        returnPath,
        expiresAt,
      },
    }),
  ]);

  return { user, code, token, expiresAt };
}

export async function createPortalLoginChallenge(
  emailValue: string,
  nextValue: string | undefined,
  requiredRole: 'ADMIN' | 'COMMITTEE'
) {
  const email = normalizePortalEmail(emailValue);
  const user = await prisma.portalUser.findUnique({ where: { email } });
  if (!user?.active || user.role !== requiredRole) return null;

  return createChallengeForUser(user, nextValue);
}

export async function getReviewLoginIdentity(
  nextValue: string | undefined,
  requiredRole: 'ADMIN' | 'COMMITTEE'
) {
  const returnPath = safePortalReturnPath(nextValue);
  const match = returnPath.match(/^\/review\/([A-Za-z0-9_-]+)$/);
  if (!match) return null;

  const review = await prisma.applicationReview.findUnique({
    where: { token: match[1] },
    include: { committeeMember: { include: { portalUser: true } } },
  });
  if (!review) return null;
  const user = review.committeeMember.portalUser;
  if (!user?.active || user.role !== requiredRole) return null;

  return {
    reviewToken: match[1],
    reviewerName: review.committeeMember.name,
    maskedEmail: maskEmail(user.email),
  };
}

export async function createPortalLoginChallengeForReview(
  reviewToken: string,
  requiredRole: 'ADMIN' | 'COMMITTEE'
) {
  const identity = await getReviewLoginIdentity(`/review/${reviewToken}`, requiredRole);
  if (!identity) return null;

  const review = await prisma.applicationReview.findUnique({
    where: { token: reviewToken },
    include: { committeeMember: { include: { portalUser: true } } },
  });
  const user = review?.committeeMember.portalUser;
  if (!user) return null;

  return createChallengeForUser(user, `/review/${reviewToken}`);
}

export async function consumePortalLoginCode(emailValue: string, code: string) {
  const email = normalizePortalEmail(emailValue);
  const challenge = await prisma.portalLoginChallenge.findFirst({
    where: {
      email,
      consumedAt: null,
      expiresAt: { gt: new Date() },
      attempts: { lt: MAX_CODE_ATTEMPTS },
    },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });
  if (!challenge || !challenge.user.active) return null;

  if (!secureEqual(challenge.codeHash, digest(code))) {
    await prisma.portalLoginChallenge.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
    });
    return null;
  }

  const claimed = await prisma.portalLoginChallenge.updateMany({
    where: { id: challenge.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  return claimed.count === 1 ? challenge : null;
}

export async function consumePortalLoginCodeWithToken(token: string, code: string) {
  const challenge = await prisma.portalLoginChallenge.findUnique({
    where: { tokenHash: digest(token) },
    include: { user: true },
  });
  if (
    !challenge ||
    !challenge.user.active ||
    challenge.consumedAt ||
    challenge.expiresAt <= new Date() ||
    challenge.attempts >= MAX_CODE_ATTEMPTS
  ) return null;

  if (!secureEqual(challenge.codeHash, digest(code))) {
    await prisma.portalLoginChallenge.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
    });
    return null;
  }

  const claimed = await prisma.portalLoginChallenge.updateMany({
    where: { id: challenge.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  return claimed.count === 1 ? challenge : null;
}
