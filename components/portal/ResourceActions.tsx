'use client';

export function ResourceActions({
  id,
  title,
  isPublished,
  toggleAction,
  deleteAction,
}: {
  id: string;
  title: string;
  isPublished: boolean;
  toggleAction: (data: FormData) => Promise<void>;
  deleteAction: (data: FormData) => Promise<void>;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-stone-200 pt-4 text-sm font-bold">
      <form action={toggleAction}>
        <input type="hidden" name="id" value={id} />
        <button type="submit" className="text-[#273d33] hover:underline">
          {isPublished ? 'Hide from public page' : 'Publish'}
        </button>
      </form>
      <form
        action={deleteAction}
        className="ml-auto"
        onSubmit={(event) => {
          if (!window.confirm(`Delete “${title}” and its PDF? This cannot be undone.`)) event.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button type="submit" className="text-red-700 hover:underline">Delete</button>
      </form>
    </div>
  );
}
