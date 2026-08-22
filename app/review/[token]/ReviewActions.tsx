'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ReviewActions({ token, applicationNo }: { token: string; applicationNo: string }) {
  const router = useRouter();
  const [comment, setComment] = useState('');
  const [pending, setPending] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [error, setError] = useState('');

  async function vote(decision: 'APPROVE' | 'REJECT') {
    if (decision === 'REJECT' && !comment.trim()) {
      setError('Please provide a brief reason when rejecting an application.');
      return;
    }
    setPending(decision);
    setError('');
    try {
      const res = await fetch(`/api/review/${token}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, comment: comment.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Vote failed');
      router.push(`/review/${token}/success?d=${decision}&no=${encodeURIComponent(applicationNo)}`);
    } catch (err) {
      setPending(null);
      setError(err instanceof Error ? err.message : 'Vote failed');
    }
  }

  return (
    <div className="pt-4 border-t border-stone-100">
      <h2 className="font-display font-semibold text-lg mb-4">Your Vote</h2>
      <label className="block mb-4">
        <span className="text-sm font-medium text-stone-700 mb-1 block">Comment (optional for approval, required for rejection)</span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Any observations or reasons…"
          className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber focus:border-amber"
        />
      </label>
      {error && <p className="text-sm text-red-700 mb-3">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => vote('APPROVE')}
          disabled={pending !== null}
          className="btn bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 px-8"
        >
          {pending === 'APPROVE' ? 'Recording…' : '✓ Approve Application'}
        </button>
        <button
          onClick={() => vote('REJECT')}
          disabled={pending !== null}
          className="btn bg-red-700 text-white hover:bg-red-800 disabled:opacity-50 px-8"
        >
          {pending === 'REJECT' ? 'Recording…' : '✕ Reject Application'}
        </button>
      </div>
    </div>
  );
}
