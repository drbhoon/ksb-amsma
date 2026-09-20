'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { addMember } from '@/app/(marketing)/portal/admin/members/actions';

function SubmitButton() { const { pending } = useFormStatus(); return <button type="submit" disabled={pending} className="btn-primary disabled:opacity-50">{pending ? 'Adding…' : 'Add approved member'}</button>; }

export function MemberAdminForm() {
  const [state, action] = useFormState(addMember, {});
  const today = new Date(); const nextYear = new Date(today); nextYear.setFullYear(nextYear.getFullYear() + 1);
  const dateValue = (date: Date) => date.toISOString().slice(0, 10);
  const inputClass = 'border border-stone-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#c9ad84]';
  return <details className="membership-card mt-6 p-5 sm:p-7"><summary className="cursor-pointer text-lg font-bold text-[#273d33]">Add an approved member</summary>
    <form action={action} className="mt-6 grid gap-5 md:grid-cols-2">
      {state.error && <p role="alert" className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 md:col-span-2">{state.error}</p>}
      {state.ok && <p className="border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 md:col-span-2">{state.ok}</p>}
      <Field label="Organisation"><input name="organizationName" required maxLength={180} className={inputClass} /></Field>
      <Field label="Contact name"><input name="contactName" required maxLength={120} className={inputClass} /></Field>
      <Field label="Email"><input name="email" type="email" required maxLength={254} className={inputClass} /></Field>
      <Field label="Phone"><input name="phone" type="tel" required maxLength={30} className={inputClass} /></Field>
      <Field label="Membership category"><select name="tier" className={inputClass}><option value="ORDINARY_REGULAR">Ordinary Member</option><option value="ORDINARY_LARGE">Ordinary Member (Large Capacity)</option><option value="INSTITUTIONAL">Institutional / Educational Member</option><option value="ASSOCIATE">Associate Member</option></select></Field>
      <Field label="Crushing capacity MT/month" optional><input name="crushingCapacityMtMonth" type="number" min={1} className={inputClass} /></Field>
      <Field label="Complete address"><input name="address" required maxLength={300} className={inputClass} /></Field>
      <Field label="City"><input name="city" required maxLength={100} className={inputClass} /></Field>
      <Field label="State"><input name="state" required maxLength={100} className={inputClass} /></Field>
      <Field label="PAN"><input name="pan" required maxLength={20} className={inputClass} /></Field>
      <Field label="GST number" optional><input name="gstNumber" maxLength={30} className={inputClass} /></Field><div className="hidden md:block" />
      <Field label="Admission date"><input name="admittedAt" type="date" required defaultValue={dateValue(today)} className={inputClass} /></Field>
      <Field label="Expiry date"><input name="expiresAt" type="date" required defaultValue={dateValue(nextYear)} className={inputClass} /></Field>
      <div className="md:col-span-2"><SubmitButton /></div>
    </form></details>;
}

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) { return <label className="grid gap-2"><span className="text-sm font-bold text-[#273d33]">{label}{optional && <span className="font-normal text-stone-500"> (optional)</span>}</span>{children}</label>; }
