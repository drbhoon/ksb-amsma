import Link from 'next/link';

/**
 * Placeholder for pages the header and footer already link to but which are
 * scheduled for later phases. Without these the nav 404s, which reads as a
 * broken site during testing. Replace each with real content as its phase lands.
 */
export function ComingSoon({
  title,
  phase,
  blurb,
}: {
  title: string;
  phase: string;
  blurb: string;
}) {
  return (
    <div className="bg-stone-50">
      <div className="container-x max-w-3xl py-24 text-center">
        <div className="text-xs uppercase tracking-[0.15em] text-stone-500 mb-3">{phase}</div>
        <h1 className="font-display font-bold text-4xl tracking-tight mb-5">{title}</h1>
        <p className="text-stone-700 leading-relaxed mb-10">{blurb}</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/" className="btn-primary">
            Back to home
          </Link>
          <Link href="/membership" className="btn-ghost">
            Membership
          </Link>
        </div>
      </div>
    </div>
  );
}
