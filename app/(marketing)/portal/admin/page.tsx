import { redirect } from 'next/navigation';
import { getCurrentPortalUser } from '@/lib/portal-auth';
import { prisma } from '@/lib/db';
import { pauseExpiredCommitteeReviews } from '@/lib/approval-workflow';
import { LogoutButton } from '@/components/portal/LogoutButton';
import { AdminActions } from '@/components/portal/AdminActions';
import { APPROVAL_QUORUM } from '@/config/committee-members';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin Dashboard' };

export default async function AdminPage() {
  const user = await getCurrentPortalUser();
  if (!user) redirect('/portal/admin/login?next=/portal/admin');
  if (user.role !== 'ADMIN') redirect('/portal');
  if (user.isTest) redirect('/portal/test');
  await pauseExpiredCommitteeReviews();
  const applications = await prisma.membershipApplication.findMany({
    include: { reviews: { include: { committeeMember: true }, orderBy: { createdAt: 'asc' } } },
    orderBy: { submittedAt: 'desc' },
  });

  return (
    <div className="membership-surface min-h-screen py-10 md:py-14">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-300 pb-6">
          <div><p className="membership-kicker !text-[#96501f]">Access controlled</p><h1 className="mt-2 text-3xl font-bold">AMSMA admin dashboard</h1><p className="mt-2 text-stone-600">Signed in as {user.name}</p></div>
          <LogoutButton />
        </div>
        <div className="mt-8 grid gap-5">
          {applications.length === 0 && <div className="membership-card p-8 text-stone-600">No membership applications have been submitted.</div>}
          {applications.map((application) => {
            const approvals = application.reviews.filter((review) => review.decision === 'APPROVE').length;
            const rejections = application.reviews.filter((review) => review.decision === 'REJECT').length;
            return (
              <article key={application.id} className="membership-card p-5 sm:p-7">
                <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
                  <div>
                    <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[.08em] text-[#96501f]"><span>{application.status.replaceAll('_', ' ')}</span><span>·</span><span>{application.tier.replaceAll('_', ' ')}</span></div>
                    <h2 className="mt-2 text-xl font-bold">{application.organizationName}</h2>
                    <p className="mt-1 text-sm text-stone-600">{application.applicationNo} · Submitted {application.submittedAt.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })} IST</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <Tally label="Approve" value={`${approvals}/${application.isTest ? 3 : APPROVAL_QUORUM}`} />
                    <Tally label="Reject" value={String(rejections)} />
                    <Tally label="Pending" value={String(application.reviews.length - approvals - rejections)} />
                  </div>
                </div>
                <details className="mt-5 border-t border-stone-200 pt-4">
                  <summary className="cursor-pointer font-semibold text-[#273d33]">View application and decisions</summary>
                  <div className="mt-5 grid gap-5 md:grid-cols-2 text-sm">
                    <div className="space-y-2"><p><strong>Contact:</strong> {application.contactName}</p><p><strong>Email:</strong> {application.contactEmail}</p><p><strong>Phone:</strong> {application.contactPhone}</p><p><strong>PAN:</strong> {application.pan}</p><p><strong>Address:</strong> {application.addressLine}, {application.city}, {application.state} {application.pincode}</p>{application.companyProofUrl && <p><a href={application.companyProofUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#96501f] underline">Open supporting document</a></p>}</div>
                    <div><p className="mb-2 font-semibold">Review history</p><ul className="space-y-2">{application.reviews.map((review) => <li key={review.id} className="border-l-2 border-stone-300 pl-3"><strong>{review.committeeMember.name}</strong> · {review.phase.toLowerCase()} · {review.decision.toLowerCase()}{review.decidedAt && ` · ${review.decidedAt.toLocaleDateString('en-IN')}`}{review.comment && <span className="block text-stone-600">{review.comment}</span>}</li>)}</ul></div>
                  </div>
                </details>
                {application.status === 'ADMIN_REVIEW' && <div className="mt-4 rounded-sm border border-[#c4733f]/30 bg-[#c4733f]/5 p-4"><p className="font-semibold">Committee result: {application.committeeResult}</p><p className="mt-1 text-sm text-stone-600">Confirm this recorded result to release the final email.</p><AdminActions applicationId={application.id} mode="CONFIRM" /></div>}
                {application.status === 'PAUSED_NO_QUORUM' && <div className="mt-4 rounded-sm border border-amber-300 bg-amber-50 p-4"><p className="font-semibold">The 48-hour window ended without quorum.</p><p className="mt-1 text-sm text-stone-600">The application is paused. You can open a new 48-hour window.</p><AdminActions applicationId={application.id} mode="EXTEND" /></div>}
                {application.status === 'SPONSOR_REVIEW' && application.sponsorReviewDeadlineAt && application.sponsorReviewDeadlineAt <= new Date() && <div className="mt-4 rounded-sm border border-amber-300 bg-amber-50 p-4"><p className="font-semibold">The sponsor review period has ended.</p><p className="mt-1 text-sm text-stone-600">You can give pending sponsors another seven days.</p><AdminActions applicationId={application.id} mode="EXTEND_SPONSOR" /></div>}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Tally({ label, value }: { label: string; value: string }) {
  return <div className="min-w-20 border border-stone-200 bg-white px-3 py-2"><div className="text-xs uppercase tracking-wide text-stone-500">{label}</div><div className="mt-1 font-bold">{value}</div></div>;
}
