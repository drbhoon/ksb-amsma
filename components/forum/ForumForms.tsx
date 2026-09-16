'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createForumReply, createForumTopic } from '@/app/(marketing)/forum/actions';

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="btn-primary disabled:opacity-50">{pending ? 'Posting…' : label}</button>;
}

export function NewTopicForm({ space }: { space: 'members' | 'committee' }) {
  const [state, action] = useFormState(createForumTopic, {});
  return (
    <form action={action} className="membership-card grid gap-5 p-6 sm:p-8">
      <input type="hidden" name="space" value={space} />
      {state.error && <p role="alert" className="border border-red-300 bg-red-50 p-3 text-sm text-red-800">{state.error}</p>}
      <label className="grid gap-2 text-sm font-bold text-[#273d33]">
        Topic title
        <input name="title" required minLength={5} maxLength={160} className="border border-stone-300 bg-white px-4 py-3 font-normal focus:outline-none focus:ring-2 focus:ring-[#c9ad84]" />
      </label>
      <label className="grid gap-2 text-sm font-bold text-[#273d33]">
        Your message
        <textarea name="body" required minLength={10} maxLength={10000} rows={8} className="border border-stone-300 bg-white px-4 py-3 font-normal focus:outline-none focus:ring-2 focus:ring-[#c9ad84]" />
      </label>
      <p className="text-xs text-stone-600">Only authorised members of this area can read your post. Do not share private applicant details or personal data.</p>
      <div><Submit label="Start discussion" /></div>
    </form>
  );
}

export function ReplyForm({ topicId }: { topicId: string }) {
  const [state, action] = useFormState(createForumReply, {});
  return (
    <form action={action} className="membership-card mt-8 grid gap-4 p-6 sm:p-8">
      <h2 className="text-xl font-bold text-[#273d33]">Reply to this discussion</h2>
      <input type="hidden" name="topicId" value={topicId} />
      {state.error && <p role="alert" className="border border-red-300 bg-red-50 p-3 text-sm text-red-800">{state.error}</p>}
      <label className="sr-only" htmlFor="forum-reply">Your reply</label>
      <textarea id="forum-reply" name="body" required minLength={2} maxLength={10000} rows={5} placeholder="Share a useful response…" className="border border-stone-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#c9ad84]" />
      <div><Submit label="Post reply" /></div>
    </form>
  );
}
