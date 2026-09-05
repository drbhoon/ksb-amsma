import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { isAdmin } from '@/lib/admin-auth';
import { createPublication, deletePublication, togglePublication } from '../actions';
import { ActionForm, Field, TextareaField, SelectField, PublishToggle } from '../ui';
import { formatBytes, ALLOWED_LABEL, MAX_UPLOAD_BYTES } from '@/lib/uploads';
import { RowActions } from '../RowActions';

export const dynamic = 'force-dynamic';

const CATEGORIES = [
  { value: 'ARTICLE', label: 'Article' },
  { value: 'REGULATION', label: 'Regulation' },
  { value: 'GOVT_LETTER', label: 'Government letter' },
  { value: 'CIRCULAR', label: 'Circular' },
  { value: 'PRESENTATION', label: 'Presentation' },
  { value: 'OTHER', label: 'Other' },
];

export default async function AdminPublications() {
  if (!isAdmin()) redirect('/admin');

  const items = await prisma.publication.findMany({
    orderBy: { publishedAt: 'desc' },
    include: { file: { select: { filename: true, sizeBytes: true, id: true } } },
  });

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold">Publications</h1>

      <section className="mb-10 rounded-lg border border-stone-200 bg-white p-6">
        <h2 className="mb-4 font-semibold">Upload a document</h2>
        <ActionForm action={createPublication} submitLabel="Upload">
          <Field label="Title" name="title" required placeholder="e.g. MoEFCC circular on quarry leases" />
          <TextareaField label="Description (optional)" name="description" rows={3} />
          <SelectField label="Category" name="category" options={CATEGORIES} />
          <Field
            label="Document"
            name="file"
            type="file"
            required
            hint={`${ALLOWED_LABEL}. Up to ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`}
          />
          <PublishToggle />
        </ActionForm>
      </section>

      <h2 className="mb-3 font-semibold">{items.length} document{items.length === 1 ? '' : 's'}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-stone-600">Nothing uploaded yet.</p>
      ) : (
        <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
          {items.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-[240px] flex-1">
                <a href={`/api/files/${p.file.id}`} className="font-medium underline underline-offset-2">
                  {p.title}
                </a>
                <p className="text-xs text-stone-500">
                  {p.category.replace('_', ' ').toLowerCase()} · {p.file.filename} ·{' '}
                  {formatBytes(p.file.sizeBytes)} · {p.publishedAt.toLocaleDateString('en-IN')}
                </p>
              </div>
              <span className={'rounded px-2 py-0.5 text-xs ' + (p.isPublished ? 'bg-green-100 text-green-800' : 'bg-stone-200 text-stone-600')}>
                {p.isPublished ? 'Public' : 'Hidden'}
              </span>
              <RowActions
                id={p.id}
                toggleAction={togglePublication}
                deleteAction={deletePublication}
                toggleLabel={p.isPublished ? 'Hide' : 'Publish'}
                confirmText={`Delete "${p.title}" and its uploaded file? This cannot be undone.`}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
