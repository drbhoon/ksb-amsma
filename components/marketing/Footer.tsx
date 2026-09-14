export function Footer() {
  return (
    <footer className="amsma-footer">
      <div className="amsma-footer-inner">
        <div>
          <img src="/assets/brand/AMSMA_QuarryStrata_Option3_Reversed.svg" alt="AMSMA" width="96" height="91" className="amsma-footer-mark" />
          <p className="amsma-footer-tag">Knowledge, standards and responsible practice for the aggregate and M sand sector.</p>
        </div>
        <nav className="amsma-footer-nav" aria-label="Footer navigation">
          <Link href="/">Home</Link><Link href="/about">About</Link><Link href="/committee">Committee</Link><Link href="/membership">Membership</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link><Link href="/portal/login">Login</Link>
        </nav>
        <div className="amsma-footer-contact"><p>2C 183, Kalpataru Hills Ph2</p><p>Pokhran Road No 3</p><p>Thane 400610, Maharashtra, India</p><p><a href="mailto:info@amsma.in">info@amsma.in</a></p></div>
      </div>
      <div className="amsma-footer-legal">© 2026 AMSMA. Registered under Societies Registration Act, 1860.</div>
    </footer>
  );
}
import Link from 'next/link';
