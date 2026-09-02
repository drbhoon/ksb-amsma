import Link from 'next/link';

export const metadata = { title: 'Contact AMSMA', description: 'Contact the AMSMA secretariat in Thane, Maharashtra.' };

export default function ContactPage() {
  return <><header className="ll-page-hero"><div className="ll-page-hero-inner"><p className="ll-eyebrow">Contact AMSMA</p><h1 className="ll-title">Write to the secretariat.</h1><p className="ll-lede">Contact us with questions about the Association, its areas of work, governance or membership.</p></div></header><section className="ll-section ll-alt"><div className="ll-section-inner"><p className="ll-kicker">Contact details</p><h2 className="ll-heading">Start here.</h2><div className="ll-contact-panel"><article className="ll-contact-card"><span className="ll-label">Email</span><a className="text-xl" href="mailto:info@amsma.in">info@amsma.in</a></article><article className="ll-contact-card"><span className="ll-label">Address</span><p>2C 183, Kalpataru Hills Ph2<br />Pokhran Road No 3, Thane 400 610<br />Maharashtra, India</p></article></div><p className="mt-6 max-w-2xl">For membership applications, review the categories and process on the <Link href="/membership">Membership page</Link> before you write to us.</p></div></section></>;
}
