import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <section className="ll-hero" aria-labelledby="home-title">
        <div className="ll-hero-media">
          <video autoPlay muted loop playsInline preload="metadata" poster="/assets/quarry-nesting-habitat-poster.jpg" aria-hidden="true" tabIndex={-1}>
            <source src="/assets/quarry-nesting-habitat-web.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="ll-hero-scrim" />
        <div className="ll-hero-inner">
          <p className="ll-eyebrow">Aggregate &amp; M sand Manufacturers Association</p>
          <h1 id="home-title" className="ll-title">Responsible quarrying starts with planning, practice and stewardship.</h1>
          <p className="ll-lede">AMSMA is set up to advance knowledge, standards and environmental responsibility across India&apos;s aggregate and M sand sector.</p>
          <div className="ll-button-row"><Link className="ll-button ll-button-solid" href="/membership">Membership</Link><a className="ll-button ll-button-ghost" href="#priorities">Explore our work</a></div>
        </div>
      </section>

      <section className="ll-section ll-alt" id="priorities" aria-labelledby="priorities-title">
        <div className="ll-section-inner">
          <p className="ll-eyebrow">Our work and priorities</p><h2 id="priorities-title" className="ll-heading">What AMSMA advances.</h2>
          <p className="ll-section-intro">The Association&apos;s governing objects connect sector development with public benefit and provide a clear framework for its programmes, partnerships and advocacy.</p>
          <div className="ll-work-grid">
            <WorkCard image="/assets/living-process-extract.jpg" alt="Excavator feeding rock into a hopper at a quarry" title="Responsible practice">Encourage responsible quarrying, environmental protection and sound professional conduct.</WorkCard>
            <WorkCard image="/assets/process-conveyor.jpg" alt="Conveyor carrying aggregate" title="Knowledge and standards">Support technical exchange, research, education, quality and ethical practice.</WorkCard>
            <WorkCard image="/assets/quarry-lagoon.jpg" alt="Water-filled quarry below vegetated rock faces" title="Environmental stewardship">Advance conservation and site-aware management within the Association&apos;s public-benefit purpose.</WorkCard>
          </div>
        </div>
      </section>

      <section className="ll-section" aria-labelledby="membership-title">
        <div className="ll-section-inner ll-content-grid">
          <div><p className="ll-kicker">Membership</p><h2 id="membership-title" className="ll-heading">A shared platform for sector progress.</h2></div>
          <div className="ll-prose"><p>AMSMA membership connects eligible aggregate businesses, consultants, equipment suppliers, transporters, research bodies and educational institutions.</p><p>Explore the four categories, annual subscriptions and the committee-led application process. Payment is collected only after an application is approved.</p><div className="ll-button-row"><Link className="ll-button ll-button-solid" href="/membership">Explore Membership</Link></div></div>
        </div>
      </section>

      <section className="ll-section ll-dark" id="responsible-extraction" aria-labelledby="process-title">
        <div className="ll-section-inner"><p className="ll-eyebrow">Responsible extraction</p><h2 id="process-title" className="ll-heading">From quarry face to stockpile.</h2><p className="ll-section-intro">Modern aggregate production follows a connected sequence of extraction, crushing, conveying, screening and stockpiling.</p>
          <div className="ll-process-grid">
            <ProcessStep image="/assets/living-process-extract.jpg" alt="Excavator feeding rock into a hopper" number="Step 01" title="Extract">Machinery removes and loads rock at the quarry face.</ProcessStep>
            <ProcessStep image="/assets/living-process-crush.jpg" alt="Angular rocks between heavy metal machine components" number="Step 02" title="Crush">Crushing equipment reduces the extracted rock.</ProcessStep>
            <ProcessStep image="/assets/living-process-screen.jpg" alt="Rocks resting on woven metal screen mesh" number="Step 03" title="Convey and screen">Conveyors move material through visible screening stages.</ProcessStep>
            <ProcessStep image="/assets/process-stockpile.jpg" alt="Finished aggregate stockpile below a conveyor" number="Step 04" title="Stockpile">Finished aggregate is placed in separate stockpiles.</ProcessStep>
          </div>
        </div>
      </section>

      <section className="ll-section" aria-labelledby="landscapes-title">
        <div className="ll-section-inner ll-habitat-grid"><img src="/assets/nesting-bank.jpg" alt="Exposed sandy quarry bank with nesting burrows" width="1280" height="720" loading="lazy" /><div className="ll-habitat-copy"><p className="ll-eyebrow">Living landscapes</p><h2 id="landscapes-title" className="ll-heading">Stewardship depends on the site.</h2><p>Some quarry landforms can provide exposed banks, water bodies or vegetated ledges that wildlife can use. Ecological value depends on local conditions, species, operations, planning and long-term management.</p><p className="ll-qualifier">Effective stewardship begins with site-specific ecological assessment, responsible operating plans and long-term management.</p></div></div>
      </section>
    </>
  );
}

function WorkCard({ image, alt, title, children }: { image: string; alt: string; title: string; children: React.ReactNode }) {
  return <article className="ll-work-card"><img src={image} alt={alt} width="1280" height="720" loading="lazy" /><div className="ll-work-copy"><h3 className="ll-subheading">{title}</h3><p>{children}</p></div></article>;
}

function ProcessStep({ image, alt, number, title, children }: { image: string; alt: string; number: string; title: string; children: React.ReactNode }) {
  return <article className="ll-step"><img src={image} alt={alt} width="1280" height="720" loading="lazy" /><span className="ll-step-num">{number}</span><h3 className="ll-subheading">{title}</h3><p>{children}</p></article>;
}
