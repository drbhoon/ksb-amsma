'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AdminActions({ applicationId, mode }: { applicationId: string; mode: 'CONFIRM' | 'EXTEND' | 'EXTEND_SPONSOR' }) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function act() {
    if (!window.confirm(mode === 'CONFIRM' ? 'Confirm and release the committee result?' : mode === 'EXTEND' ? 'Open a new 48-hour review window?' : 'Extend the sponsor review by seven days?')) return;
    setPending(true);
    setError('');
    const response = await fetch(`/api/admin/applications/${applicationId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: mode, note: note.trim() || undefined }),
    });
    const data = await response.json();
    if (!response.ok) {
      setPending(false);
      setError(data.error || 'The action failed.');
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-5 border-t border-stone-200 pt-5">
      {mode === 'CONFIRM' && <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={2} placeholder="Admin note (optional)" className="mb-3 w-full border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber" />}
      {error && <p className="mb-3 text-sm text-red-700">{error}</p>}
      <button type="button" onClick={act} disabled={pending} className="btn-primary disabled:opacity-50">
        {pending ? 'Working…' : mode === 'CONFIRM' ? 'Confirm and release result' : mode === 'EXTEND' ? 'Extend review by 48 hours' : 'Extend sponsor review by seven days'}
      </button>
    </div>
  );
}
