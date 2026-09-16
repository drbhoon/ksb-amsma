import 'server-only';

import { getCurrentPortalUser } from './portal-auth';
import { prisma } from './db';
import type { ForumSpace } from '@prisma/client';

export const FORUM_SPACES = {
  members: { value: 'MEMBERS', title: 'Member discussions', description: 'Ideas, questions and practical knowledge for active AMSMA members.' },
  committee: { value: 'COMMITTEE', title: 'Committee discussions', description: 'Private discussions for the Managing Committee and AMSMA administration.' },
} as const;

export function parseForumSpace(value: string): ForumSpace | null {
  if (value === 'members') return 'MEMBERS';
  if (value === 'committee') return 'COMMITTEE';
  return null;
}

export function forumSpacePath(value: ForumSpace): string {
  return value === 'COMMITTEE' ? 'committee' : 'members';
}

/** Access is checked afresh on every page and every write. */
export async function getForumAccess() {
  const user = await getCurrentPortalUser();
  if (!user || user.isTest) return null;
  if (user.role === 'ADMIN' || user.role === 'COMMITTEE') {
    return { user, canSeeCommittee: true, isModerator: user.role === 'ADMIN' };
  }
  if (user.role !== 'MEMBER' || !user.memberId) return null;
  const member = await prisma.member.findUnique({
    where: { id: user.memberId },
    select: { status: true, expiresAt: true, email: true },
  });
  if (!member || member.status !== 'ACTIVE' || member.expiresAt <= new Date() || member.email.toLowerCase() !== user.email.toLowerCase()) {
    return null;
  }
  return { user, canSeeCommittee: false, isModerator: false };
}
