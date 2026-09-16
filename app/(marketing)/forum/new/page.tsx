import { notFound, redirect } from 'next/navigation';
import { getForumAccess, parseForumSpace } from '@/lib/forum';
import { ForumShell } from '@/components/forum/ForumShell';
import { NewTopicForm } from '@/components/forum/ForumForms';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'New Discussion', robots: { index: false, follow: false } };

export default async function NewForumTopicPage({ searchParams }: { searchParams: Promise<{ space?: string }> }) {
  const slug = (await searchParams).space || 'members';
  const space = parseForumSpace(slug);
  if (!space) notFound();
  const access = await getForumAccess();
  if (!access) redirect(`/forum/login?next=/forum/new%3Fspace%3D${slug}`);
  if (space === 'COMMITTEE' && !access.canSeeCommittee) notFound();

  return (
    <ForumShell title="Start a discussion" eyebrow={space === 'COMMITTEE' ? 'Committee area' : 'Member area'} userName={access.user.name} canSeeCommittee={access.canSeeCommittee}>
      <div className="max-w-3xl"><NewTopicForm space={slug as 'members' | 'committee'} /></div>
    </ForumShell>
  );
}
