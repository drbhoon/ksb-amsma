'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ReviewActions({ token, applicationNo }: { token: string; applicationNo: string; phase: 'SPONSOR' | 'COMMITTEE' }) {
  const router = useRouter();
  const [comment, setComment] = useState('');
  const [pending, setPending] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [error, setError] = useState('');

  async function vote(decision: 'APPROVE' | 'REJECT') {
    if (!comment.trim()) {
      setError('Please add a comment before you approve or reject this application.');
      return;
    }
    setPending(decision);
    setError('');
    try {
      const res = await fetch(`/api/review/${token}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, comment: comment.trim() }),
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
      <h2 className="font-display font-semibold text-lg mb-4">Your decision</h2>
      <label className="block mb-4">
        <span className="text-sm font-medium text-stone-700 mb-1 block">Comment (required)</span>
        <textarea
          required
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Add the reason for your decision…"
          className="w-full px-3 py-3 border border-stone-300 bg-[#fffdf8] focus:outline-none focus:ring-2 focus:ring-amber focus:border-amber"
        />
      </label>
      {error && <p className="text-sm text-red-700 mb-3">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => vote('APPROVE')}
          disabled={pending !== null}
          className="btn w-full justify-center bg-[#315b46] px-4 text-white hover:bg-[#274a39] disabled:opacity-50"
        >
          {pending === 'APPROVE' ? 'Recording…' : 'Approve'}
        </button>
        <button
          onClick={() => vote('REJECT')}
          disabled={pending !== null}
          className="btn w-full justify-center bg-[#8a463d] px-4 text-white hover:bg-[#733830] disabled:opacity-50"
        >
          {pending === 'REJECT' ? 'Recording…' : 'Reject'}
        </button>
      </div>
    </div>
  );
}
