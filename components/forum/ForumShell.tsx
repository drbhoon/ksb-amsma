import Link from 'next/link';
import { LogoutButton } from '@/components/portal/LogoutButton';

export function ForumShell({
  title,
  eyebrow,
  userName,
  canSeeCommittee,
  isTest,
  children,
}: {
  title: string;
  eyebrow: string;
  userName: string;
  canSeeCommittee: boolean;
  isTest: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="membership-surface min-h-[70vh] py-10 md:py-14">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-5 border-b border-stone-300 pb-6">
          <div>
            <p className="membership-kicker !text-[#96501f]">{eyebrow}</p>
            <h1 className="mt-2 text-3xl font-bold text-[#273d33] md:text-4xl">{title}</h1>
            <p className="mt-2 text-sm text-stone-600">Signed in as {userName}</p>
          </div>
          <LogoutButton />
        </div>
        <nav className="my-6 flex flex-wrap gap-4 text-sm font-bold text-[#273d33]" aria-label="Forum navigation">
          <Link href="/forum" className="hover:underline">Forum home</Link>
          <Link href="/forum/members" className="hover:underline">Member discussions</Link>
          {canSeeCommittee && <Link href="/forum/committee" className="hover:underline">Committee discussions</Link>}
        </nav>
        {isTest && <p className="mb-7 border border-[#c9ad84] bg-[#f8f2e7] px-4 py-3 text-sm font-semibold text-[#273d33]">Test forum: only you can see these test discussions. They are separate from the live member forum.</p>}
        {children}
      </div>
    </div>
  );
}
