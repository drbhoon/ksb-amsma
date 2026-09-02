'use client';

import { useState } from 'react';

const emptyForm = { name: '', email: '', phone: '', subject: '', message: '', consent: false, website: '' };

export function ContactForm() {
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  function update(name: keyof typeof emptyForm, value: string | boolean) {
    setForm((current) => ({ ...current, [name]: value }));
    if (status === 'error') setStatus('idle');
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setStatus('sending');
    setMessage('');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'The message could not be sent.');
      setForm(emptyForm);
      setStatus('success');
      setMessage('Thank you. Your message has been sent to the AMSMA Secretariat.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'The message could not be sent.');
    }
  }

  const control = 'w-full border border-black/20 bg-[#fffdf8] px-3 py-3 text-base outline-none transition focus:border-[#96501f] focus:ring-2 focus:ring-[#d8c9a6]';

  return (
    <form className="ll-contact-form" onSubmit={submit}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name *"><input className={control} required value={form.name} onChange={(e) => update('name', e.target.value)} /></Field>
        <Field label="Email *"><input className={control} required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} /></Field>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Phone"><input className={control} type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} /></Field>
        <Field label="Subject *"><input className={control} required value={form.subject} onChange={(e) => update('subject', e.target.value)} /></Field>
      </div>
      <Field label="Message *"><textarea className={control} required minLength={20} rows={6} value={form.message} onChange={(e) => update('message', e.target.value)} /></Field>
      <div className="hidden" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => update('website', e.target.value)} /></label></div>
      <label className="flex items-start gap-3 text-sm"><input className="mt-1" type="checkbox" required checked={form.consent} onChange={(e) => update('consent', e.target.checked)} /><span>I consent to AMSMA using these details to reply to my enquiry. Read the <a className="underline underline-offset-2" href="/privacy" target="_blank" rel="noreferrer">privacy notice</a>.</span></label>
      <div className="flex flex-wrap items-center gap-4"><button className="ll-button ll-button-solid" type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Sending…' : 'Send Message'}</button>{message && <p className={`text-sm ${status === 'error' ? 'text-red-700' : 'text-[#273d33]'}`} role="status">{message}</p>}</div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="ll-label">{label}</span>{children}</label>;
}
