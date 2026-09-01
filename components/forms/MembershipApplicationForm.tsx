'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TIERS_LIST, MEMBERSHIP_TIERS, formatInr, type MembershipTierId } from '@/config/membership';
import { COMMITTEE_MEMBERS } from '@/config/committee-members';
import { applicationSchema, toFieldErrors, FIELD_LABELS } from '@/lib/application-schema';

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
  agreePrivacy: boolean;
};

const initialForm: FormData = {
  tier: '', organizationName: '', contactName: '', contactEmail: '', contactPhone: '',
  addressLine: '', city: '', state: '', pincode: '', pan: '', gstNumber: '',
  crushingCapacityMtMonth: '', natureOfBusiness: '',
  signatoryName: '', signatoryDesignation: '', signatoryEmail: '', signatoryPhone: '',
  companyProofUrl: '', companyProofType: '',
  proposerName: '', proposerEmail: '', seconderName: '', seconderEmail: '',
  agreeRules: false, agreePrivacy: false,
};

export function MembershipApplicationForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(initialForm);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [error, setError] = useState('');
  // One message per field, shown inline AND collected into the summary panel.
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const selectedTier = form.tier ? MEMBERSHIP_TIERS[form.tier] : null;
  const isOrdinary = selectedTier?.category === 'Ordinary';

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    // Clear a field's error as soon as the applicant edits it - leaving a stale
    // message under a field they have just fixed is its own kind of confusing.
    setFieldErrors((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  }

  /** Move focus to the first field with a problem so it is never off-screen. */
  function focusFirstError(errs: Record<string, string>) {
    const first = Object.keys(errs)[0];
    if (!first) return;
    const el = document.getElementById(`field-${first}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (el as HTMLInputElement).focus?.({ preventScroll: true });
    } else {
      document.getElementById('error-summary')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Validate locally against the same schema the server uses, so every problem
    // is reported at once rather than one browser tooltip at a time.
    const check = applicationSchema.safeParse(form);
    if (!check.success) {
      const errs = toFieldErrors(check.error);
      setFieldErrors(errs);
      setStatus('error');
      const n = Object.keys(errs).length;
      setError(
        n === 1
          ? 'One field needs attention before you can submit.'
          : `${n} fields need attention before you can submit.`
      );
      focusFirstError(errs);
      return;
    }

    setStatus('submitting');
    try {
      const res = await fetch('/api/membership/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        // The server can reject for reasons the browser cannot know about -
        // an unrecognised committee member, a duplicate application - and
        // returns those against the field they belong to.
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors);
          focusFirstError(data.fieldErrors);
        }
        throw new Error(data.error || 'Submission failed');
      }
      router.push(`/membership/apply/success?no=${encodeURIComponent(data.applicationNo)}`);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-10">
      {/* ==== Category ==== */}
      <Section title="1. Membership Category" note="Fees and eligibility per Rule 4 of the Rules & Regulations.">
        {fieldErrors.tier && (
          <p id="field-tier" role="alert" tabIndex={-1} className="flex items-start gap-1.5 text-sm text-red-700">
            <span aria-hidden="true" className="mt-[2px] leading-none">&#9888;</span>
            <span>{fieldErrors.tier}</span>
          </p>
        )}
        <div className="grid gap-3">
          {TIERS_LIST.map((tier) => (
            <label
              key={tier.id}
              className={`flex items-start gap-4 p-4 border cursor-pointer transition-all ${
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
        <Input label="Organisation name *" value={form.organizationName} onChange={(v) => update('organizationName', v)} name="organizationName" error={fieldErrors.organizationName} required />
        <div className="grid md:grid-cols-2 gap-4">
          <Input
            label="PAN *"
            value={form.pan}
            onChange={(v) => update('pan', v.toUpperCase())}
            name="pan"
            error={fieldErrors.pan}
            required
            maxLength={10}
            placeholder="ABCDE1234F"
            hint="10 characters: five letters, four digits, one letter."
          />
          <Input
            label="GST number"
            value={form.gstNumber}
            onChange={(v) => update('gstNumber', v.toUpperCase())}
            name="gstNumber"
            error={fieldErrors.gstNumber}
            maxLength={15}
            placeholder="Optional"
          />
        </div>
        <Textarea label="Registered address *" value={form.addressLine} onChange={(v) => update('addressLine', v)} name="addressLine" error={fieldErrors.addressLine} required />
        <div className="grid md:grid-cols-3 gap-4">
          <Input label="City *" value={form.city} onChange={(v) => update('city', v)} name="city" error={fieldErrors.city} required />
          <Input label="State *" value={form.state} onChange={(v) => update('state', v)} name="state" error={fieldErrors.state} required />
          <Input label="PIN *" value={form.pincode} onChange={(v) => update('pincode', v)} name="pincode" error={fieldErrors.pincode} required maxLength={6} pattern="[0-9]{6}" />
        </div>

        {isOrdinary && (
          <div className="p-4 bg-amber/5 border border-amber/20 space-y-3">
            <p className="text-sm text-stone-700">
              <strong>Ordinary Members</strong> must have a minimum crushing capacity of <strong>50,000 MT/month</strong>.
              Capacity above 1 lakh MT/month qualifies for the Large tier automatically.
            </p>
            <Input
              label="Total aggregate crushing capacity (MT/month) *"
              type="number"
              min={50000}
              value={form.crushingCapacityMtMonth}
              onChange={(v) => update('crushingCapacityMtMonth', v)} name="crushingCapacityMtMonth" error={fieldErrors.crushingCapacityMtMonth}
              required
              placeholder="e.g. 75000"
            />
          </div>
        )}

        {!isOrdinary && form.tier && (
          <Input
            label="Nature of business *"
            value={form.natureOfBusiness}
            onChange={(v) => update('natureOfBusiness', v)} name="natureOfBusiness" error={fieldErrors.natureOfBusiness}
            required
            placeholder={selectedTier?.category === 'Associate' ? 'e.g. OEM supplier of crushing equipment' : 'e.g. Civil engineering research institute'}
          />
        )}
      </Section>

      {/* ==== Contact ==== */}
      <Section title="3. Primary Contact">
        <div className="grid md:grid-cols-2 gap-4">
          <Input label="Contact person name *" value={form.contactName} onChange={(v) => update('contactName', v)} name="contactName" error={fieldErrors.contactName} required />
          <Input label="Contact phone *" type="tel" value={form.contactPhone} onChange={(v) => update('contactPhone', v)} name="contactPhone" error={fieldErrors.contactPhone} required placeholder="+91 98XXXXXXXX" />
        </div>
        <Input label="Contact email *" type="email" value={form.contactEmail} onChange={(v) => update('contactEmail', v)} name="contactEmail" error={fieldErrors.contactEmail} required />
      </Section>

      {/* ==== Signatory ==== */}
      <Section title="4. Authorised Signatory" note="The person authorised to represent your organisation at Association meetings.">
        <div className="grid md:grid-cols-2 gap-4">
          <Input label="Signatory name *" value={form.signatoryName} onChange={(v) => update('signatoryName', v)} name="signatoryName" error={fieldErrors.signatoryName} required />
          <Input label="Designation *" value={form.signatoryDesignation} onChange={(v) => update('signatoryDesignation', v)} name="signatoryDesignation" error={fieldErrors.signatoryDesignation} required />
          <Input label="Signatory email *" type="email" value={form.signatoryEmail} onChange={(v) => update('signatoryEmail', v)} name="signatoryEmail" error={fieldErrors.signatoryEmail} required />
          <Input label="Signatory phone *" type="tel" value={form.signatoryPhone} onChange={(v) => update('signatoryPhone', v)} name="signatoryPhone" error={fieldErrors.signatoryPhone} required />
        </div>
      </Section>

      {/* ==== Supporting document ==== */}
      <Section title="5. Company Proof" note="Please share a link (Google Drive, OneDrive, Dropbox) to one of the following: incorporation certificate, GST certificate, or partnership deed. Native file upload will be added in a future update.">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <Select
              label="Document type *"
              value={form.companyProofType}
              onChange={(v) => update('companyProofType', v)} name="companyProofType" error={fieldErrors.companyProofType}
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
            <Input
              label="Document URL *"
              type="url"
              value={form.companyProofUrl}
              onChange={(v) => update('companyProofUrl', v)}
              name="companyProofUrl"
              error={fieldErrors.companyProofUrl}
              required
              placeholder="https://drive.google.com/file/d/…"
              hint="Paste a sharing link to the document itself. If you omit https:// we will add it."
            />
          </div>
        </div>
      </Section>

      {/* ==== Proposer & Seconder ==== */}
      <Section title="6. Proposer & Seconder" note="Per Rule 4, applications must be proposed and seconded by existing members. Please name two committee members below.">
        <div className="p-3 bg-stone-50 border border-stone-100 text-xs text-stone-600 mb-2">
          Current committee members: {COMMITTEE_MEMBERS.map(m => m.name.replace(/^(Prof\. Dr\.|Dr\.|Mr\.|Ms\.) /, '')).join(' · ')}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Input label="Proposer name *" value={form.proposerName} onChange={(v) => update('proposerName', v)} name="proposerName" error={fieldErrors.proposerName} required />
          <Input label="Proposer email *" type="email" value={form.proposerEmail} onChange={(v) => update('proposerEmail', v)} name="proposerEmail" error={fieldErrors.proposerEmail} required />
          <Input label="Seconder name *" value={form.seconderName} onChange={(v) => update('seconderName', v)} name="seconderName" error={fieldErrors.seconderName} required />
          <Input label="Seconder email *" type="email" value={form.seconderEmail} onChange={(v) => update('seconderEmail', v)} name="seconderEmail" error={fieldErrors.seconderEmail} required />
        </div>
      </Section>

      {/* ==== Consent ==== */}
      <Section title="7. Declaration">
        <label
          className={
            'flex items-start gap-3 p-4 border ' +
            (fieldErrors.agreeRules ? 'bg-red-50 border-red-400' : 'bg-stone-50 border-stone-200')
          }
        >
          <input
            type="checkbox"
            checked={form.agreeRules}
            onChange={(e) => update('agreeRules', e.target.checked)}
            id="field-agreeRules"
            aria-invalid={fieldErrors.agreeRules ? true : undefined}
            className="mt-1"
          />
          <span className="text-sm text-stone-700">
            I certify that the information provided is accurate. I have read and agree to abide by the
            Memorandum of Association and Rules &amp; Regulations of the Aggregate &amp; M sand Manufacturers Association.
            I understand that admission requires a two-thirds majority approval of the Managing Committee, and that
            payment of the annual subscription is required only after approval.
          </span>
        </label>
        <FieldError id="field-agreeRules" message={fieldErrors.agreeRules} />
        <label
          className={
            'flex items-start gap-3 p-4 border ' +
            (fieldErrors.agreePrivacy ? 'bg-red-50 border-red-400' : 'bg-stone-50 border-stone-200')
          }
        >
          <input
            type="checkbox"
            checked={form.agreePrivacy}
            onChange={(e) => update('agreePrivacy', e.target.checked)}
            id="field-agreePrivacy"
            aria-invalid={fieldErrors.agreePrivacy ? true : undefined}
            className="mt-1"
          />
          <span className="text-sm text-stone-700">
            I consent to AMSMA using my application data to assess and manage membership. I understand that AMSMA will retain the data only for its legal, governance, and membership needs. I have read the{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-amber underline underline-offset-2">privacy note</a>.
          </span>
        </label>
        <FieldError id="field-agreePrivacy" message={fieldErrors.agreePrivacy} />
      </Section>

      {(error || Object.keys(fieldErrors).length > 0) && (
        <div
          id="error-summary"
          role="alert"
          tabIndex={-1}
          className="p-4 bg-red-50 border border-red-300"
        >
          <p className="font-semibold text-red-900">{error || 'Please correct the following:'}</p>
          {Object.keys(fieldErrors).length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {Object.entries(fieldErrors).map(([field, message]) => (
                <li key={field} className="text-sm text-red-800">
                  <a
                    href={`#field-${field}`}
                    onClick={(ev) => {
                      ev.preventDefault();
                      const el = document.getElementById(`field-${field}`);
                      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      (el as HTMLInputElement | null)?.focus?.({ preventScroll: true });
                    }}
                    className="font-medium underline underline-offset-2 hover:text-red-900"
                  >
                    {FIELD_LABELS[field] ?? field}
                  </a>
                  {' — '}
                  {message}
                </li>
              ))}
            </ul>
          )}
        </div>
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
    <div className="space-y-4 border-t border-stone-300 pt-8 first:border-t-0 first:pt-0">
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
  name?: string;
  error?: string;
  hint?: string;
};

/** Shared classes so an errored control looks the same everywhere. */
function controlClass(hasError?: boolean) {
  return (
    'w-full px-3 py-3 border bg-[#fffdf8] focus:outline-none focus:ring-2 ' +
    (hasError
      ? 'border-red-500 bg-red-50 focus:ring-red-400 focus:border-red-500'
      : 'border-stone-300 focus:ring-amber focus:border-amber')
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={`${id}-error`} role="alert" className="mt-1 flex items-start gap-1.5 text-sm text-red-700">
      <span aria-hidden="true" className="mt-[2px] leading-none">&#9888;</span>
      <span>{message}</span>
    </p>
  );
}

function Input({
  label, value, onChange, type = 'text', required, maxLength, pattern, min, placeholder, name, error, hint,
}: InputProps) {
  const id = `field-${name ?? label}`;
  return (
    <div className="block">
      <label htmlFor={id} className="block text-sm font-medium text-stone-700 mb-1">{label}</label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        maxLength={maxLength}
        pattern={pattern}
        min={min}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={controlClass(!!error)}
      />
      {hint && !error && <p id={`${id}-hint`} className="mt-1 text-xs text-stone-500">{hint}</p>}
      <FieldError id={id} message={error} />
    </div>
  );
}

function Textarea({ label, value, onChange, required, name, error }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; name?: string; error?: string }) {
  const id = `field-${name ?? label}`;
  return (
    <div className="block">
      <label htmlFor={id} className="block text-sm font-medium text-stone-700 mb-1">{label}</label>
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        rows={2}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={controlClass(!!error)}
      />
      <FieldError id={id} message={error} />
    </div>
  );
}

function Select({ label, value, onChange, options, required, name, error }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; name?: string; error?: string; options: Array<{ value: string; label: string }> }) {
  const id = `field-${name ?? label}`;
  return (
    <div className="block">
      <label htmlFor={id} className="block text-sm font-medium text-stone-700 mb-1">{label}</label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={controlClass(!!error) + ' bg-white'}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <FieldError id={id} message={error} />
    </div>
  );
}
