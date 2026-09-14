import { redirect } from 'next/navigation';
import { clearPortalSession } from '@/lib/portal-auth';

export function LogoutButton() {
  return (
    <form action={async () => { 'use server'; await clearPortalSession(); redirect('/portal/login'); }}>
      <button type="submit" className="text-sm font-semibold text-[#96501f] hover:underline">Sign out</button>
    </form>
  );
}
