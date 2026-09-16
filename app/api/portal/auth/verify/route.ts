import { NextResponse } from 'next/server';
import { z } from 'zod';
import { consumePortalLoginCode, consumePortalLoginCodeWithToken } from '@/lib/portal-login';
import { createPortalSession } from '@/lib/portal-auth';
import { recordAudit } from '@/lib/audit';

const codeSchema = z.object({
  email: z.string().email().max(254).optional(),
  challengeToken: z.string().min(20).max(200).optional(),
  code: z.string().regex(/^\d{6}$/),
}).refine((value) => Boolean(value.email) !== Boolean(value.challengeToken));

function destination(role: 'ADMIN' | 'COMMITTEE' | 'MEMBER', returnPath: string, isTest: boolean): string {
  if (isTest) return returnPath.startsWith('/review/') || returnPath.startsWith('/forum') ? returnPath : '/portal/test';
  if (role === 'MEMBER') return returnPath.startsWith('/forum') ? returnPath : '/forum';
  if (returnPath && returnPath !== '/portal') return returnPath;
  return role === 'ADMIN' ? '/portal/admin' : '/portal';
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const codeRequest = codeSchema.safeParse(body);
  if (!codeRequest.success) {
    return NextResponse.json({ error: 'Enter the six-digit code from the email.' }, { status: 400 });
  }
  const challenge = codeRequest.data.challengeToken
    ? await consumePortalLoginCodeWithToken(codeRequest.data.challengeToken, codeRequest.data.code)
    : await consumePortalLoginCode(codeRequest.data.email!, codeRequest.data.code);
  if (!challenge) {
    return NextResponse.json({ error: 'This sign-in code is incorrect or has expired.' }, { status: 401 });
  }
  await createPortalSession(challenge.userId);
  await recordAudit({ actorUserId: challenge.userId, event: 'EMAIL_CODE_LOGIN' });
  return NextResponse.json({
    success: true,
    next: destination(challenge.user.role, challenge.returnPath, challenge.user.isTest),
  });
}
