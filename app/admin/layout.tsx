import Link from 'next/link';
import { isAdmin } from '@/lib/admin-auth';
import { logoutAction } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Administration',
  robots: { index: false, follow: false },
};

const TABS = [
  { href: '/admin/publications', label: 'Publications' },
  { href: '/admin/blog', label: 'Blog' },
  { href: '/admin/events', label: 'Events' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const signedIn = isAdmin();
  return (
    <div className="min-h-screen bg-stone-100">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-4">
          <Link href="/admin" className="font-semibold tracking-tight">
            AMSMA Administration
          </Link>
          {signedIn && (
            <>
              <nav className="flex gap-4 text-sm">
                {TABS.map((t) => (
                  <Link key={t.href} href={t.href} className="text-stone-600 hover:text-stone-900">
                    {t.label}
                  </Link>
                ))}
              </nav>
              <form action={logoutAction} className="ml-auto">
                <button type="submit" className="text-sm text-stone-500 underline hover:text-stone-800">
                  Sign out
                </button>
              </form>
            </>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
