import Link from 'next/link';
import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';
import { EmailLoginForm } from '@/components/portal/EmailLoginForm';

export function PortalLoginScreen({
  portalType,
  nextPath,
}: {
  portalType: 'ADMIN' | 'COMMITTEE';
  nextPath: string;
}) {
  const admin = portalType === 'ADMIN';
  return (
    <><Header /><main className="membership-surface min-h-[70vh] py-14 md:py-20">
      <div className="container-x max-w-lg">
        <p className="membership-kicker !text-[#96501f]">Secure access</p>
        <h1 className="mt-2 text-3xl font-bold">{admin ? 'Admin Login' : 'Committee Login'}</h1>
        <p className="mt-3 mb-8 text-stone-600">
          Use the {admin ? 'admin' : 'committee'} email address approved by the AMSMA Secretariat. We will send a six-digit code. No password is required.
        </p>
        <div className="membership-card p-6 sm:p-8">
          <EmailLoginForm nextPath={nextPath} portalType={portalType} />
          <p className="mt-5 text-xs leading-relaxed text-stone-500">The code expires after 15 minutes and can be used only once.</p>
        </div>
        <Link href="/portal/login" className="mt-6 inline-block text-sm font-semibold text-[#96501f] hover:underline">Choose another portal</Link>
      </div>
    </main><Footer /></>
  );
}
