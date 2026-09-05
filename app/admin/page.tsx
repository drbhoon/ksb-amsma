import Link from 'next/link';
import { prisma } from '@/lib/db';
import { isAdmin, adminConfigured } from '@/lib/admin-auth';
import { loginAction } from './actions';
import { ActionForm, Field } from './ui';

export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  if (!isAdmin()) {
    return (
      <div className="mx-auto max-w-sm">
        <h1 className="mb-2 text-xl font-semibold">Sign in</h1>
        <p className="mb-6 text-sm text-stone-600">
          Administration for Publications, Blog and Events.
        </p>
        {!adminConfigured() && (
          <p className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Admin login is not configured on this deployment. Set{' '}
            <code className="font-mono text-xs">ADMIN_PASSWORD_HASH</code> and{' '}
            <code className="font-mono text-xs">SESSION_SECRET</code>, then reload.
          </p>
        )}
        <ActionForm action={loginAction} submitLabel="Sign in">
          <Field label="Admin password" name="password" type="password" required />
        </ActionForm>
      </div>
    );
  }

  const [pubs, posts, events] = await Promise.all([
    prisma.publication.count(),
    prisma.blogPost.count(),
    prisma.event.count(),
  ]);

  const cards = [
    { href: '/admin/publications', label: 'Publications', count: pubs, blurb: 'Articles, regulations, government letters and circulars.' },
    { href: '/admin/blog', label: 'Blog', count: posts, blurb: 'Posts and announcements from the Association.' },
    { href: '/admin/events', label: 'Events', count: events, blurb: 'Meets and gatherings, with an optional attachment.' },
  ];

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold">What would you like to update?</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-lg border border-stone-200 bg-white p-5 hover:border-stone-400"
          >
            <div className="flex items-baseline justify-between">
              <span className="font-semibold">{c.label}</span>
              <span className="text-sm text-stone-500">{c.count}</span>
            </div>
            <p className="mt-2 text-sm text-stone-600">{c.blurb}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
