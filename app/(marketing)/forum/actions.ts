'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getForumAccess, forumSpacePath, parseForumSpace } from '@/lib/forum';

export type ForumActionState = { error?: string };

const topicSchema = z.object({
  space: z.enum(['members', 'committee']),
  title: z.string().trim().min(5).max(160),
  body: z.string().trim().min(10).max(10000),
});
const replySchema = z.object({
  topicId: z.string().min(1),
  body: z.string().trim().min(2).max(10000),
});

export async function createForumTopic(_previous: ForumActionState, formData: FormData): Promise<ForumActionState> {
  const access = await getForumAccess();
  if (!access) return { error: 'Sign in with an active AMSMA account.' };
  if (!access.canPost) return { error: 'Your forum posting access is paused. Please contact AMSMA.' };
  const parsed = topicSchema.safeParse({
    space: formData.get('space'),
    title: formData.get('title'),
    body: formData.get('body'),
  });
  if (!parsed.success) return { error: 'Enter a title of 5–160 characters and a message of 10–10,000 characters.' };
  const space = parseForumSpace(parsed.data.space);
  if (!space || (space === 'COMMITTEE' && !access.canSeeCommittee)) return { error: 'You cannot post in this area.' };

  const recent = await prisma.forumTopic.count({
    where: { authorId: access.user.id, createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) } },
  });
  if (recent >= 5) return { error: 'Please wait before starting another topic.' };

  const topic = await prisma.forumTopic.create({
    data: {
      space,
      isTest: access.isTest,
      title: parsed.data.title,
      authorId: access.user.id,
      posts: { create: { body: parsed.data.body, authorId: access.user.id } },
    },
    select: { id: true },
  });
  revalidatePath('/forum');
  revalidatePath(`/forum/${parsed.data.space}`);
  redirect(`/forum/${parsed.data.space}/${topic.id}`);
}

export async function createForumReply(_previous: ForumActionState, formData: FormData): Promise<ForumActionState> {
  const access = await getForumAccess();
  if (!access) return { error: 'Sign in with an active AMSMA account.' };
  if (!access.canPost) return { error: 'Your forum posting access is paused. Please contact AMSMA.' };
  const parsed = replySchema.safeParse({ topicId: formData.get('topicId'), body: formData.get('body') });
  if (!parsed.success) return { error: 'Enter a message of 2–10,000 characters.' };

  const topic = await prisma.forumTopic.findUnique({
    where: { id: parsed.data.topicId },
    select: { space: true, isTest: true, isClosed: true, isHidden: true, isDeleted: true },
  });
  if (!topic || topic.isTest !== access.isTest || topic.isHidden || topic.isDeleted || topic.isClosed || (topic.space === 'COMMITTEE' && !access.canSeeCommittee)) {
    return { error: 'This discussion is not open for replies.' };
  }

  const recent = await prisma.forumPost.count({
    where: { authorId: access.user.id, createdAt: { gte: new Date(Date.now() - 60 * 1000) } },
  });
  if (recent >= 10) return { error: 'Please wait before posting again.' };

  await prisma.$transaction([
    prisma.forumPost.create({ data: { topicId: parsed.data.topicId, authorId: access.user.id, body: parsed.data.body } }),
    prisma.forumTopic.update({ where: { id: parsed.data.topicId }, data: { updatedAt: new Date() } }),
  ]);
  const path = `/forum/${forumSpacePath(topic.space)}/${parsed.data.topicId}`;
  revalidatePath(path);
  revalidatePath(`/forum/${forumSpacePath(topic.space)}`);
  revalidatePath('/forum');
  redirect(path);
}

export async function moderateForum(formData: FormData): Promise<void> {
  const access = await getForumAccess();
  if (!access?.isModerator) throw new Error('Admin access is required.');
  const target = String(formData.get('target') || '');
  const id = String(formData.get('id') || '');
  const action = String(formData.get('action') || '');
  const reason = String(formData.get('reason') || '').trim().slice(0, 500);
  if (!id || id.length > 100) return;
  if ((action === 'delete' || action === 'suspend') && reason.length < 5) return;

  if (target === 'topic' && ['close', 'open', 'hide', 'show', 'delete', 'restore', 'pin', 'unpin'].includes(action)) {
    const existing = await prisma.forumTopic.findUnique({ where: { id }, select: { isTest: true, space: true } });
    if (!existing || existing.isTest !== access.isTest) return;
    const data = action === 'close' ? { isClosed: true }
      : action === 'open' ? { isClosed: false }
      : action === 'hide' ? { isHidden: true }
      : action === 'show' ? { isHidden: false }
      : action === 'delete' ? { isDeleted: true }
      : action === 'restore' ? { isDeleted: false }
      : action === 'pin' ? { isPinned: true } : { isPinned: false };
    await prisma.$transaction([
      prisma.forumTopic.update({ where: { id }, data }),
      prisma.auditEvent.create({ data: { actorUserId: access.user.id, event: 'FORUM_MODERATION', details: { target, id, action, reason } } }),
    ]);
    revalidatePath(`/forum/${forumSpacePath(existing.space)}/${id}`);
    revalidatePath(`/forum/${forumSpacePath(existing.space)}`);
  } else if (target === 'post' && ['hide', 'show', 'delete', 'restore'].includes(action)) {
    const existing = await prisma.forumPost.findUnique({ where: { id }, select: { topicId: true, topic: { select: { space: true, isTest: true } } } });
    if (!existing || existing.topic.isTest !== access.isTest) return;
    if (action === 'delete') {
      const opening = await prisma.forumPost.findFirst({ where: { topicId: existing.topicId }, orderBy: { createdAt: 'asc' }, select: { id: true } });
      if (opening?.id === id) return; // Remove the whole topic instead.
    }
    const data = action === 'hide' ? { isHidden: true }
      : action === 'show' ? { isHidden: false }
      : action === 'delete' ? { isDeleted: true } : { isDeleted: false };
    await prisma.$transaction([
      prisma.forumPost.update({ where: { id }, data }),
      prisma.auditEvent.create({ data: { actorUserId: access.user.id, event: 'FORUM_MODERATION', details: { target, id, topicId: existing.topicId, action, reason } } }),
    ]);
    revalidatePath(`/forum/${forumSpacePath(existing.topic.space)}/${existing.topicId}`);
    revalidatePath(`/forum/${forumSpacePath(existing.topic.space)}`);
  } else if (target === 'user' && ['suspend', 'unsuspend'].includes(action)) {
    const subject = await prisma.portalUser.findUnique({ where: { id }, select: { role: true, isTest: true } });
    if (!subject || id === access.user.id || (subject.role !== 'MEMBER' && !subject.isTest)) return;
    await prisma.$transaction([
      prisma.portalUser.update({ where: { id }, data: { forumPostingSuspended: action === 'suspend' } }),
      prisma.auditEvent.create({ data: { actorUserId: access.user.id, event: 'FORUM_MODERATION', details: { target, id, action, reason } } }),
    ]);
  }
  revalidatePath('/forum');
  revalidatePath('/portal/admin/forum');
}
