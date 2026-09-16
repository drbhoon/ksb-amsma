import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentPortalUser } from '@/lib/portal-auth';
import { prisma } from '@/lib/db';
import { forumSpacePath } from '@/lib/forum';
import { LogoutButton } from '@/components/portal/LogoutButton';
import { AdminPortalNav } from '@/components/portal/AdminPortalNav';
import { ModerationAction } from '@/components/forum/ModerationAction';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Forum Moderation', robots: { index: false, follow: false } };

export default async function AdminForumPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await getCurrentPortalUser();
  if (!user) redirect('/portal/admin/login?next=/portal/admin/forum');
  if (user.role !== 'ADMIN' || user.isTest) redirect('/portal');

  const requestedPage = Number((await searchParams).page || '1');
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 1000) : 1;
  const pageSize = 25;
  const [total, topics, suspended, events] = await Promise.all([
    prisma.forumTopic.count({ where: { isTest: false } }),
    prisma.forumTopic.findMany({
      where: { isTest: false }, orderBy: { updatedAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize,
      include: { author: { select: { name: true } }, _count: { select: { posts: true } } },
    }),
    prisma.portalUser.findMany({ where: { forumPostingSuspended: true }, select: { id: true, name: true, email: true }, orderBy: { name: 'asc' } }),
    prisma.auditEvent.findMany({ where: { event: 'FORUM_MODERATION' }, include: { actorUser: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 20 }),
  ]);

  return <div className="membership-surface min-h-screen py-10 md:py-14"><div className="container-x">
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-300 pb-6">
      <div><p className="membership-kicker !text-[#96501f]">Admin tools</p><h1 className="mt-2 text-3xl font-bold">Forum moderation</h1><p className="mt-2 text-stone-600">Review discussions, restore removed content and control posting access.</p></div>
      <LogoutButton />
    </div>
    <AdminPortalNav current="forum" />
    <section className="mt-9">
      <h2 className="text-2xl font-bold text-[#273d33]">Discussions</h2>
      <p className="mt-2 text-sm text-stone-600">Open a discussion to hide or remove content, pin it, or close replies. Removal can be undone.</p>
      <div className="mt-5 grid gap-3">
        {topics.length === 0 && <p className="membership-card p-6 text-stone-600">No discussions yet.</p>}
        {topics.map((topic) => <Link key={topic.id} href={`/forum/${forumSpacePath(topic.space)}/${topic.id}`} className="membership-card p-5 hover:border-[#c9ad84]">
          <p className="membership-kicker !text-[#96501f]">{topic.space === 'MEMBERS' ? 'Members' : 'Committee'}{topic.isPinned ? ' · Pinned' : ''}{topic.isClosed ? ' · Closed' : ''}{topic.isHidden ? ' · Hidden' : ''}{topic.isDeleted ? ' · Removed' : ''}</p>
          <h3 className="mt-1 text-lg font-bold text-[#273d33]">{topic.title}</h3>
          <p className="mt-1 text-sm text-stone-600">{topic.author.name} · {topic._count.posts} posts</p>
        </Link>)}
      </div>
      {total > pageSize && <nav aria-label="Discussion pages" className="mt-6 flex gap-5 text-sm font-bold text-[#273d33]">
        {page > 1 && <Link href={`/portal/admin/forum?page=${page - 1}`}>Previous</Link>}
        <span>Page {page} of {Math.ceil(total / pageSize)}</span>
        {page * pageSize < total && <Link href={`/portal/admin/forum?page=${page + 1}`}>Next</Link>}
      </nav>}
    </section>
    <section className="mt-12 border-t border-stone-300 pt-8">
      <h2 className="text-2xl font-bold text-[#273d33]">Posting paused</h2>
      {suspended.length === 0 ? <p className="mt-3 text-stone-600">No accounts are paused.</p> : <ul className="mt-4 grid gap-3">{suspended.map((account) => <li key={account.id} className="membership-card flex flex-wrap items-center justify-between gap-3 p-4"><span><strong>{account.name}</strong><span className="ml-2 text-sm text-stone-600">{account.email}</span></span><ModerationAction target="user" id={account.id} action="unsuspend" label="Allow posting" /></li>)}</ul>}
    </section>
    <section className="mt-12 border-t border-stone-300 pt-8">
      <h2 className="text-2xl font-bold text-[#273d33]">Recent admin actions</h2>
      {events.length === 0 ? <p className="mt-3 text-stone-600">No actions recorded yet.</p> : <ul className="mt-4 grid gap-2">{events.map((event) => {
        const details = event.details && typeof event.details === 'object' && !Array.isArray(event.details) ? event.details : {};
        const action = typeof details.action === 'string' ? details.action : 'updated';
        const target = typeof details.target === 'string' ? details.target : 'forum content';
        const reason = typeof details.reason === 'string' ? details.reason : '';
        return <li key={event.id} className="border-b border-stone-200 py-3 text-sm text-stone-700"><strong>{event.actorUser?.name || 'Administrator'}</strong> {action} {target} · {event.createdAt.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })} IST{reason && <span className="block text-stone-500">Reason: {reason}</span>}</li>;
      })}</ul>}
    </section>
  </div></div>;
}
