'use client';

import Link from 'next/link';
import { useState } from 'react';

const WEBSITE = 'https://drbhoon.github.io/ksb-amsma';
const NAV_LINKS = [
  { href: `${WEBSITE}/`, label: 'Home' },
  { href: `${WEBSITE}/about/`, label: 'About' },
  { href: `${WEBSITE}/#responsible-extraction`, label: 'Our Work' },
  { href: `${WEBSITE}/committee/`, label: 'Committee' },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="amsma-header">
      <div className="amsma-header-inner">
        <a href={`${WEBSITE}/`} className="amsma-brand" aria-label="AMSMA home">
          <img src="/assets/brand/AMSMA_QuarryStrata_Option3_Primary.svg" alt="" className="amsma-brand-symbol" width="96" height="91" />
          <span className="amsma-brand-lockup">
            <span className="amsma-brand-word">AMSMA</span>
            <span className="amsma-brand-name">Aggregate &amp; M-Sand<br />Manufacturers Association</span>
            <span className="amsma-brand-est">Est. 2024</span>
          </span>
        </a>
        <button type="button" className="amsma-menu-toggle" aria-expanded={open} aria-controls="amsma-navigation" onClick={() => setOpen((value) => !value)}>
          <span>Menu</span><span className="amsma-menu-icon" aria-hidden="true" />
        </button>
        <nav id="amsma-navigation" className={`amsma-nav ${open ? 'is-open' : ''}`} aria-label="Main navigation">
          {NAV_LINKS.map((link) => <a key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}</a>)}
          <Link href="/membership" className="amsma-nav-cta" onClick={() => setOpen(false)}>Membership</Link>
        </nav>
      </div>
    </header>
  );
}
