'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createResource } from '@/app/(marketing)/portal/admin/resources/actions';

function UploadButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary disabled:opacity-50">
      {pending ? 'Uploading…' : 'Upload and publish'}
    </button>
  );
}

export function ResourceUploadForm() {
  const [state, action] = useFormState(createResource, {});
  return (
    <form action={action} className="membership-card grid gap-5 p-5 sm:p-7">
      <div>
        <p className="membership-kicker !text-[#96501f]">New public resource</p>
        <h2 className="mt-2 text-2xl font-bold text-[#273d33]">Upload a PDF</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          The document will appear on the public Resources page immediately.
        </p>
      </div>
      {state.error && <p role="alert" className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{state.error}</p>}
      {state.ok && <p className="border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{state.ok}</p>}
      <label className="grid gap-2">
        <span className="text-sm font-bold text-[#273d33]">Document title</span>
        <input name="title" required minLength={3} maxLength={160} className="border border-stone-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#c9ad84]" />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-bold text-[#273d33]">Category</span>
        <select name="category" className="border border-stone-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#c9ad84]">
          <option value="ARTICLE">Article</option>
          <option value="REGULATION">Regulation</option>
          <option value="GOVT_LETTER">Government letter</option>
          <option value="CIRCULAR">Circular</option>
          <option value="PRESENTATION">Presentation</option>
          <option value="OTHER">Other document</option>
        </select>
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-bold text-[#273d33]">Short description <span className="font-normal text-stone-500">(optional)</span></span>
        <textarea name="description" rows={3} maxLength={800} className="border border-stone-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#c9ad84]" />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-bold text-[#273d33]">PDF file</span>
        <input name="file" type="file" required accept="application/pdf,.pdf" className="border border-dashed border-stone-400 bg-white px-4 py-5 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-[#273d33] file:px-4 file:py-2 file:font-bold file:text-white" />
        <span className="text-xs text-stone-500">PDF only. Maximum 15 MB.</span>
      </label>
      <div><UploadButton /></div>
    </form>
  );
}
