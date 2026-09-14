import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';

export const metadata = { title: 'Vote Recorded' };

type Props = { searchParams: Promise<{ d?: string; no?: string }> };

export default async function ReviewSuccessPage({ searchParams }: Props) {
  const query = await searchParams;
  const isApproval = query.d === 'APPROVE';
  const no = query.no || '';
  return (
    <><Header /><main className="min-h-screen membership-surface flex items-center justify-center py-16">
      <div className="container-x max-w-lg text-center">
        <div className={`w-16 h-16 flex items-center justify-center mx-auto mb-6 ${isApproval ? 'bg-emerald-700' : 'bg-red-700'}`}>
          <span className="text-white text-3xl">{isApproval ? '✓' : '✕'}</span>
        </div>
        <h1 className="font-display font-bold text-3xl tracking-tight mb-4">
          Decision recorded.
        </h1>
        <p className="text-stone-700 mb-6">
          Your decision to <strong>{isApproval ? 'approve' : 'reject'}</strong> application{' '}
          <strong>{no}</strong> has been recorded.
        </p>
        <p className="text-sm text-stone-500">
          Sponsor endorsements count toward the committee quorum. The applicant receives the final result after admin confirmation.
        </p>
        <a href="/portal" className="btn-primary mt-8 inline-flex">Return to dashboard</a>
      </div>
    </main><Footer /></>
  );
}
