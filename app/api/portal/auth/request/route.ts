import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createPortalLoginChallenge, createPortalLoginChallengeForReview, createForumLoginChallenge } from '@/lib/portal-login';
import { sendPortalLogin } from '@/lib/email';
import { recordAudit } from '@/lib/audit';

const schema = z.object({
  email: z.string().email().max(254).optional(),
  reviewToken: z.string().min(20).max(200).optional(),
  next: z.string().optional(),
  portalType: z.enum(['ADMIN', 'COMMITTEE', 'FORUM']),
}).refine((value) => Boolean(value.email) !== Boolean(value.reviewToken));

const GENERIC_MESSAGE = 'If this email is approved, a sign-in code has been sent.';

export async function POST(request: Request) {
  if (process.env.PORTAL_EMAIL_LOGIN_ENABLED !== 'true') {
    return NextResponse.json(
      { error: 'Portal email login is not active yet.' },
      { status: 503 }
    );
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  if (parsed.data.portalType === 'FORUM' && parsed.data.reviewToken) {
    return NextResponse.json({ error: 'This request is not valid.' }, { status: 400 });
  }

  const challenge = parsed.data.portalType === 'FORUM'
    ? await createForumLoginChallenge(parsed.data.email!, parsed.data.next)
    : parsed.data.reviewToken
    ? await createPortalLoginChallengeForReview(parsed.data.reviewToken, parsed.data.portalType)
    : await createPortalLoginChallenge(parsed.data.email!, parsed.data.next, parsed.data.portalType);
  if (challenge) {
    await sendPortalLogin({
      email: challenge.user.email,
      code: challenge.code,
      role: challenge.user.role,
      expiresAt: challenge.expiresAt,
    });
    await recordAudit({ actorUserId: challenge.user.id, event: 'EMAIL_LOGIN_REQUESTED' });
  }

  return NextResponse.json({
    success: true,
    message: GENERIC_MESSAGE,
    challengeToken: parsed.data.reviewToken && challenge ? challenge.token : undefined,
  });
}
