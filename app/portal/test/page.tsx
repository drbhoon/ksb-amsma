import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';
import { LogoutButton } from '@/components/portal/LogoutButton';
import { AdminActions } from '@/components/portal/AdminActions';
import { getCurrentPortalUser } from '@/lib/portal-auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Test Approval Portal' };

export default async function PortalTestPage() {
  const user = await getCurrentPortalUser();
  if (!user) redirect('/portal/login?next=/portal/test');
  if (!user.isTest) redirect(user.role === 'ADMIN' ? '/portal/admin' : '/portal');

  const reviews = user.committeeMemberId
    ? await prisma.applicationReview.findMany({
        where: { committeeMemberId: user.committeeMemberId, application: { isTest: true } },
        include: { application: true },
        orderBy: { createdAt: 'desc' },
      })
    : [];
  const adminApplications = user.role === 'ADMIN'
    ? await prisma.membershipApplication.findMany({
        where: { isTest: true },
        include: { reviews: true },
        orderBy: { submittedAt: 'desc' },
      })
    : [];

  return (
    <><Header /><main className="membership-surface min-h-[70vh] py-12 md:py-16">
      <div className="container-x max-w-4xl">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-300 pb-6">
          <div>
            <p className="membership-kicker !text-[#96501f]">Test approval portal</p>
            <h1 className="mt-2 text-3xl font-bold">Welcome, {user.name}</h1>
            <p className="mt-2 text-stone-600">Only isolated test applications appear here.</p>
          </div>
          <LogoutButton />
        </div>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-[#273d33]">Your assigned reviews</h2>
          <div className="mt-4 grid gap-4">
            {reviews.length === 0 && <div className="membership-card p-6 text-stone-600">No test review is assigned to you yet.</div>}
            {reviews.map((review) => (
              <article key={review.id} className="membership-card grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.08em] text-[#96501f]">{review.phase === 'SPONSOR' ? 'Sponsor endorsement' : 'Committee vote'} · {review.decision}</p>
                  <h3 className="mt-2 text-lg font-bold">{review.application.organizationName}</h3>
                  <p className="mt-1 text-sm text-stone-600">{review.application.applicationNo}</p>
                </div>
                <Link href={`/review/${review.token}`} className="btn-primary">{review.decision === 'PENDING' ? 'Open review' : 'View decision'}</Link>
              </article>
            ))}
          </div>
        </section>

        {user.role === 'ADMIN' && (
          <section className="mt-10 border-t border-stone-300 pt-8">
            <h2 className="text-xl font-bold text-[#273d33]">Test admin actions</h2>
            <div className="mt-4 grid gap-4">
              {adminApplications.map((application) => {
                const approvals = application.reviews.filter((review) => review.decision === 'APPROVE').length;
                return (
                  <article key={application.id} className="membership-card p-5 sm:p-6">
                    <p className="text-xs font-bold uppercase tracking-[.08em] text-[#96501f]">{application.status.replaceAll('_', ' ')}</p>
                    <h3 className="mt-2 text-lg font-bold">{application.organizationName}</h3>
                    <p className="mt-1 text-sm text-stone-600">{application.applicationNo} · {approvals}/3 test approvals</p>
                    {application.status === 'ADMIN_REVIEW' && (
                      <div className="mt-4 border-t border-stone-200 pt-4">
                        <p className="font-semibold">Test committee result: {application.committeeResult}</p>
                        <AdminActions applicationId={application.id} mode="CONFIRM" />
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main><Footer /></>
  );
}
