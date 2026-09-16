import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { FORUM_SPACES, getForumAccess, parseForumSpace } from '@/lib/forum';
import { ForumShell } from '@/components/forum/ForumShell';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Forum Discussions', robots: { index: false, follow: false } };

export default async function ForumSpacePage({ params, searchParams }: { params: Promise<{ space: string }>; searchParams: Promise<{ page?: string }> }) {
  const { space: slug } = await params;
  const space = parseForumSpace(slug);
  if (!space) notFound();
  const access = await getForumAccess();
  if (!access) redirect(`/forum/login?next=/forum/${slug}`);
  if (space === 'COMMITTEE' && !access.canSeeCommittee) notFound();

  const requestedPage = Number((await searchParams).page || '1');
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 1000) : 1;
  const pageSize = 20;
  const where = { space, isHidden: false };
  const [total, topics] = await Promise.all([
    prisma.forumTopic.count({ where }),
    prisma.forumTopic.findMany({
      where, orderBy: { updatedAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize,
      include: { author: { select: { name: true } }, _count: { select: { posts: { where: { isHidden: false } } } } },
    }),
  ]);
  const label = slug === 'committee' ? FORUM_SPACES.committee : FORUM_SPACES.members;

  return (
    <ForumShell title={label.title} eyebrow="Private forum" userName={access.user.name} canSeeCommittee={access.canSeeCommittee}>
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-2xl text-stone-600">{label.description}</p>
        <Link href={`/forum/new?space=${slug}`} className="btn-primary">Start a discussion</Link>
      </div>
      {topics.length === 0 ? (
        <div className="membership-card p-7 text-stone-600">No discussions here yet.</div>
      ) : (
        <ul className="grid gap-3">
          {topics.map((topic) => (
            <li key={topic.id} className="membership-card p-5 sm:p-6">
              <h2 className="text-xl font-bold text-[#273d33]"><Link href={`/forum/${slug}/${topic.id}`} className="hover:underline">{topic.title}</Link></h2>
              <p className="mt-2 text-sm text-stone-600">{topic.author.name} · {topic.updatedAt.toLocaleDateString('en-IN')} · {Math.max(0, topic._count.posts - 1)} replies{topic.isClosed ? ' · Closed' : ''}</p>
            </li>
          ))}
        </ul>
      )}
      {total > pageSize && <nav aria-label="Discussion pages" className="mt-7 flex gap-5 text-sm font-bold text-[#273d33]">
        {page > 1 && <Link href={`/forum/${slug}?page=${page - 1}`} className="hover:underline">Previous</Link>}
        <span>Page {page} of {Math.ceil(total / pageSize)}</span>
        {page * pageSize < total && <Link href={`/forum/${slug}?page=${page + 1}`} className="hover:underline">Next</Link>}
      </nav>}
    </ForumShell>
  );
}
