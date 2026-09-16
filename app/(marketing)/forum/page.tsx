import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getForumAccess, FORUM_SPACES, forumSpacePath } from '@/lib/forum';
import { ForumShell } from '@/components/forum/ForumShell';
import type { ForumSpace } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Forum', robots: { index: false, follow: false } };

export default async function ForumPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const access = await getForumAccess();
  if (!access) redirect('/forum/login?next=/forum');
  const query = (await searchParams).q?.trim().slice(0, 100) || '';
  const spaces: ForumSpace[] = access.canSeeCommittee ? ['MEMBERS', 'COMMITTEE'] : ['MEMBERS'];
  const [recent, results] = await Promise.all([
    prisma.forumTopic.findMany({
      where: { space: { in: spaces }, isHidden: false, isDeleted: false, isTest: access.isTest },
      orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }], take: 8,
      include: { author: { select: { name: true } }, _count: { select: { posts: { where: { isHidden: false, isDeleted: false } } } } },
    }),
    query ? prisma.forumTopic.findMany({
      where: {
        space: { in: spaces }, isHidden: false, isDeleted: false, isTest: access.isTest,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { posts: { some: { body: { contains: query, mode: 'insensitive' }, isHidden: false, isDeleted: false } } },
        ],
      },
      orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }], take: 50,
      include: { author: { select: { name: true } }, _count: { select: { posts: { where: { isHidden: false, isDeleted: false } } } } },
    }) : Promise.resolve([]),
  ]);

  return (
    <ForumShell title="Discussion forum" eyebrow="AMSMA community" userName={access.user.name} canSeeCommittee={access.canSeeCommittee} testAccount={access.testAccount} postingSuspended={!access.canPost}>
      <p className="mb-8 max-w-3xl text-stone-600">A private place for AMSMA members to share experience, ask questions and work together.</p>
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/forum/members" className="membership-card p-6 transition hover:border-[#c9ad84] hover:bg-[#f8f2e7]">
          <p className="membership-kicker !text-[#96501f]">Active members</p>
          <h2 className="mt-2 text-2xl font-bold text-[#273d33]">{FORUM_SPACES.members.title}</h2>
          <p className="mt-2 text-sm text-stone-600">{FORUM_SPACES.members.description}</p>
        </Link>
        {access.canSeeCommittee && <Link href="/forum/committee" className="membership-card p-6 transition hover:border-[#c9ad84] hover:bg-[#f8f2e7]">
          <p className="membership-kicker !text-[#96501f]">Restricted area</p>
          <h2 className="mt-2 text-2xl font-bold text-[#273d33]">{FORUM_SPACES.committee.title}</h2>
          <p className="mt-2 text-sm text-stone-600">{FORUM_SPACES.committee.description}</p>
        </Link>}
      </div>

      <form action="/forum" method="get" role="search" className="mt-10 flex flex-col gap-3 sm:flex-row">
        <label htmlFor="forum-search" className="sr-only">Search discussions</label>
        <input id="forum-search" name="q" type="search" defaultValue={query} maxLength={100} placeholder="Search discussions" className="min-w-0 flex-1 border border-stone-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#c9ad84]" />
        <button type="submit" className="btn-primary">Search</button>
      </form>

      <section className="mt-10">
        <h2 className="mb-4 text-2xl font-bold text-[#273d33]">{query ? `Search results for “${query}”` : 'Recent discussions'}</h2>
        {(query ? results : recent).length === 0 ? (
          <p className="membership-card p-6 text-stone-600">{query ? 'No discussions match this search.' : 'There are no discussions yet. Start the first one in a forum area.'}</p>
        ) : (
          <ul className="grid gap-3">
            {(query ? results : recent).map((topic) => (
              <li key={topic.id} className="membership-card p-5">
                <p className="membership-kicker !text-[#96501f]">{topic.space === 'MEMBERS' ? 'Members' : 'Committee'}{topic.isPinned ? ' · Pinned' : ''}</p>
                <h3 className="mt-1 text-lg font-bold text-[#273d33]"><Link className="hover:underline" href={`/forum/${forumSpacePath(topic.space)}/${topic.id}`}>{topic.title}</Link></h3>
                <p className="mt-2 text-xs text-stone-600">{topic.author.name} · {topic.updatedAt.toLocaleDateString('en-IN')} · {Math.max(0, topic._count.posts - 1)} replies</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </ForumShell>
  );
}
