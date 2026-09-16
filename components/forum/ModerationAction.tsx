'use client';

import { moderateForum } from '@/app/(marketing)/forum/actions';

export function ModerationAction({ target, id, action, label, danger = false }: {
  target: 'topic' | 'post' | 'user';
  id: string;
  action: string;
  label: string;
  danger?: boolean;
}) {
  function confirmAction(event: React.FormEvent<HTMLFormElement>) {
    if (action !== 'delete' && action !== 'suspend') return;
    const reason = window.prompt(`Give a short reason to ${label.toLowerCase()}. This will be kept in the admin record.`);
    if (!reason || reason.trim().length < 5) {
      event.preventDefault();
      return;
    }
    const input = event.currentTarget.elements.namedItem('reason') as HTMLInputElement;
    input.value = reason.trim().slice(0, 500);
  }

  return (
    <form action={moderateForum} onSubmit={confirmAction}>
      <input type="hidden" name="target" value={target} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="action" value={action} />
      <input type="hidden" name="reason" value="" />
      <button type="submit" className={`text-sm font-bold hover:underline ${danger ? 'text-red-700' : 'text-[#273d33]'}`}>{label}</button>
    </form>
  );
}
