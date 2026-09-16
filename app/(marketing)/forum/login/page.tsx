import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getForumAccess } from '@/lib/forum';
import { safePortalReturnPath } from '@/lib/portal-auth';
import { EmailLoginForm } from '@/components/portal/EmailLoginForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Forum Login', robots: { index: false, follow: false } };

export default async function ForumLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const query = await searchParams;
  const nextPath = safePortalReturnPath(query.next);
  const destination = nextPath.startsWith('/forum') && nextPath !== '/forum/login' ? nextPath : '/forum';
  if (await getForumAccess()) redirect(destination);

  return (
    <div className="membership-surface min-h-[70vh] py-14 md:py-20">
      <div className="container-x max-w-lg">
        <p className="membership-kicker !text-[#96501f]">Private community</p>
        <h1 className="mt-2 text-3xl font-bold">Forum login</h1>
        <p className="mb-8 mt-3 text-stone-600">
          Active members, committee members and administrators can use their approved email address. A code is sent only when you request it here.
        </p>
        <div className="membership-card p-6 sm:p-8">
          <EmailLoginForm portalType="FORUM" nextPath={destination} />
          <p className="mt-5 text-xs leading-relaxed text-stone-500">The six-digit code expires after 15 minutes. No forum alerts are sent by email.</p>
        </div>
        <Link href="/membership" className="mt-6 inline-block text-sm font-semibold text-[#96501f] hover:underline">Learn about membership</Link>
      </div>
    </div>
  );
}
