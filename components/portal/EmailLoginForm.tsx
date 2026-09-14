'use client';

import { FormEvent, useState } from 'react';

export function EmailLoginForm({ nextPath, initialToken }: { nextPath: string; initialToken?: string }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeRequested, setCodeRequested] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function verifyToken(event: FormEvent) {
    event.preventDefault();
    if (!initialToken) return;
    setBusy(true);
    setError('');
    const response = await fetch('/api/portal/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: initialToken }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(data.error || 'The sign-in link could not be verified.');
      return;
    }
    window.location.assign(data.next);
  }

  async function requestCode(event?: FormEvent) {
    event?.preventDefault();
    setBusy(true);
    setError('');
    const response = await fetch('/api/portal/auth/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, next: nextPath }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(data.error || 'The sign-in request could not be completed.');
      return;
    }
    setCodeRequested(true);
    setMessage(data.message);
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const response = await fetch('/api/portal/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(data.error || 'The code could not be verified.');
      return;
    }
    window.location.assign(data.next);
  }

  if (initialToken) {
    return (
      <form onSubmit={verifyToken} className="space-y-5">
        <p className="text-sm text-stone-600">Confirm that you want to use this one-time link to open the AMSMA portal.</p>
        {error && <p role="alert" className="border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full justify-center disabled:cursor-wait disabled:opacity-60">
          {busy ? 'Checking…' : 'Continue secure sign-in'}
        </button>
      </form>
    );
  }

  if (!codeRequested) {
    return (
      <form onSubmit={requestCode} className="space-y-5">
        <div>
          <label htmlFor="portal-email" className="mb-2 block text-sm font-semibold text-[#273d33]">Approved email address</label>
          <input id="portal-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full border border-stone-300 bg-white px-4 py-3 outline-none focus:border-[#96501f] focus:ring-2 focus:ring-[#c9ad84]/40" />
        </div>
        {error && <p role="alert" className="border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full justify-center disabled:cursor-wait disabled:opacity-60">
          {busy ? 'Sending…' : 'Send sign-in code'}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={verifyCode} className="space-y-5">
      <p className="border border-[#c9ad84] bg-[#f8f2e7] p-3 text-sm text-[#273d33]">{message}</p>
      <div>
        <label htmlFor="portal-code" className="mb-2 block text-sm font-semibold text-[#273d33]">Six-digit code</label>
        <input id="portal-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} className="w-full border border-stone-300 bg-white px-4 py-3 text-center text-2xl font-bold tracking-[.3em] outline-none focus:border-[#96501f] focus:ring-2 focus:ring-[#c9ad84]/40" />
      </div>
      {error && <p role="alert" className="border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <button type="submit" disabled={busy || code.length !== 6} className="btn-primary w-full justify-center disabled:cursor-wait disabled:opacity-60">
        {busy ? 'Checking…' : 'Sign in securely'}
      </button>
      <div className="flex flex-wrap justify-between gap-3 text-sm">
        <button type="button" className="font-semibold text-[#96501f] hover:underline" onClick={() => { setCodeRequested(false); setCode(''); setMessage(''); setError(''); }}>Use another email</button>
        <button type="button" disabled={busy} className="font-semibold text-[#96501f] hover:underline disabled:opacity-50" onClick={() => requestCode()}>Send a new code</button>
      </div>
    </form>
  );
}
