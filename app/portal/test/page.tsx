import { redirect } from 'next/navigation';
import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';
import { LogoutButton } from '@/components/portal/LogoutButton';
import { getCurrentPortalUser } from '@/lib/portal-auth';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Portal Test Access' };

export default async function PortalTestPage() {
  const user = await getCurrentPortalUser();
  if (!user) redirect('/portal/login?next=/portal/test');
  if (!user.isTest) redirect(user.role === 'ADMIN' ? '/portal/admin' : '/portal');

  return (
    <><Header /><main className="membership-surface min-h-[70vh] py-12 md:py-16">
      <div className="container-x max-w-3xl">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-300 pb-6">
          <div>
            <p className="membership-kicker !text-[#96501f]">Test portal</p>
            <h1 className="mt-2 text-3xl font-bold">Sign-in test complete</h1>
          </div>
          <LogoutButton />
        </div>
        <div className="membership-card mt-8 p-6 sm:p-8">
          <p className="text-lg font-semibold text-[#273d33]">You signed in as {user.name}.</p>
          <p className="mt-3 leading-relaxed text-stone-600">This is a test-only account with the role: {user.role === 'ADMIN' ? 'Admin' : 'Committee reviewer'}.</p>
          <p className="mt-3 leading-relaxed text-stone-600">It cannot open, approve, reject, or change a real membership application.</p>
        </div>
      </div>
    </main><Footer /></>
  );
}
