'use client';

import { useState } from 'react';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setMessage('');

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setStatus('success');
      setMessage(data.message || 'Subscribed! Please check your inbox.');
      setEmail('');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Failed to subscribe');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.in"
          disabled={status === 'submitting'}
          className="flex-1 px-4 py-3 rounded-md bg-white/10 border border-white/20 text-white
                     placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-amber
                     disabled:opacity-50"
        />
        <button type="submit" disabled={status === 'submitting'} className="btn-accent disabled:opacity-50">
          {status === 'submitting' ? 'Subscribing…' : 'Subscribe'}
        </button>
      </div>
      {message && (
        <p
          className={`mt-3 text-sm ${
            status === 'success' ? 'text-amber-light' : 'text-red-300'
          }`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
