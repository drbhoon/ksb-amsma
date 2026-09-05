import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { isAdmin } from '@/lib/admin-auth';
import { createEvent, toggleEvent, deleteEvent } from '../actions';
import { ActionForm, Field, TextareaField, PublishToggle } from '../ui';
import { ALLOWED_LABEL, MAX_UPLOAD_BYTES } from '@/lib/uploads';
import { RowActions } from '../RowActions';

export const dynamic = 'force-dynamic';

export default async function AdminEvents() {
  if (!isAdmin()) redirect('/admin');
  const events = await prisma.event.findMany({
    orderBy: { startDate: 'desc' },
    include: { attachment: { select: { id: true, filename: true } } },
  });

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold">Events</h1>

      <section className="mb-10 rounded-lg border border-stone-200 bg-white p-6">
        <h2 className="mb-4 font-semibold">Add an event</h2>
        <ActionForm action={createEvent} submitLabel="Save event">
          <Field label="Title" name="title" required placeholder="e.g. First Annual General Meeting" />
          <TextareaField label="Description" name="description" rows={4} />
          <Field label="Location" name="location" required placeholder="e.g. Hotel Sahara Star, Mumbai" />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Starts" name="startDate" type="datetime-local" required />
            <Field label="Ends (optional)" name="endDate" type="datetime-local" />
          </div>
          <Field
            label="Attachment (optional)"
            name="attachment"
            type="file"
            hint={`Agenda, notice or circular. ${ALLOWED_LABEL}. Up to ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`}
          />
          <PublishToggle />
        </ActionForm>
      </section>

      <h2 className="mb-3 font-semibold">{events.length} event{events.length === 1 ? '' : 's'}</h2>
      {events.length === 0 ? (
        <p className="text-sm text-stone-600">Nothing scheduled yet.</p>
      ) : (
        <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
          {events.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-[240px] flex-1">
                <span className="font-medium">{e.title}</span>
                <p className="text-xs text-stone-500">
                  {e.startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {' · '}{e.location}
                  {e.attachment && (
                    <>
                      {' · '}
                      <a href={`/api/files/${e.attachment.id}`} className="underline">
                        {e.attachment.filename}
                      </a>
                    </>
                  )}
                </p>
              </div>
              <span className={'rounded px-2 py-0.5 text-xs ' + (e.isPublic ? 'bg-green-100 text-green-800' : 'bg-stone-200 text-stone-600')}>
                {e.isPublic ? 'Public' : 'Hidden'}
              </span>
              <RowActions
                id={e.id}
                toggleAction={toggleEvent}
                deleteAction={deleteEvent}
                toggleLabel={e.isPublic ? 'Hide' : 'Publish'}
                confirmText={`Delete "${e.title}"? This cannot be undone.`}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
