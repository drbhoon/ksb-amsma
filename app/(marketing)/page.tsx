import Link from 'next/link';
import { NewsletterForm } from '@/components/forms/NewsletterForm';
import { COMMITTEE_MEMBERS } from '@/config/committee-members';

const OBJECTIVES = [
  { num: '01', title: 'Knowledge & Research', body: 'Advance industry science through peer-reviewed research, technical papers, and best-practice dissemination across academic and industrial partners.' },
  { num: '02', title: 'Policy & Advocacy',    body: 'Represent the industry in matters of mining policy, environmental clearance, royalty structures, and infrastructure standards with central and state governments.' },
  { num: '03', title: 'Sustainability',       body: 'Champion responsible quarrying, dust and water management, land restoration, and low-carbon aggregate practices for future generations.' },
  { num: '04', title: 'Standards & Ethics',   body: 'Establish and maintain codes of conduct, quality benchmarks, and ethical standards that raise the credibility of the entire sector.' },
  { num: '05', title: 'Capacity Building',    body: 'Conduct seminars, workshops, training programs and certifications for engineers, geologists, plant operators and industry professionals.' },
  { num: '06', title: 'Global Engagement',    body: 'Collaborate with international bodies including GAIN and UEPG to share knowledge, benchmark practice and represent India abroad.' },
];

export default function HomePage() {
  return (
    <>
      <Hero />
      <Objectives />
      <Committee />
      <NewsletterSection />
    </>
  );
}

function Hero() {
  return (
    <section
      className="relative text-white py-24 md:py-32 overflow-hidden"
      style={{
        background: `linear-gradient(135deg, rgba(15,17,20,0.85) 0%, rgba(26,29,36,0.75) 60%, rgba(217,123,48,0.4) 100%), #1a1d24`,
      }}
    >
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage: `
            radial-gradient(circle at 15% 25%, rgba(255,255,255,0.04) 2px, transparent 3px),
            radial-gradient(circle at 45% 65%, rgba(255,255,255,0.03) 3px, transparent 4px),
            radial-gradient(circle at 75% 35%, rgba(232,168,56,0.08) 4px, transparent 6px),
            radial-gradient(circle at 85% 85%, rgba(255,255,255,0.03) 2px, transparent 3px)`,
          backgroundSize: '200px 200px',
        }}
      />
      <div className="container-x relative z-10">
        <div className="max-w-3xl">
          <span className="inline-block bg-amber/15 text-amber-light border border-amber/30 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-[0.08em] mb-6">
            India&apos;s National Voice for the Aggregate Industry
          </span>
          <h1 className="font-display font-bold text-4xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight mb-6">
            Building the foundations of a{' '}
            <em className="text-amber-light not-italic">developed India</em>, one aggregate at a time.
          </h1>
          <p className="text-lg md:text-xl leading-relaxed text-white/85 max-w-2xl mb-10">
            AMSMA unites manufacturers of aggregate and M sand, alongside researchers and policy-makers,
            behind a single mission — advancing the industry through knowledge, sustainability, and responsible practice.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/membership" className="btn-accent">Become a Member</Link>
            <Link href="#objectives" className="btn-outline">Explore Our Work</Link>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-10 border-t border-white/10 relative z-10">
          <Stat num="8"       label="Founding Members" />
          <Stat num="15+"     label="States Represented" />
          <Stat num="3.5 Bn t" label="Annual Industry Output" />
          <Stat num="2026"    label="Year Founded" />
        </div>
      </div>
    </section>
  );
}

function Stat({ num, label }: { num: string; label: string }) {
  return (
    <div>
      <div className="font-display font-bold text-4xl leading-none">{num}</div>
      <div className="text-sm text-white/70 mt-2 uppercase tracking-[0.08em]">{label}</div>
    </div>
  );
}

function Objectives() {
  return (
    <section className="bg-white py-24" id="objectives">
      <div className="container-x">
        <div className="max-w-3xl mb-16">
          <span className="section-eyebrow">Our Objectives</span>
          <h2 className="section-title mt-4">
            A charter grounded in public benefit, sustainability and industry excellence.
          </h2>
          <p className="mt-5 text-lg prose-body">
            AMSMA works across six focus areas to strengthen the aggregate industry&apos;s contribution
            to India&apos;s infrastructure ambitions while safeguarding communities and ecosystems.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {OBJECTIVES.map((obj) => (
            <div
              key={obj.num}
              className="group bg-stone-50 border border-black/5 rounded-xl p-8 transition-all
                         hover:bg-white hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)]
                         relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-amber scale-x-0 origin-left
                              transition-transform duration-500 group-hover:scale-x-100" />
              <span className="font-display font-extrabold text-2xl text-amber block mb-4">{obj.num}</span>
              <h3 className="font-display font-semibold text-xl mb-3 tracking-tight">{obj.title}</h3>
              <p className="prose-body text-[0.95rem]">{obj.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Committee() {
  return (
    <section className="bg-stone-50 py-24" id="committee">
      <div className="container-x">
        <div className="max-w-3xl mb-16">
          <span className="section-eyebrow">Managing Committee</span>
          <h2 className="section-title mt-4">Distinguished leaders shaping the aggregate industry&apos;s future.</h2>
          <p className="mt-5 text-lg prose-body">
            Our founding committee brings together academic authority, industry experience, and
            technical expertise from across India.
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {COMMITTEE_MEMBERS.map((m) => (
            <div
              key={m.slug}
              className="bg-white rounded-xl overflow-hidden border border-black/5 transition-all
                         hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]"
            >
              <div className="aspect-square bg-gradient-to-br from-stone-700 to-stone-900 relative
                              flex items-center justify-center font-display text-5xl font-bold text-white/40">
                {m.initials}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(circle at 20% 30%, rgba(232,168,56,0.15) 0%, transparent 40%),
                                 radial-gradient(circle at 80% 70%, rgba(217,123,48,0.1) 0%, transparent 40%)`,
                  }}
                />
              </div>
              <div className="p-5">
                <div className="text-xs text-amber font-semibold uppercase tracking-[0.1em] mb-2">{m.role}</div>
                <div className="font-display font-semibold text-[1.05rem] leading-tight mb-1">{m.name}</div>
                <div className="text-sm text-stone-500">{m.title}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function NewsletterSection() {
  return (
    <section className="bg-stone-900 text-white py-24" id="newsletter">
      <div className="container-x">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block text-sm font-semibold uppercase tracking-[0.12em] text-amber-light
                             pl-12 relative before:content-[''] before:absolute before:left-0 before:top-1/2
                             before:w-8 before:h-[2px] before:bg-amber-light">Stay Informed</span>
            <h2 className="font-display font-bold text-3xl md:text-4xl leading-tight tracking-tight mt-4">
              The AMSMA monthly briefing.
            </h2>
            <p className="mt-4 text-white/75 text-lg">
              Policy updates, technical papers, event announcements and industry data —
              curated by the AMSMA Secretariat, delivered to your inbox monthly.
            </p>
          </div>
          <div>
            <NewsletterForm />
            <p className="mt-3 text-xs text-white/50">
              No spam. Unsubscribe anytime. We never share your email.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
