const MEMBERS = [
  ['ramesh-murlidhar-bhatawdekar.jpg','Dr. Ramesh M. Bhatawdekar','President · Managing Committee member'],
  ['trilok-nath-singh.jpg','Dr. Trilok Nath Singh','Managing Committee member'],
  ['brv-susheel-kumar.jpg','Mr. B.R.V. Susheel Kumar','Managing Committee member'],
  ['karnail-singh-bhoon.jpg','Dr. Karnail Singh Bhoon','Managing Committee member'],
  ['anil-kumar-banchhor.jpg','Mr. Anil Kumar Banchhor','Managing Committee member'],
  ['rahul-vasant-ralegaonkar.jpg','Prof. Rahul V. Ralegaonkar','Managing Committee member'],
  ['srikant-annavarapu.jpg','Mr. Srikant Annavarapu','Managing Committee member'],
  ['rudra-mohan-sahu.jpg','Mr. Rudra Mohan Sahu','Managing Committee member'],
];

export const metadata = { title: 'Managing Committee', description: 'Meet the Managing Committee that guides AMSMA.' };

export default function CommitteePage() {
  return <><header className="ll-page-hero ll-page-hero--committee"><div className="ll-page-hero-inner"><p className="ll-eyebrow">Governance</p><h1 className="ll-title">The Managing Committee.</h1><p className="ll-lede"><span className="block">Flag-bearers of AMSMA&apos;s shared purpose, the Managing Committee guides the Association&apos;s direction.</span><span className="block mt-1">Together, its members steward responsible practice, knowledge exchange and long-term sector progress.</span></p></div></header><section className="ll-section ll-alt" aria-label="Managing Committee members"><div className="ll-section-inner" data-reveal><p className="ll-kicker">Formation resolution · 26 May 2026</p><div className="ll-committee-grid">{MEMBERS.map(([photo,name,role]) => <article className="ll-person" data-reveal key={name}><img className="ll-avatar" src={`/assets/committee/${photo}`} alt="" width="600" height="600" loading="lazy" /><h2 className="ll-heading">{name}</h2><p className="ll-role">{role}</p></article>)}</div></div></section></>;
}
