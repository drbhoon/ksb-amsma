import Link from 'next/link';
import { TIERS_LIST, formatInr } from '@/config/membership';

export const metadata = { title: 'Membership', description: 'AMSMA membership categories, benefits, eligibility, annual subscriptions and application process.' };

const sharedBenefits = [
  {
    number: '01',
    title: 'Representation and support',
    items: [
      ['Policy voice', 'Help shape AMSMA positions on mining policy, clearances, royalties, legislation and infrastructure standards.'],
      ['Grievance redressal', 'Use AMSMA\'s collective voice for regulatory, compliance, transport and logistics issues.'],
    ],
  },
  {
    number: '02',
    title: 'Knowledge and capability',
    items: [
      ['Technical access', 'Receive research, technical papers and practical guidance for efficient and responsible operations.'],
      ['Training and briefings', 'Access workshops, professional learning and a monthly briefing on policy, technology and events.'],
    ],
  },
  {
    number: '03',
    title: 'Standards and influence',
    items: [
      ['Standards development', 'Take part in the review of AMSMA conduct codes, quality benchmarks and ethical standards.'],
      ['Industry credibility', 'Help build common practices that strengthen confidence among regulators, customers and financiers.'],
    ],
  },
  {
    number: '04',
    title: 'Network and engagement',
    items: [
      ['Peer network', 'Connect with producers, equipment makers, consultants, researchers and policymakers through the member network and Annual Convention.'],
      ['Global engagement', 'Join available knowledge exchanges, benchmark studies and delegation opportunities with international industry bodies.'],
    ],
  },
] as const;

const categoryBenefits = [
  {
    title: 'Ordinary Member (Large Capacity)',
    fee: '₹50,000 / year',
    eligibility: 'For businesses with crushing capacity above 1 lakh MT per month.',
    highlights: ['Two votes in General Body meetings', 'Priority consideration for technical committees, working groups and task forces', 'Featured directory and website listing with company logo and operating region'],
    details: ['Eligibility for nomination to the Managing Committee, subject to the Rules', 'Benefits for two nominated representatives: a principal and an alternate', 'Direct Secretariat access for policy issues that affect large-scale operations'],
  },
  {
    title: 'Ordinary Member',
    fee: '₹25,000 / year',
    eligibility: 'For businesses with crushing capacity between 50,000 and 1 lakh MT per month.',
    highlights: ['One vote in General Body meetings', 'Standard listing in the AMSMA member directory', 'Eligibility for nomination to the Managing Committee, subject to the Rules'],
    details: ['Benefits for two nominated representatives: a principal and an alternate'],
  },
  {
    title: 'Associate Member',
    fee: '₹50,000 / year',
    eligibility: 'For consultants, equipment suppliers, transporters and individuals connected with the industry.',
    highlights: ['One vote in General Body meetings', 'Business development access through the directory, Convention and technical committees', 'Priority consideration for event, publication and technical-paper sponsorships'],
    details: ['Opportunities to share case studies and technical experience through AMSMA channels', 'The only membership category open to individual professionals'],
  },
  {
    title: 'Institutional / Educational Member',
    fee: '₹35,000 / year',
    eligibility: 'For research bodies, industry chambers, academic institutions and educational organisations.',
    highlights: ['One vote in General Body meetings', 'Joint research opportunities with AMSMA and its industry members', 'Student pathways for internships, industry projects and campus programmes'],
    details: ['Opportunities to contribute to AMSMA technical publications and conference proceedings', 'Faculty and researcher access to industry practitioner networks'],
  },
] as const;

export default function MembershipPage() {
  return <>
    <header className="ll-page-hero"><div className="ll-page-hero-inner"><p className="ll-eyebrow">Membership</p><h1 className="ll-title">Join a community shaping India&apos;s aggregate industry.</h1><p className="ll-lede">Membership is open to eligible businesses, institutions and individuals engaged in the aggregate and M sand sector. Categories, eligibility and subscriptions are governed by Rule 4 of the Association&apos;s Rules &amp; Regulations.</p></div></header>

    <section className="ll-section ll-alt"><div className="ll-section-inner"><p className="ll-kicker">Membership categories</p><h2 className="ll-heading">Choose the category that fits.</h2><div className="grid gap-4 mt-8 md:grid-cols-2">{TIERS_LIST.map(tier => <article className="flex flex-col border border-black/20 bg-[#f2ede1] p-6" key={tier.id}><p className="ll-kicker">{tier.category}</p><h3 className="text-2xl font-bold leading-tight">{tier.label}</h3><p className="my-3 mb-6">{tier.eligibility}</p><div className="mt-auto border-t border-black/20 pt-4 text-3xl font-bold">{formatInr(tier.annualFeeRupees)} <span className="font-sans text-xs font-semibold text-black/60">/ year</span></div><p className="mt-2 font-sans text-xs font-semibold text-black/60">Voting weightage: {tier.votingWeightage} · {tier.allowsIndividuals ? 'Individuals eligible' : 'Corporate bodies only'}</p></article>)}</div>
      <div className="mx-auto mt-8 max-w-3xl text-center"><Link className="ll-button ll-button-solid" href="/membership/apply">Apply for Membership</Link><p className="mt-4 text-sm">Applications require a proposer and seconder and are reviewed by the Managing Committee. Payment is collected only after approval.</p></div>
    </div></section>

    <section className="ll-section"><div className="ll-section-inner"><div className="max-w-3xl"><p className="ll-kicker">Why join AMSMA?</p><h2 className="ll-heading">Practical value for every member.</h2><p className="mt-4 text-lg">Every approved member receives the core benefits below. Category-specific benefits are shown in the next section.</p></div><div className="mt-8 grid gap-px border border-black/20 bg-black/20 md:grid-cols-2">{sharedBenefits.map(benefit => <article className="bg-[#f2ede1] p-6 md:p-8" key={benefit.number}><div className="flex items-start gap-4"><span className="ll-kicker mt-1 shrink-0">{benefit.number}</span><div><h3 className="text-2xl font-bold">{benefit.title}</h3>{benefit.items.map(item => <div className="mt-5 border-t border-black/15 pt-4" key={item[0]}><h4 className="font-sans text-sm font-bold uppercase tracking-[0.08em] text-[#96501f]">{item[0]}</h4><p className="mt-2">{item[1]}</p></div>)}</div></div></article>)}</div></div></section>

    <section className="ll-section ll-alt"><div className="ll-section-inner"><div className="max-w-3xl"><p className="ll-kicker">Category-specific benefits</p><h2 className="ll-heading">See what each membership includes.</h2><p className="mt-4 text-lg">Select a category to see its full benefits. These are in addition to the benefits for all members.</p></div><div className="mt-8 grid gap-4 lg:grid-cols-2">{categoryBenefits.map((category, index) => <details className="group self-start border border-black/20 bg-[#f2ede1]" key={category.title} open={index === 0}><summary className="flex min-h-28 cursor-pointer list-none items-center justify-between gap-4 p-6 [&::-webkit-details-marker]:hidden"><div><p className="ll-kicker">{category.fee}</p><h3 className="text-xl font-bold leading-tight md:text-2xl">{category.title}</h3></div><span className="relative h-8 w-8 shrink-0 rounded-full border border-black/30" aria-hidden="true"><span className="absolute left-1/2 top-1/2 h-px w-3 -translate-x-1/2 -translate-y-1/2 bg-current"/><span className="absolute left-1/2 top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-current transition-transform group-open:rotate-90"/></span></summary><div className="border-t border-black/20 px-6 pb-6 pt-5"><p className="font-bold">{category.eligibility}</p><ul className="mt-5 space-y-3">{[...category.highlights, ...category.details].map(item => <li className="flex gap-3" key={item}><span className="mt-[0.65em] h-1.5 w-1.5 shrink-0 rounded-full bg-[#96501f]"/><span>{item}</span></li>)}</ul></div></details>)}</div><p className="mt-6 max-w-4xl text-sm text-black/65">Benefits and programmes are subject to the Association&apos;s Rules, approval requirements, programme schedules and availability.</p>
      <aside className="mt-10 border border-black/20 bg-[#f2ede1] p-6 md:p-8"><h3 className="text-xl font-bold">How we use application data</h3><p className="mt-3">The application asks for identity, contact, organisation, PAN, supporting-document, proposer and seconder details. AMSMA uses this information only to assess and process membership, communicate with the applicant, collect an approved subscription and maintain membership records.</p><p className="mt-3">You must give clear consent before you submit the form. Read the <Link href="/privacy">Privacy and Data Retention Notice</Link> before you continue.</p></aside>
    </div></section>

    <section className="ll-section"><div className="ll-section-inner"><p className="ll-kicker">How it works</p><h2 className="ll-heading">Four steps to active membership.</h2><div className="grid gap-4 mt-8 md:grid-cols-2"><Stage number="01" title="Submit the application">Provide the category, organisation details, PAN, address, authorised signatory, a company-proof link, and two existing members as proposer and seconder.</Stage><Stage number="02" title="Committee review">The Managing Committee reviews the application through secure links. Admission requires the required committee majority.</Stage><Stage number="03" title="Pay after approval">Approved applicants receive a secure payment link for the correct annual subscription. The link is valid for 14 days.</Stage><Stage number="04" title="Activate membership">After verified payment, the applicant is entered in the Register of Members and receives an AMSMA member number.</Stage></div></div></section>
    <section className="ll-section ll-dark"><div className="ll-section-inner ll-content-grid"><div><p className="ll-eyebrow">Ready to apply?</p><h2 className="ll-heading">Prepare the required details.</h2></div><div className="ll-prose"><p>Have the organisation&apos;s registration details, PAN, registered address, signatory information and a shareable company-proof document link ready.</p><p>You will also need the names and email addresses of two different existing committee members who will act as proposer and seconder.</p><div className="ll-button-row"><Link className="ll-button ll-button-solid" href="/membership/apply">Start Application</Link></div></div></div></section>
  </>;
}

function Stage({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return <article className="flex gap-4 border-t border-black/20 bg-[#f2ede1] p-5"><span className="ll-kicker shrink-0">{number}</span><div><h3 className="text-xl font-bold">{title}</h3><p className="mt-2">{children}</p></div></article>;
}
