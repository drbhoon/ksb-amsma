import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';
import { getCurrentPortalUser } from '@/lib/portal-auth';

export const metadata = { title: 'Portal Login' };

export default async function PortalLoginPage() {
  const user = await getCurrentPortalUser();
  if (user) redirect(user.isTest ? '/portal/test' : user.role === 'ADMIN' ? '/portal/admin' : user.role === 'MEMBER' ? '/forum' : '/portal');
  return (
    <><Header /><main className="membership-surface min-h-[70vh] py-14 md:py-20">
      <div className="container-x max-w-3xl">
        <p className="membership-kicker !text-[#96501f]">Secure access</p>
        <h1 className="mt-2 text-3xl font-bold">Choose your portal</h1>
        <p className="mt-3 mb-8 text-stone-600">Select the portal that matches your AMSMA role.</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <Link href="/portal/committee/login" className="membership-card p-6 transition hover:border-[#c9ad84] hover:bg-[#f8f2e7]">
            <h2 className="text-xl font-bold text-[#273d33]">Committee Login</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">For Managing Committee application reviews and votes.</p>
          </Link>
          <Link href="/portal/admin/login" className="membership-card p-6 transition hover:border-[#c9ad84] hover:bg-[#f8f2e7]">
            <h2 className="text-xl font-bold text-[#273d33]">Admin Login</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">For Secretariat administration and final confirmation.</p>
          </Link>
        </div>
      </div>
    </main><Footer /></>
  );
}
