'use client';

import Link from 'next/link';
import { useState } from 'react';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/#responsible-extraction', label: 'Our Work' },
  { href: '/committee', label: 'Committee' },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="amsma-header">
      <div className="amsma-header-inner">
        <Link href="/" className="amsma-brand" aria-label="AMSMA home">
          <img src="/assets/brand/AMSMA_QuarryStrata_Option3_Primary.svg" alt="" className="amsma-brand-symbol" width="96" height="91" />
          <span className="amsma-brand-lockup">
            <span className="amsma-brand-word">AMSMA</span>
            <span className="amsma-brand-name">Aggregate &amp; M-Sand<br />Manufacturers Association</span>
            <span className="amsma-brand-est">Est. 2024</span>
          </span>
        </Link>
        <button type="button" className="amsma-menu-toggle" aria-label={open ? 'Close main menu' : 'Open main menu'} aria-expanded={open} aria-controls="amsma-navigation" onClick={() => setOpen((value) => !value)}>
          <span>Menu</span><span className="amsma-menu-icon" aria-hidden="true" />
        </button>
        <nav id="amsma-navigation" className={`amsma-nav ${open ? 'is-open' : ''}`} aria-label="Main navigation">
          {NAV_LINKS.map((link) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}</Link>)}
          <Link href="/membership" className="amsma-nav-cta" onClick={() => setOpen(false)}>Membership</Link>
        </nav>
      </div>
    </header>
  );
}
