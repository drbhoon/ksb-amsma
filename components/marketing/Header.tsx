import Link from 'next/link';

const NAV_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/committee', label: 'Committee' },
  { href: '/publications', label: 'Publications' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/events', label: 'Events' },
  { href: '/membership', label: 'Membership' },
];

export function Header() {
  return (
    <>
      {/* Utility bar */}
      <div className="bg-stone-950 text-stone-300 text-xs">
        <div className="container-x flex flex-col md:flex-row justify-between items-center py-2 gap-1">
          <span className="flex items-center gap-2">
            <span
              className="inline-block w-[14px] h-[10px]"
              style={{
                background:
                  'linear-gradient(to bottom, #FF9933 33%, #fff 33%, #fff 66%, #138808 66%)',
              }}
            />
            Registered in Maharashtra · A National Body
          </span>
          <div className="flex gap-5">
            <Link href="/admin" className="hover:text-amber-light transition-colors">
              Member Login
            </Link>
            <Link href="/#newsletter" className="hover:text-amber-light transition-colors">
              Newsletter
            </Link>
            <span>EN | हिंदी</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className="bg-white border-b border-black/5 sticky top-0 z-50 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="container-x flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-3">
            <LogoMark />
            <div className="flex flex-col leading-tight">
              <span className="font-display font-extrabold text-xl tracking-tight">AMSMA</span>
              <span className="text-[0.65rem] text-stone-500 uppercase tracking-[0.15em] mt-0.5">
                Aggregate Manufacturers &amp; Suppliers
              </span>
            </div>
          </Link>

          <nav className="hidden lg:block">
            <ul className="flex gap-9">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-stone-800 font-medium text-[0.95rem] py-2 relative
                               hover:text-amber transition-colors
                               after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0
                               after:h-[2px] after:bg-amber after:scale-x-0 after:origin-left
                               after:transition-transform hover:after:scale-x-100"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <Link href="/membership/apply" className="btn-primary hidden sm:inline-flex">
            Join AMSMA
          </Link>
        </div>
      </header>
    </>
  );
}

function LogoMark() {
  return (
    <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-stone-900 to-stone-700 relative overflow-hidden flex items-center justify-center">
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background: `
            radial-gradient(circle at 30% 30%, #e8a838 3px, transparent 4px),
            radial-gradient(circle at 70% 45%, #d1d5db 4px, transparent 5px),
            radial-gradient(circle at 40% 70%, #d97b30 3px, transparent 4px),
            radial-gradient(circle at 75% 75%, #f5f4f0 2px, transparent 3px)
          `,
        }}
      />
    </div>
  );
}
