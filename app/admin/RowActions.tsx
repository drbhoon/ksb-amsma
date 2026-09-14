'use client';

/**
 * Publish/hide and delete buttons for a list row.
 *
 * Delete asks for confirmation in the browser because these actions destroy an
 * uploaded document that has no other copy on the server.
 */
export function RowActions({
  id,
  toggleAction,
  deleteAction,
  toggleLabel,
  confirmText,
}: {
  id: string;
  toggleAction: (data: FormData) => Promise<void>;
  deleteAction: (data: FormData) => Promise<void>;
  toggleLabel: string;
  confirmText: string;
}) {
  return (
    <div className="flex gap-2">
      <form action={toggleAction}>
        <input type="hidden" name="id" value={id} />
        <button type="submit" className="rounded border border-stone-300 px-3 py-1 text-xs hover:bg-stone-50">
          {toggleLabel}
        </button>
      </form>
      <form
        action={deleteAction}
        onSubmit={(e) => {
          if (!window.confirm(confirmText)) e.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button type="submit" className="rounded border border-red-300 px-3 py-1 text-xs text-red-700 hover:bg-red-50">
          Delete
        </button>
      </form>
    </div>
  );
}
