import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getForumAccess, parseForumSpace } from '@/lib/forum';
import { ForumShell } from '@/components/forum/ForumShell';
import { ReplyForm } from '@/components/forum/ForumForms';
import { moderateForum } from '../../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Discussion', robots: { index: false, follow: false } };

export default async function ForumTopicPage({ params, searchParams }: { params: Promise<{ space: string; id: string }>; searchParams: Promise<{ page?: string }> }) {
  const { space: slug, id } = await params;
  const space = parseForumSpace(slug);
  if (!space) notFound();
  const access = await getForumAccess();
  if (!access) redirect(`/forum/login?next=/forum/${slug}/${id}`);
  if (space === 'COMMITTEE' && !access.canSeeCommittee) notFound();

  const topic = await prisma.forumTopic.findUnique({ where: { id }, select: { title: true, space: true, isClosed: true, isHidden: true } });
  if (!topic || topic.space !== space || (topic.isHidden && !access.isModerator)) notFound();

  const requestedPage = Number((await searchParams).page || '1');
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 1000) : 1;
  const pageSize = 30;
  const where = { topicId: id, ...(access.isModerator ? {} : { isHidden: false }) };
  const [total, posts] = await Promise.all([
    prisma.forumPost.count({ where }),
    prisma.forumPost.findMany({ where, orderBy: { createdAt: 'asc' }, skip: (page - 1) * pageSize, take: pageSize, include: { author: { select: { name: true, role: true } } } }),
  ]);

  return (
    <ForumShell title={topic.title} eyebrow={space === 'COMMITTEE' ? 'Committee discussion' : 'Member discussion'} userName={access.user.name} canSeeCommittee={access.canSeeCommittee}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link href={`/forum/${slug}`} className="text-sm font-bold text-[#96501f] hover:underline">← All {slug} discussions</Link>
        <div className="flex flex-wrap items-center gap-3">
          {topic.isClosed && <span className="rounded-full bg-stone-200 px-3 py-1 text-xs font-bold text-stone-600">Closed</span>}
          {topic.isHidden && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">Hidden from members</span>}
          {access.isModerator && <>
            <form action={moderateForum}>
              <input type="hidden" name="target" value="topic" /><input type="hidden" name="id" value={id} />
              <input type="hidden" name="action" value={topic.isClosed ? 'open' : 'close'} />
              <button type="submit" className="text-sm font-bold text-[#273d33] hover:underline">{topic.isClosed ? 'Reopen' : 'Close'} topic</button>
            </form>
            <form action={moderateForum}>
              <input type="hidden" name="target" value="topic" /><input type="hidden" name="id" value={id} />
              <input type="hidden" name="action" value={topic.isHidden ? 'show' : 'hide'} />
              <button type="submit" className="text-sm font-bold text-red-700 hover:underline">{topic.isHidden ? 'Show' : 'Hide'} topic</button>
            </form>
          </>}
        </div>
      </div>
      <ol className="grid gap-4">
        {posts.map((post) => <li key={post.id} className={`membership-card p-5 sm:p-7 ${post.isHidden ? 'opacity-65' : ''}`}>
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-3">
            <div>
              <p className="font-bold text-[#273d33]">{post.author.name}{post.author.role === 'ADMIN' ? ' · Admin' : post.author.role === 'COMMITTEE' ? ' · Committee' : ''}</p>
              <p className="mt-1 text-xs text-stone-500">{post.createdAt.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })} IST</p>
            </div>
            {access.isModerator && <form action={moderateForum}>
              <input type="hidden" name="target" value="post" /><input type="hidden" name="id" value={post.id} />
              <input type="hidden" name="action" value={post.isHidden ? 'show' : 'hide'} />
              <button type="submit" className="text-xs font-bold text-red-700 hover:underline">{post.isHidden ? 'Restore' : 'Hide'} post</button>
            </form>}
          </div>
          <p className="mt-4 whitespace-pre-wrap break-words leading-relaxed text-[#273d33]">{post.isHidden ? 'This post is hidden.' : post.body}</p>
        </li>)}
      </ol>
      {total > pageSize && <nav aria-label="Reply pages" className="mt-7 flex gap-5 text-sm font-bold text-[#273d33]">
        {page > 1 && <Link href={`/forum/${slug}/${id}?page=${page - 1}`} className="hover:underline">Previous</Link>}
        <span>Page {page} of {Math.ceil(total / pageSize)}</span>
        {page * pageSize < total && <Link href={`/forum/${slug}/${id}?page=${page + 1}`} className="hover:underline">Next</Link>}
      </nav>}
      {!topic.isClosed && !topic.isHidden && <ReplyForm topicId={id} />}
    </ForumShell>
  );
}
