'use client';

export function MemberActions({ id, label, deleteAction }: { id: string; label: string; deleteAction: (data: FormData) => Promise<void> }) {
  return <form action={deleteAction} onSubmit={(event) => { if (!window.confirm(`Delete ${label} from the approved member register and disable their portal access?`)) event.preventDefault(); }}>
    <input type="hidden" name="id" value={id} /><button type="submit" className="text-xs font-bold text-red-700 hover:underline">Delete member</button>
  </form>;
}
