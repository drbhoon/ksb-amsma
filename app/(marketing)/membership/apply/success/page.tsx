export const metadata = { title: 'Application Received' };

type Props = { searchParams: Promise<{ no?: string }> };

export default async function ApplySuccessPage({ searchParams }: Props) {
  const query = await searchParams;
  const no = query.no || 'AMSMA-XXXX-XXXX';
  return (
    <section className="membership-surface py-24 min-h-[60vh]">
      <div className="container-x max-w-2xl text-center">
        <div className="w-16 h-16 bg-amber flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h1 className="font-display font-bold text-3xl md:text-4xl tracking-tight mb-4">
          Application received.
        </h1>
        <p className="text-lg text-stone-700 mb-8">
          Thank you. Your application is now being reviewed by the Managing Committee.
        </p>
        <div className="membership-card p-6 mb-8 text-left">
          <div className="text-xs uppercase tracking-[0.1em] text-stone-500 mb-1">Application Number</div>
          <div className="font-display font-bold text-2xl mb-4">{no}</div>
          <p className="text-sm text-stone-700">
            A confirmation email has been sent to you. Please quote this application number in any future correspondence.
            The proposer and seconder will review the application first. The 48-hour committee review starts after both endorsements are recorded.
          </p>
        </div>
        <Link href="/" className="btn-primary">Return to Homepage</Link>
      </div>
    </section>
  );
}
import Link from 'next/link';
