import Link from 'next/link';

export function AdminPortalNav({ current }: { current: 'applications' | 'resources' }) {
  const links = [
    { href: '/portal/admin', label: 'Membership applications', key: 'applications' },
    { href: '/portal/admin/resources', label: 'Resource documents', key: 'resources' },
  ] as const;

  return (
    <nav className="mt-6 flex flex-wrap gap-2" aria-label="Admin sections">
      {links.map((link) => (
        <Link
          key={link.key}
          href={link.href}
          aria-current={current === link.key ? 'page' : undefined}
          className={current === link.key
            ? 'rounded-full bg-[#273d33] px-5 py-2.5 text-sm font-bold text-white'
            : 'rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-bold text-[#273d33] transition hover:border-[#c9ad84] hover:bg-[#f8f2e7]'}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
