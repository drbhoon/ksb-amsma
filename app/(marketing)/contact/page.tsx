import Link from 'next/link';
import { ContactForm } from '@/components/forms/ContactForm';

export const metadata = { title: 'Contact AMSMA', description: 'Contact the AMSMA secretariat in Thane, Maharashtra.' };

export default function ContactPage() {
  return <>
    <header className="ll-page-hero ll-page-hero--contact"><div className="ll-page-hero-inner"><p className="ll-eyebrow">Contact AMSMA</p><h1 className="ll-title">Write to the secretariat.</h1><p className="ll-lede">Contact us with questions about the Association, its areas of work, governance or membership.</p></div></header>
    <section className="ll-section ll-alt"><div className="ll-section-inner ll-contact-layout" data-reveal>
      <div>
        <p className="ll-kicker">Contact details</p><h2 className="ll-heading">Start here.</h2>
        <p className="mt-4 max-w-xl">Messages are reviewed on working days. The Secretariat aims to reply within two working days.</p>
        <div className="ll-contact-stack">
          <article className="ll-contact-card"><span className="ll-label">Email</span><a className="text-xl" href="mailto:info@amsma.in">info@amsma.in</a></article>
          <article className="ll-contact-card"><span className="ll-label">Address</span><p>2C 183, Kalpataru Hills Ph2<br />Pokhran Road No 3<br />Thane 400610, Maharashtra, India</p><a className="mt-4 inline-flex font-semibold underline underline-offset-4" href="https://www.google.com/maps/search/?api=1&query=2C+183+Kalpataru+Hills+Ph2+Pokhran+Road+No+3+Thane+400610" target="_blank" rel="noreferrer">Open in Google Maps ↗</a></article>
        </div>
        <p className="mt-6 max-w-xl">For membership applications, review the categories and process on the <Link href="/membership">Membership page</Link> before you write to us.</p>
      </div>
      <div className="ll-contact-form-card"><p className="ll-kicker">Send an enquiry</p><h2 className="text-3xl font-bold">How can we help?</h2><p className="mb-6 mt-3">Use this form for general questions. Do not send PAN details or membership documents here.</p><ContactForm /></div>
    </div></section>
  </>;
}
