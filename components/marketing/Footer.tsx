import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-stone-950 text-white/70 pt-20 pb-8">
      <div className="container-x">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-10 mb-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-stone-800 to-stone-700" />
              <div className="flex flex-col leading-tight">
                <span className="font-display font-extrabold text-xl text-white tracking-tight">
                  AMSMA
                </span>
                <span className="text-[0.65rem] text-white/50 uppercase tracking-[0.15em] mt-0.5">
                  Aggregate Manufacturers &amp; Suppliers
                </span>
              </div>
            </div>
            <p className="text-[0.95rem] leading-relaxed max-w-xs">
              The national voice of India&apos;s aggregate industry — advancing knowledge,
              sustainability, and responsible practice for the infrastructure of tomorrow.
            </p>
          </div>

          <FooterCol title="Association">
            <FooterLink href="/about">About Us</FooterLink>
            <FooterLink href="/committee">Committee</FooterLink>
            <FooterLink href="/governance">Governance</FooterLink>
            <FooterLink href="/annual-report">Annual Report</FooterLink>
          </FooterCol>

          <FooterCol title="Resources">
            <FooterLink href="/publications">Publications</FooterLink>
            <FooterLink href="/events">Events</FooterLink>
            <FooterLink href="/gallery">Gallery</FooterLink>
            <FooterLink href="/press">Press &amp; Media</FooterLink>
          </FooterCol>

          <FooterCol title="Contact">
            <li>2C 183, Kalpataru Hills Ph2</li>
            <li>Pokhran Road No 3, Thane 400 610</li>
            <li>Maharashtra, India</li>
            <li className="pt-2">
              <a href="mailto:info@amsma.in" className="hover:text-amber-light transition-colors">
                info@amsma.in
              </a>
            </li>
          </FooterCol>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <div>© {new Date().getFullYear()} AMSMA. Registered under Societies Registration Act, 1860.</div>
          <div className="flex gap-3">
            <SocialLink label="LinkedIn">in</SocialLink>
            <SocialLink label="X">X</SocialLink>
            <SocialLink label="YouTube">▶</SocialLink>
            <SocialLink label="Email">✉</SocialLink>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h5 className="text-white text-sm font-semibold uppercase tracking-[0.1em] mb-5">
        {title}
      </h5>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-white/65 text-[0.9rem] hover:text-amber-light transition-colors">
        {children}
      </Link>
    </li>
  );
}

function SocialLink({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <a
      href="#"
      aria-label={label}
      className="w-9 h-9 bg-white/[0.06] rounded-lg flex items-center justify-center text-white/70
                 hover:bg-amber hover:text-stone-950 transition-all text-sm"
    >
      {children}
    </a>
  );
}
