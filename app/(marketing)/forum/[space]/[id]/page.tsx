import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getForumAccess, parseForumSpace } from '@/lib/forum';
import { ForumShell } from '@/components/forum/ForumShell';
import { ReplyForm } from '@/components/forum/ForumForms';
import { ModerationAction } from '@/components/forum/ModerationAction';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Discussion', robots: { index: false, follow: false } };

export default async function ForumTopicPage({ params, searchParams }: { params: Promise<{ space: string; id: string }>; searchParams: Promise<{ page?: string }> }) {
  const { space: slug, id } = await params;
  const space = parseForumSpace(slug);
  if (!space) notFound();
  const access = await getForumAccess();
  if (!access) redirect(`/forum/login?next=/forum/${slug}/${id}`);
  if (space === 'COMMITTEE' && !access.canSeeCommittee) notFound();

  const topic = await prisma.forumTopic.findUnique({ where: { id }, select: { title: true, space: true, isTest: true, isClosed: true, isHidden: true, isDeleted: true, isPinned: true } });
  if (!topic || topic.space !== space || topic.isTest !== access.isTest || ((topic.isHidden || topic.isDeleted) && !access.isModerator)) notFound();

  const requestedPage = Number((await searchParams).page || '1');
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 1000) : 1;
  const pageSize = 30;
  const where = { topicId: id, ...(access.isModerator ? {} : { isHidden: false, isDeleted: false }) };
  const [total, posts] = await Promise.all([
    prisma.forumPost.count({ where }),
    prisma.forumPost.findMany({ where, orderBy: { createdAt: 'asc' }, skip: (page - 1) * pageSize, take: pageSize, include: { author: { select: { id: true, name: true, role: true, isTest: true, forumPostingSuspended: true } } } }),
  ]);

  return (
    <ForumShell title={topic.title} eyebrow={space === 'COMMITTEE' ? 'Committee discussion' : 'Member discussion'} userName={access.user.name} canSeeCommittee={access.canSeeCommittee} testAccount={access.testAccount} postingSuspended={!access.canPost}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link href={`/forum/${slug}`} className="text-sm font-bold text-[#96501f] hover:underline">← All {slug} discussions</Link>
        <div className="flex flex-wrap items-center gap-3">
          {topic.isClosed && <span className="rounded-full bg-stone-200 px-3 py-1 text-xs font-bold text-stone-600">Closed</span>}
          {topic.isHidden && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">Hidden from members</span>}
          {topic.isDeleted && <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800">Removed</span>}
          {topic.isPinned && <span className="rounded-full bg-[#f8f2e7] px-3 py-1 text-xs font-bold text-[#96501f]">Pinned</span>}
          {access.isModerator && <>
            <ModerationAction target="topic" id={id} action={topic.isClosed ? 'open' : 'close'} label={topic.isClosed ? 'Reopen topic' : 'Close topic'} />
            <ModerationAction target="topic" id={id} action={topic.isPinned ? 'unpin' : 'pin'} label={topic.isPinned ? 'Unpin topic' : 'Pin topic'} />
            <ModerationAction target="topic" id={id} action={topic.isHidden ? 'show' : 'hide'} label={topic.isHidden ? 'Show topic' : 'Hide topic'} />
            <ModerationAction target="topic" id={id} action={topic.isDeleted ? 'restore' : 'delete'} label={topic.isDeleted ? 'Restore topic' : 'Remove topic'} danger={!topic.isDeleted} />
          </>}
        </div>
      </div>
      <ol className="grid gap-4">
        {posts.map((post, index) => <li key={post.id} className={`membership-card p-5 sm:p-7 ${post.isHidden || post.isDeleted ? 'opacity-65' : ''}`}>
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-3">
            <div>
              <p className="font-bold text-[#273d33]">{post.author.name}{post.author.isTest ? ' · Test member' : post.author.role === 'ADMIN' ? ' · Admin' : post.author.role === 'COMMITTEE' ? ' · Committee' : ''}</p>
              <p className="mt-1 text-xs text-stone-500">{post.createdAt.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })} IST</p>
            </div>
            {access.isModerator && <div className="flex flex-wrap gap-3">
              <ModerationAction target="post" id={post.id} action={post.isHidden ? 'show' : 'hide'} label={post.isHidden ? 'Show post' : 'Hide post'} />
              {(post.isDeleted || page !== 1 || index !== 0) && <ModerationAction target="post" id={post.id} action={post.isDeleted ? 'restore' : 'delete'} label={post.isDeleted ? 'Restore post' : 'Remove post'} danger={!post.isDeleted} />}
              {(post.author.role === 'MEMBER' || post.author.isTest) && <ModerationAction target="user" id={post.author.id} action={post.author.forumPostingSuspended ? 'unsuspend' : 'suspend'} label={post.author.forumPostingSuspended ? 'Allow posting' : 'Pause posting'} danger={!post.author.forumPostingSuspended} />}
            </div>}
          </div>
          <p className="mt-4 whitespace-pre-wrap break-words leading-relaxed text-[#273d33]">{post.isDeleted ? 'This post was removed by an administrator.' : post.isHidden ? 'This post is hidden.' : post.body}</p>
        </li>)}
      </ol>
      {total > pageSize && <nav aria-label="Reply pages" className="mt-7 flex gap-5 text-sm font-bold text-[#273d33]">
        {page > 1 && <Link href={`/forum/${slug}/${id}?page=${page - 1}`} className="hover:underline">Previous</Link>}
        <span>Page {page} of {Math.ceil(total / pageSize)}</span>
        {page * pageSize < total && <Link href={`/forum/${slug}/${id}?page=${page + 1}`} className="hover:underline">Next</Link>}
      </nav>}
      {!topic.isClosed && !topic.isHidden && !topic.isDeleted && access.canPost && <ReplyForm topicId={id} />}
    </ForumShell>
  );
}
