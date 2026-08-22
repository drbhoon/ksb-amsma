import Link from 'next/link';

export const metadata = { title: 'Membership Active' };

type Props = { searchParams: { no?: string; m?: string } };

export default function PaymentSuccessPage({ searchParams }: Props) {
  return (
    <div className="min-h-screen bg-stone-50 py-20">
      <div className="container-x max-w-2xl text-center">
        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h1 className="font-display font-bold text-3xl md:text-4xl tracking-tight mb-4">
          Welcome to AMSMA.
        </h1>
        <p className="text-lg text-stone-700 mb-8">
          Your payment has been received and your membership is now active.
        </p>
        <div className="bg-white rounded-lg border border-stone-200 p-6 mb-8 text-left inline-block min-w-[300px]">
          <div className="text-xs uppercase tracking-[0.1em] text-stone-500 mb-1">Member Number</div>
          <div className="font-display font-bold text-2xl mb-4">{searchParams.m || 'AMSMA-M-XXXX'}</div>
          <div className="text-xs uppercase tracking-[0.1em] text-stone-500 mb-1">Application</div>
          <div className="font-medium">{searchParams.no || '—'}</div>
        </div>
        <p className="text-sm text-stone-600 mb-8">
          A receipt has been emailed to you. A formal GST invoice will follow separately.
        </p>
        <Link href="/" className="btn-primary">Return to Homepage</Link>
      </div>
    </div>
  );
}
