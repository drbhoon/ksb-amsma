import { redirect } from 'next/navigation';
import { clearPortalSession } from '@/lib/portal-auth';

export function LogoutButton({
  nextPath = '/portal/login',
  label = 'Sign out',
  className = 'text-sm font-semibold text-[#96501f] hover:underline',
}: {
  nextPath?: string;
  label?: string;
  className?: string;
} = {}) {
  return (
    <form action={async () => { 'use server'; await clearPortalSession(); redirect(nextPath); }}>
      <button type="submit" className={className}>{label}</button>
    </form>
  );
}
