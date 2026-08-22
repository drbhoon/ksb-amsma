'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TIERS_LIST, MEMBERSHIP_TIERS, formatInr, type MembershipTierId } from '@/config/membership';
import { COMMITTEE_MEMBERS } from '@/config/committee-members';

type FormData = {
  tier: MembershipTierId | '';
  organizationName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  pan: string;
  gstNumber: string;
  crushingCapacityMtMonth: string; // string in form, parsed to int on submit
  natureOfBusiness: string;
  signatoryName: string;
  signatoryDesignation: string;
  signatoryEmail: string;
  signatoryPhone: string;
  companyProofUrl: string;
  companyProofType: string;
  proposerName: string;
  proposerEmail: string;
  seconderName: string;
  seconderEmail: string;
  agreeRules: boolean;
};

const initialForm: FormData = {
  tier: '', organizationName: '', contactName: '', contactEmail: '', contactPhone: '',
  addressLine: '', city: '', state: '', pincode: '', pan: '', gstNumber: '',
  crushingCapacityMtMonth: '', natureOfBusiness: '',
  signatoryName: '', signatoryDesignation: '', signatoryEmail: '', signatoryPhone: '',
  companyProofUrl: '', companyProofType: '',
  proposerName: '', proposerEmail: '', seconderName: '', seconderEmail: '',
  agreeRules: false,
};

export function MembershipApplicationForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(initialForm);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [error, setError] = useState('');

  const selectedTier = form.tier ? MEMBERSHIP_TIERS[form.tier] : null;
  const isOrdinary = selectedTier?.category === 'Ordinary';

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setError('');

    try {
      const res = await fetch('/api/membership/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      router.push(`/membership/apply/success?no=${encodeURIComponent(data.applicationNo)}`);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  return (
    <form onSubmit={submit} className="space-y-10">
      {/* ==== Category ==== */}
      <Section title="1. Membership Category" note="Fees and eligibility per Rule 4 of the Rules & Regulations.">
        <div className="grid gap-3">
          {TIERS_LIST.map((tier) => (
            <label
              key={tier.id}
              className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
                form.tier === tier.id
                  ? 'border-amber bg-amber/5'
                  : 'border-stone-200 hover:border-stone-300 bg-white'
              }`}
            >
              <input
                type="radio"
                name="tier"
                value={tier.id}
                checked={form.tier === tier.id}
                onChange={(e) => update('tier', e.target.value as MembershipTierId)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-baseline justify-between">
                  <div className="font-semibold">{tier.label}</div>
                  <div className="font-display font-bold text-lg">{formatInr(tier.annualFeeRupees)}<span className="text-xs font-normal text-stone-500">/yr</span></div>
                </div>
                <div className="text-sm text-stone-600 mt-1">{tier.eligibility}</div>
              </div>
            </label>
          ))}
        </div>
      </Section>

      {/* ==== Organisation ==== */}
      <Section title="2. Organisation Details">
        <Input label="Organisation name *" value={form.organizationName} onChange={(v) => update('organizationName', v)} required />
        <div className="grid md:grid-cols-2 gap-4">
          <Input label="PAN *" value={form.pan} onChange={(v) => update('pan', v.toUpperCase())} required maxLength={10} placeholder="ABCDE1234F" pattern="^[A-Z]{5}[0-9]{4}[A-Z]$" />
          <Input label="GST number" value={form.gstNumber} onChange={(v) => update('gstNumber', v.toUpperCase())} maxLength={15} placeholder="Optional" />
        </div>
        <Textarea label="Registered address *" value={form.addressLine} onChange={(v) => update('addressLine', v)} required />
        <div className="grid md:grid-cols-3 gap-4">
          <Input label="City *" value={form.city} onChange={(v) => update('city', v)} required />
          <Input label="State *" value={form.state} onChange={(v) => update('state', v)} required />
          <Input label="PIN *" value={form.pincode} onChange={(v) => update('pincode', v)} required maxLength={6} pattern="[0-9]{6}" />
        </div>

        {isOrdinary && (
          <div className="p-4 bg-amber/5 border border-amber/20 rounded-lg space-y-3">
            <p className="text-sm text-stone-700">
              <strong>Ordinary Members</strong> must have a minimum crushing capacity of <strong>50,000 MT/month</strong>.
              Capacity above 1 lakh MT/month qualifies for the Large tier automatically.
            </p>
            <Input
              label="Total aggregate crushing capacity (MT/month) *"
              type="number"
              min={50000}
              value={form.crushingCapacityMtMonth}
              onChange={(v) => update('crushingCapacityMtMonth', v)}
              required
              placeholder="e.g. 75000"
            />
          </div>
        )}

        {!isOrdinary && form.tier && (
          <Input
            label="Nature of business *"
            value={form.natureOfBusiness}
            onChange={(v) => update('natureOfBusiness', v)}
            required
            placeholder={selectedTier?.category === 'Associate' ? 'e.g. OEM supplier of crushing equipment' : 'e.g. Civil engineering research institute'}
          />
        )}
      </Section>

      {/* ==== Contact ==== */}
      <Section title="3. Primary Contact">
        <div className="grid md:grid-cols-2 gap-4">
          <Input label="Contact person name *" value={form.contactName} onChange={(v) => update('contactName', v)} required />
          <Input label="Contact phone *" type="tel" value={form.contactPhone} onChange={(v) => update('contactPhone', v)} required placeholder="+91 98XXXXXXXX" />
        </div>
        <Input label="Contact email *" type="email" value={form.contactEmail} onChange={(v) => update('contactEmail', v)} required />
      </Section>

      {/* ==== Signatory ==== */}
      <Section title="4. Authorised Signatory" note="The person authorised to represent your organisation at Association meetings.">
        <div className="grid md:grid-cols-2 gap-4">
          <Input label="Signatory name *" value={form.signatoryName} onChange={(v) => update('signatoryName', v)} required />
          <Input label="Designation *" value={form.signatoryDesignation} onChange={(v) => update('signatoryDesignation', v)} required />
          <Input label="Signatory email *" type="email" value={form.signatoryEmail} onChange={(v) => update('signatoryEmail', v)} required />
          <Input label="Signatory phone *" type="tel" value={form.signatoryPhone} onChange={(v) => update('signatoryPhone', v)} required />
        </div>
      </Section>

      {/* ==== Supporting document ==== */}
      <Section title="5. Company Proof" note="Please share a link (Google Drive, OneDrive, Dropbox) to one of the following: incorporation certificate, GST certificate, or partnership deed. Native file upload will be added in a future update.">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <Select
              label="Document type *"
              value={form.companyProofType}
              onChange={(v) => update('companyProofType', v)}
              required
              options={[
                { value: '', label: 'Select…' },
                { value: 'incorporation', label: 'Incorporation Certificate' },
                { value: 'gst_cert', label: 'GST Certificate' },
                { value: 'partnership_deed', label: 'Partnership Deed' },
              ]}
            />
          </div>
          <div className="md:col-span-2">
            <Input label="Document URL *" type="url" value={form.companyProofUrl} onChange={(v) => update('companyProofUrl', v)} required placeholder="https://drive.google.com/…" />
          </div>
        </div>
      </Section>

      {/* ==== Proposer & Seconder ==== */}
      <Section title="6. Proposer & Seconder" note="Per Rule 4, applications must be proposed and seconded by existing members. Please name two committee members below.">
        <div className="p-3 bg-stone-50 border border-stone-100 rounded-md text-xs text-stone-600 mb-2">
          Current committee members: {COMMITTEE_MEMBERS.map(m => m.name.replace(/^(Prof\. Dr\.|Dr\.|Mr\.|Ms\.) /, '')).join(' · ')}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Input label="Proposer name *" value={form.proposerName} onChange={(v) => update('proposerName', v)} required />
          <Input label="Proposer email *" type="email" value={form.proposerEmail} onChange={(v) => update('proposerEmail', v)} required />
          <Input label="Seconder name *" value={form.seconderName} onChange={(v) => update('seconderName', v)} required />
          <Input label="Seconder email *" type="email" value={form.seconderEmail} onChange={(v) => update('seconderEmail', v)} required />
        </div>
      </Section>

      {/* ==== Consent ==== */}
      <Section title="7. Declaration">
        <label className="flex items-start gap-3 p-4 bg-stone-50 border border-stone-200 rounded-lg">
          <input
            type="checkbox"
            checked={form.agreeRules}
            onChange={(e) => update('agreeRules', e.target.checked)}
            required
            className="mt-1"
          />
          <span className="text-sm text-stone-700">
            I certify that the information provided is accurate. I have read and agree to abide by the
            Memorandum of Association and Rules &amp; Regulations of the Aggregate &amp; M sand Manufacturers Association.
            I understand that admission requires a two-thirds majority approval of the Managing Committee, and that
            payment of the annual subscription is required only after approval.
          </span>
        </label>
      </Section>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{error}</div>
      )}

      <div className="flex flex-col md:flex-row md:items-center gap-4 pt-4">
        <button type="submit" disabled={status === 'submitting'} className="btn-accent px-8 py-3 disabled:opacity-50">
          {status === 'submitting' ? 'Submitting…' : 'Submit Application'}
        </button>
        {selectedTier && (
          <p className="text-sm text-stone-600">
            Fee payable on approval: <strong>{formatInr(selectedTier.annualFeeRupees)}</strong>
          </p>
        )}
      </div>
    </form>
  );
}

// ---- Small form primitives ----

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display font-semibold text-xl">{title}</h2>
        {note && <p className="text-sm text-stone-500 mt-1">{note}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

type InputProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  maxLength?: number;
  pattern?: string;
  min?: number;
  placeholder?: string;
};

function Input({ label, value, onChange, type = 'text', required, maxLength, pattern, min, placeholder }: InputProps) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-stone-700 mb-1">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        maxLength={maxLength}
        pattern={pattern}
        min={min}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber focus:border-amber"
      />
    </label>
  );
}

function Textarea({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-stone-700 mb-1">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        rows={2}
        className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber focus:border-amber"
      />
    </label>
  );
}

function Select({ label, value, onChange, options, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; options: Array<{ value: string; label: string }> }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-stone-700 mb-1">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber focus:border-amber bg-white"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
