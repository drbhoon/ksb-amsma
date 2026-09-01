const WEBSITE = 'https://drbhoon.github.io/ksb-amsma';

export function Footer() {
  return (
    <footer className="amsma-footer">
      <div className="amsma-footer-inner">
        <div>
          <img src="/assets/brand/AMSMA_QuarryStrata_Option3_Reversed.svg" alt="AMSMA" width="96" height="91" className="amsma-footer-mark" />
          <p className="amsma-footer-tag">Knowledge, standards and responsible practice for the aggregate and M sand sector.</p>
        </div>
        <nav className="amsma-footer-nav" aria-label="Footer navigation">
          <a href={`${WEBSITE}/`}>Home</a><a href={`${WEBSITE}/about/`}>About</a><a href={`${WEBSITE}/#responsible-extraction`}>Our Work</a><a href={`${WEBSITE}/committee/`}>Committee</a><a href="/membership">Membership</a><a href={`${WEBSITE}/contact/`}>Contact</a><a href={`${WEBSITE}/privacy/`}>Privacy</a>
        </nav>
        <div className="amsma-footer-contact"><p><a href="mailto:info@amsma.in">info@amsma.in</a></p><p>Thane, Maharashtra</p></div>
      </div>
      <div className="amsma-footer-legal">Aggregate &amp; M sand Manufacturers Association · India</div>
    </footer>
  );
}
