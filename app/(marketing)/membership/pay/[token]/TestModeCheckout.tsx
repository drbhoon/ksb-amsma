'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  paymentToken: string;
  applicationNo: string;
  amountRupees: number;
}

/**
 * Stand-in for Razorpay checkout while payments are on hold. Activates the
 * membership directly so the rest of the flow (Member row, member number,
 * receipt email, success page) can be tested end to end.
 */
export function TestModeCheckout(props: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function activate() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/payments/test-activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentToken: props.paymentToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Test activation failed');
      router.push(
        `/membership/pay/success?no=${encodeURIComponent(props.applicationNo)}&m=${encodeURIComponent(data.memberNo)}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test activation failed');
      setLoading(false);
    }
  }

  return (
    <>
      <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg text-sm text-amber-900">
        <strong className="block mb-1">Test mode — no payment will be taken</strong>
        Razorpay is not yet connected. This button records the subscription as paid
        so the membership flow can be tested end to end. The Register of Members
        entry will carry a <code className="font-mono text-xs">TEST-</code> reference.
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{error}</div>
      )}

      <button
        onClick={activate}
        disabled={loading}
        className="btn-accent w-full py-4 text-base disabled:opacity-50"
      >
        {loading
          ? 'Recording…'
          : `Record ₹${props.amountRupees.toLocaleString('en-IN')} as paid (test mode)`}
      </button>
    </>
  );
}
