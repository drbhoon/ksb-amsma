import { redirect } from 'next/navigation';
import { getCurrentPortalUser } from '@/lib/portal-auth';
import { prisma } from '@/lib/db';
import { LogoutButton } from '@/components/portal/LogoutButton';
import { AdminPortalNav } from '@/components/portal/AdminPortalNav';
import { MemberAdminForm } from '@/components/portal/MemberAdminForm';
import { MemberActions } from '@/components/portal/MemberActions';
import { deleteMember } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Approved Members' };

function label(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function AdminMembersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await getCurrentPortalUser();
  if (!user) redirect('/portal/admin/login?next=/portal/admin/members');
  if (user.role !== 'ADMIN') redirect('/portal');
  if (user.isTest) redirect('/portal/test');

  const query = String((await searchParams).q || '').trim().slice(0, 100);
  const memberWhere = {
    status: { not: 'TERMINATED' as const },
    ...(query ? { OR: [
      { memberNo: { contains: query, mode: 'insensitive' as const } },
      { organizationName: { contains: query, mode: 'insensitive' as const } },
      { contactName: { contains: query, mode: 'insensitive' as const } },
      { email: { contains: query, mode: 'insensitive' as const } },
      { city: { contains: query, mode: 'insensitive' as const } },
      { state: { contains: query, mode: 'insensitive' as const } },
    ] } : {}),
  };
  const [members, committee, memberCount] = await Promise.all([
    prisma.member.findMany({ where: memberWhere, orderBy: [{ status: 'asc' }, { organizationName: 'asc' }] }),
    prisma.committeeMember.findMany({ where: { isTest: false }, orderBy: { createdAt: 'asc' }, include: { portalUser: { select: { active: true, lastLoginAt: true } } } }),
    prisma.member.count({ where: { status: { not: 'TERMINATED' } } }),
  ]);

  return <div className="membership-surface min-h-screen py-10 md:py-14"><div className="container-x">
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-300 pb-6">
      <div><p className="membership-kicker !text-[#96501f]">Access controlled</p><h1 className="mt-2 text-3xl font-bold">AMSMA admin dashboard</h1><p className="mt-2 text-stone-600">Signed in as {user.name}</p></div><LogoutButton />
    </div>
    <AdminPortalNav current="members" />

    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="membership-kicker !text-[#96501f]">Register of members</p><h2 className="mt-2 text-2xl font-bold text-[#273d33]">{memberCount} approved {memberCount === 1 ? 'member' : 'members'}</h2><p className="mt-2 text-sm text-stone-600">This list includes every approved membership category and its current status.</p></div>
        <a href="/api/admin/exports/members?list=members" className="rounded-full bg-[#273d33] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#365447]">Export members CSV</a>
      </div>
      <MemberAdminForm />
      <form method="get" className="mt-6 flex max-w-3xl flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="member-search">Search members</label>
        <input id="member-search" name="q" defaultValue={query} placeholder="Search number, organisation, name, email, city, or state" className="min-w-0 flex-1 border border-stone-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#c9ad84]" />
        <button type="submit" className="rounded-full bg-[#273d33] px-5 py-2.5 text-sm font-bold text-white">Search</button>
        {query && <a href="/portal/admin/members" className="self-center text-sm font-bold text-[#96501f] hover:underline">Clear</a>}
      </form>
      <div className="membership-card mt-5 overflow-x-auto">
        {members.length === 0 ? <p className="p-7 text-stone-600">{query ? `No approved members match “${query}”.` : 'No approved members are in the register.'}</p> : <table className="min-w-[1200px] w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-[#f8f2e7] text-xs uppercase tracking-wide text-[#273d33]"><tr><th className="p-4">Member</th><th className="p-4">Organisation</th><th className="p-4">Category</th><th className="p-4">Contact</th><th className="p-4">Location</th><th className="p-4">Admitted</th><th className="p-4">Expiry</th><th className="p-4">Status</th><th className="p-4">Action</th></tr></thead>
          <tbody>{members.map((member) => <tr key={member.id} className="border-b border-stone-100 align-top last:border-0">
            <td className="p-4 font-bold text-[#273d33]">{member.memberNo}</td><td className="p-4"><strong>{member.organizationName}</strong><span className="mt-1 block text-stone-500">{member.contactName}</span></td><td className="p-4">{label(member.tier)}</td>
            <td className="p-4"><a className="text-[#96501f] hover:underline" href={`mailto:${member.email}`}>{member.email}</a><span className="mt-1 block">{member.phone}</span></td><td className="p-4">{member.city}, {member.state}</td><td className="p-4">{member.admittedAt.toLocaleDateString('en-IN')}</td><td className="p-4">{member.expiresAt.toLocaleDateString('en-IN')}</td>
            <td className="p-4"><span className={member.status === 'ACTIVE' ? 'rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800' : 'rounded-full bg-stone-200 px-3 py-1 text-xs font-bold text-stone-700'}>{member.status}</span></td><td className="p-4"><MemberActions id={member.id} label={member.organizationName} deleteAction={deleteMember} /></td>
          </tr>)}</tbody>
        </table>}
      </div>
    </section>

    <section className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="membership-kicker !text-[#96501f]">Managing Committee</p><h2 className="mt-2 text-2xl font-bold text-[#273d33]">{committee.length} committee {committee.length === 1 ? 'member' : 'members'}</h2></div><a href="/api/admin/exports/members?list=committee" className="rounded-full border border-[#273d33] bg-white px-5 py-2.5 text-sm font-bold text-[#273d33] hover:bg-[#f8f2e7]">Export committee CSV</a></div>
      <div className="membership-card mt-5 overflow-x-auto"><table className="min-w-[900px] w-full text-left text-sm">
        <thead className="border-b border-stone-200 bg-[#f8f2e7] text-xs uppercase tracking-wide text-[#273d33]"><tr><th className="p-4">Name</th><th className="p-4">Role</th><th className="p-4">Professional title</th><th className="p-4">Email</th><th className="p-4">Portal access</th><th className="p-4">Last sign-in</th></tr></thead>
        <tbody>{committee.map((member) => <tr key={member.id} className="border-b border-stone-100 align-top last:border-0"><td className="p-4 font-bold text-[#273d33]">{member.name}</td><td className="p-4">{label(member.role)}</td><td className="p-4">{member.title}</td><td className="p-4"><a className="text-[#96501f] hover:underline" href={`mailto:${member.email}`}>{member.email}</a></td><td className="p-4">{member.portalUser?.active ? 'Active' : 'Inactive'}</td><td className="p-4">{member.portalUser?.lastLoginAt ? member.portalUser.lastLoginAt.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }) : 'Never'}</td></tr>)}</tbody>
      </table></div>
    </section>
  </div></div>;
}
