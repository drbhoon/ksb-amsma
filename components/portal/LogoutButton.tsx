import { signOut } from '@/auth';

export function LogoutButton() {
  return (
    <form action={async () => { 'use server'; await signOut({ redirectTo: '/portal/login' }); }}>
      <button type="submit" className="text-sm font-semibold text-[#96501f] hover:underline">Sign out</button>
    </form>
  );
}
