import { redirect } from 'next/navigation';
import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';
import { getCurrentPortalUser, safePortalReturnPath } from '@/lib/portal-auth';
import { signIn } from '@/auth';

export const metadata = { title: 'Committee and Admin Login' };

export default async function PortalLoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const query = await searchParams;
  const user = await getCurrentPortalUser();
  if (user) redirect(user.role === 'ADMIN' ? '/admin' : '/portal');
  const nextPath = safePortalReturnPath(query.next);
  return (
    <><Header /><main className="membership-surface min-h-[70vh] py-14 md:py-20">
      <div className="container-x max-w-lg">
        <p className="membership-kicker !text-[#96501f]">Secure access</p>
        <h1 className="mt-2 text-3xl font-bold">Committee and admin login</h1>
        <p className="mt-3 mb-8 text-stone-600">Use the Google account that the AMSMA Secretariat has approved for you.</p>
        <div className="membership-card p-6 sm:p-8">
          {query.error && <p role="alert" className="mb-5 border border-red-300 bg-red-50 p-3 text-sm text-red-800">This Google account is not approved for portal access. Use the exact email address registered with AMSMA.</p>}
          <form action={async () => { 'use server'; await signIn('google', { redirectTo: query.next ? nextPath : '/portal' }); }}>
            <button type="submit" className="btn-primary w-full">
              <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center bg-white text-sm font-bold text-[#4285F4]">G</span>
              Continue with Google
            </button>
          </form>
          <p className="mt-4 text-xs leading-relaxed text-stone-500">AMSMA receives your verified Google email and basic profile identity. It does not receive your Gmail password or access to your inbox.</p>
        </div>
      </div>
    </main><Footer /></>
  );
}
