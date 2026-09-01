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
    <div className="ll-section ll-alt min-h-[60vh]">
      <div className="ll-section-inner max-w-3xl py-16 text-center">
        <div className="ll-kicker">{phase}</div>
        <h1 className="ll-heading mb-5">{title}</h1>
        <p className="leading-relaxed mb-10">{blurb}</p>
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
