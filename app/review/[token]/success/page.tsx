import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';

export const metadata = { title: 'Vote Recorded' };

type Props = { searchParams: { d?: string; no?: string } };

export default function ReviewSuccessPage({ searchParams }: Props) {
  const isApproval = searchParams.d === 'APPROVE';
  const no = searchParams.no || '';
  return (
    <><Header /><main className="min-h-screen membership-surface flex items-center justify-center py-16">
      <div className="container-x max-w-lg text-center">
        <div className={`w-16 h-16 flex items-center justify-center mx-auto mb-6 ${isApproval ? 'bg-emerald-700' : 'bg-red-700'}`}>
          <span className="text-white text-3xl">{isApproval ? '✓' : '✕'}</span>
        </div>
        <h1 className="font-display font-bold text-3xl tracking-tight mb-4">
          Vote recorded.
        </h1>
        <p className="text-stone-700 mb-6">
          Your vote to <strong>{isApproval ? 'approve' : 'reject'}</strong> application{' '}
          <strong>{no}</strong> has been recorded.
        </p>
        <p className="text-sm text-stone-500">
          The applicant will be notified automatically once the committee reaches a decision
          (2/3 majority for approval, or when approval becomes mathematically impossible).
        </p>
        <a href="https://drbhoon.github.io/ksb-amsma/" className="btn-primary mt-8 inline-flex">Close</a>
      </div>
    </main><Footer /></>
  );
}
