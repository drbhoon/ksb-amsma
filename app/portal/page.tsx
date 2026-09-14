import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';
import { LogoutButton } from '@/components/portal/LogoutButton';
import { getCurrentPortalUser } from '@/lib/portal-auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Committee Dashboard' };

const statusLabel: Record<string, string> = {
  SPONSOR_REVIEW: 'Sponsor review',
  COMMITTEE_REVIEW: 'Committee review',
  PAUSED_NO_QUORUM: 'Paused: no quorum',
  ADMIN_REVIEW: 'Admin confirmation',
  PAYMENT_PENDING: 'Approved: payment pending',
  REJECTED: 'Rejected',
  ACTIVE: 'Active member',
};

export default async function CommitteePortalPage() {
  const user = await getCurrentPortalUser();
  if (!user) redirect('/portal/committee/login?next=/portal');
  if (user.isTest) redirect('/portal/test');
  if (user.role === 'ADMIN') redirect('/portal/admin');
  if (!user.committeeMemberId) {
    return <><Header /><main className="container-x py-16"><p>This account is not linked to a committee member.</p></main><Footer /></>;
  }
  const reviews = await prisma.applicationReview.findMany({
    where: { committeeMemberId: user.committeeMemberId },
    include: { application: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <><Header /><main className="membership-surface min-h-[70vh] py-12 md:py-16">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-300 pb-6">
          <div><p className="membership-kicker !text-[#96501f]">Committee portal</p><h1 className="mt-2 text-3xl font-bold">Welcome, {user.name}</h1></div>
          <LogoutButton />
        </div>
        <div className="mt-8 grid gap-4">
          {reviews.length === 0 && <div className="membership-card p-8 text-stone-600">There are no applications assigned to you.</div>}
          {reviews.map((review) => {
            const deadline = review.phase === 'SPONSOR' ? review.application.sponsorReviewDeadlineAt : review.application.committeeReviewDeadlineAt;
            return (
              <article key={review.id} className="membership-card p-5 sm:p-6 grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[.08em] text-[#96501f]">
                    <span>{review.phase === 'SPONSOR' ? 'Sponsor endorsement' : 'Committee vote'}</span><span>·</span><span>{statusLabel[review.application.status] || review.application.status}</span>
                  </div>
                  <h2 className="mt-2 text-xl font-bold">{review.application.organizationName}</h2>
                  <p className="mt-1 text-sm text-stone-600">{review.application.applicationNo} · Submitted {review.application.submittedAt.toLocaleDateString('en-IN')}</p>
                  {deadline && <p className="mt-2 text-sm text-stone-600">Deadline: {deadline.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })} IST</p>}
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-sm font-bold ${review.decision === 'APPROVE' ? 'text-emerald-700' : review.decision === 'REJECT' ? 'text-red-700' : 'text-stone-500'}`}>{review.decision === 'PENDING' ? 'Pending' : review.decision === 'APPROVE' ? 'Approved' : 'Rejected'}</span>
                  <Link href={`/review/${review.token}`} className="btn-primary">{review.decision === 'PENDING' ? 'Open review' : 'View decision'}</Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main><Footer /></>
  );
}
