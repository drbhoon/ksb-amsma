import { redirect } from 'next/navigation';
import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';
import { getCurrentPortalUser, safePortalReturnPath } from '@/lib/portal-auth';
import { EmailLoginForm } from '@/components/portal/EmailLoginForm';

export const metadata = { title: 'Committee and Admin Login' };

export default async function PortalLoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; token?: string }> }) {
  const query = await searchParams;
  const user = await getCurrentPortalUser();
  if (user) redirect(user.role === 'ADMIN' ? '/portal/admin' : '/portal');
  const nextPath = safePortalReturnPath(query.next);
  return (
    <><Header /><main className="membership-surface min-h-[70vh] py-14 md:py-20">
      <div className="container-x max-w-lg">
        <p className="membership-kicker !text-[#96501f]">Secure access</p>
        <h1 className="mt-2 text-3xl font-bold">Committee and admin login</h1>
        <p className="mt-3 mb-8 text-stone-600">Use the email address that the AMSMA Secretariat has approved for you. No Google account or password is required.</p>
        <div className="membership-card p-6 sm:p-8">
          {query.error && <p role="alert" className="mb-5 border border-red-300 bg-red-50 p-3 text-sm text-red-800">This sign-in link is invalid or has expired. Request a new code below.</p>}
          <EmailLoginForm nextPath={nextPath} initialToken={query.token} />
          <p className="mt-5 text-xs leading-relaxed text-stone-500">The code and link expire after 15 minutes and can be used only once. Access is limited to approved committee and admin addresses.</p>
        </div>
      </div>
    </main><Footer /></>
  );
}
