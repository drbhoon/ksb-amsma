import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { MEMBERSHIP_TIERS, formatInr } from '@/config/membership';
import { APPROVAL_QUORUM, APPROVERS } from '@/config/committee-members';
import { tallyReviews } from '@/lib/membership';
import { ReviewActions } from './ReviewActions';
import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';
import { getCurrentPortalUser } from '@/lib/portal-auth';
import { recordAudit } from '@/lib/audit';
import { LogoutButton } from '@/components/portal/LogoutButton';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ token: string }> };

export default async function ReviewPage({ params }: Props) {
  const { token } = await params;
  const review = await prisma.applicationReview.findUnique({
    where: { token },
    include: {
      committeeMember: { include: { portalUser: true } },
      application: true,
    },
  });

  if (!review) notFound();
  const loginPath = review.committeeMember.portalUser?.role === 'ADMIN' ? '/portal/admin/login' : '/portal/committee/login';
  const reviewPath = `/review/${token}`;
  const user = await getCurrentPortalUser();
  if (!user) {
    redirect(`${loginPath}?next=${encodeURIComponent(reviewPath)}`);
  }
  const wrongWorkflow = user.isTest !== review.application.isTest;
  const wrongReviewer = (user.isTest || user.role !== 'ADMIN') && user.committeeMemberId !== review.committeeMemberId;
  if (wrongWorkflow || wrongReviewer) {
    const switchPath = `${loginPath}?next=${encodeURIComponent(reviewPath)}`;
    return <ReviewerAccountMismatch reviewerName={review.committeeMember.name} switchPath={switchPath} />;
  }
  await recordAudit({ applicationId: review.applicationId, actorUserId: user.id, event: 'APPLICATION_REVIEW_VIEWED' });

  const now = new Date();
  const expired = review.tokenExpiresAt < now;
  const alreadyDecided = review.decision !== 'PENDING';
  const app = review.application;
  const tier = MEMBERSHIP_TIERS[app.tier];
  const approvalTarget = app.isTest ? 3 : APPROVAL_QUORUM;
  const reviewerTarget = app.isTest ? 3 : APPROVERS.length;

  const { approvals, rejections, pending } = await tallyReviews(app.id);

  return (
    <><Header /><main className="min-h-screen membership-surface py-7 sm:py-10 md:py-16">
      <div className="container-x max-w-3xl">
        {/* Header card */}
        <div className="membership-hero p-5 sm:p-8">
          <div className="mb-2 text-[0.7rem] uppercase tracking-[0.1em] text-amber-light sm:text-xs sm:tracking-[0.12em]">
            {review.phase === 'SPONSOR' ? 'Sponsor endorsement' : 'Managing Committee review'}
          </div>
          <h1 className="mb-2 break-words font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {app.applicationNo}
          </h1>
          <div className="text-white/70 text-sm">
            Reviewing as: <span className="text-white font-medium">{review.committeeMember.name}</span>
          </div>
        </div>

        {/* Body card */}
        <div className="membership-card space-y-7 border-t-0 p-4 sm:space-y-8 sm:p-8">
          {expired ? (
            <StatusBanner variant="warning">
              This review link expired on {review.tokenExpiresAt.toLocaleDateString('en-IN')}.
              Please contact the Secretariat if you need to record a vote.
            </StatusBanner>
          ) : alreadyDecided ? (
            <StatusBanner variant={review.decision === 'APPROVE' ? 'success' : 'info'}>
              You have already recorded your vote as{' '}
              <strong>{review.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED'}</strong>
              {review.decidedAt && ` on ${review.decidedAt.toLocaleDateString('en-IN')}`}.
            </StatusBanner>
          ) : app.status === 'ADMIN_REVIEW' ? (
            <StatusBanner variant="info">The committee reached a result. Admin confirmation is pending.</StatusBanner>
          ) : app.status === 'PAUSED_NO_QUORUM' ? (
            <StatusBanner variant="warning">The 48-hour review ended without quorum. The application is paused.</StatusBanner>
          ) : app.status === 'PAYMENT_PENDING' || app.status === 'ACTIVE' ? (
            <StatusBanner variant="info">
              This application has already reached the required approval quorum and is being processed.
            </StatusBanner>
          ) : app.status === 'REJECTED' ? (
            <StatusBanner variant="info">
              This application has been rejected by the committee.
            </StatusBanner>
          ) : null}

          {(alreadyDecided || user.role === 'ADMIN') && (
            <div className="grid grid-cols-3 gap-2 pt-2 sm:gap-3">
              <TallyCard label="Approvals" count={approvals} target={approvalTarget} colour="success" />
              <TallyCard label="Rejections" count={rejections} target={reviewerTarget - approvalTarget + 1} colour="danger" />
              <TallyCard label="Pending" count={pending} target={reviewerTarget} colour="stone" />
            </div>
          )}

          {/* Applicant details */}
          <div>
            <SectionTitle>Applicant</SectionTitle>
            <DetailRow k="Organisation" v={app.organizationName} />
            <DetailRow k="Category" v={tier.label} />
            <DetailRow k="Annual fee" v={formatInr(tier.annualFeeRupees)} />
            <DetailRow k="Contact person" v={user.role === 'ADMIN' ? `${app.contactName} · ${app.contactEmail} · ${app.contactPhone}` : app.contactName} />
            <DetailRow k="PAN" v={user.role === 'ADMIN' ? app.pan : `${app.pan.slice(0, 3)}••••${app.pan.slice(-3)}`} />
            {app.gstNumber && <DetailRow k="GST" v={app.gstNumber} />}
            {app.crushingCapacityMtMonth != null && (
              <DetailRow k="Crushing capacity" v={`${app.crushingCapacityMtMonth.toLocaleString('en-IN')} MT/month`} />
            )}
            {app.natureOfBusiness && <DetailRow k="Nature of business" v={app.natureOfBusiness} />}
            <DetailRow k="Address" v={user.role === 'ADMIN' ? `${app.addressLine}, ${app.city}, ${app.state} – ${app.pincode}` : `${app.city}, ${app.state}`} />
          </div>

          <div>
            <SectionTitle>Authorised Signatory</SectionTitle>
            <DetailRow k="Name" v={`${app.signatoryName} (${app.signatoryDesignation})`} />
            {user.role === 'ADMIN' && <DetailRow k="Contact" v={`${app.signatoryEmail} · ${app.signatoryPhone}`} />}
          </div>

          <div>
            <SectionTitle>Supporting Document</SectionTitle>
            <DetailRow k="Type" v={app.companyProofType?.replace('_', ' ') || '—'} />
            {user.role === 'ADMIN'
              ? <DetailRow k="URL" v={<a href={app.companyProofUrl || '#'} target="_blank" rel="noopener noreferrer" className="text-amber hover:underline break-all">{app.companyProofUrl}</a>} />
              : <DetailRow k="Access" v="The admin verifies the full supporting document." />}
          </div>

          <div>
            <SectionTitle>Proposer &amp; Seconder</SectionTitle>
            <DetailRow k="Proposer" v={app.proposerName} />
            <DetailRow k="Seconder" v={app.seconderName} />
          </div>

          {/* Vote actions */}
          {!expired && !alreadyDecided && (user.role === 'COMMITTEE' || user.isTest) &&
            ((review.phase === 'SPONSOR' && app.status === 'SPONSOR_REVIEW') ||
             (review.phase === 'COMMITTEE' && app.status === 'COMMITTEE_REVIEW')) && (
            <ReviewActions token={token} applicationNo={app.applicationNo} phase={review.phase} />
          )}
        </div>

        <p className="text-xs text-stone-500 mt-6 text-center">
          The current review quorum is {approvalTarget} of {reviewerTarget} eligible committee members{app.isTest ? ' for this test application' : ''}.
        </p>
      </div>
    </main><Footer /></>
  );
}

// ---- Presentational bits ----

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display font-semibold text-lg mb-3 pb-2 border-b border-stone-100">
      {children}
    </h2>
  );
}

function DetailRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 py-2">
      <div className="text-sm text-stone-500">{k}</div>
      <div className="md:col-span-3 text-sm text-stone-900">{v}</div>
    </div>
  );
}

function TallyCard({ label, count, target, colour }: { label: string; count: number; target: number; colour: 'success' | 'danger' | 'stone' }) {
  const colourMap = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    danger:  'bg-red-50 text-red-800 border-red-200',
    stone:   'bg-stone-50 text-stone-700 border-stone-200',
  };
  return (
    <div className={`min-w-0 border px-1.5 py-3 text-center sm:p-4 ${colourMap[colour]}`}>
      <div className="text-[0.62rem] font-semibold uppercase tracking-[0.04em] sm:text-xs sm:tracking-[0.1em]">{label}</div>
      <div className="mt-1 font-display text-xl font-bold sm:text-2xl">{count}<span className="text-xs font-normal opacity-60 sm:text-sm"> / {target}</span></div>
    </div>
  );
}

function StatusBanner({ variant, children }: { variant: 'success' | 'warning' | 'info'; children: React.ReactNode }) {
  const map = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    info:    'bg-stone-50 border-stone-200 text-stone-800',
  };
  return (
    <div className={`p-4 border ${map[variant]} text-sm`}>
      {children}
    </div>
  );
}

function ReviewerAccountMismatch({ reviewerName, switchPath }: { reviewerName: string; switchPath: string }) {
  return (
    <><Header /><main className="membership-surface min-h-[70vh] py-14 md:py-20">
      <div className="container-x max-w-lg">
        <p className="membership-kicker !text-[#96501f]">Secure review</p>
        <h1 className="mt-2 text-3xl font-bold">Use the assigned reviewer account</h1>
        <div className="membership-card mt-7 p-6 sm:p-8">
          <p className="leading-relaxed text-stone-700">
            This review is assigned to <strong>{reviewerName}</strong>. Another reviewer is currently signed in on this browser.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-stone-600">
            Sign out, then request a code for the assigned email address.
          </p>
          <div className="mt-6">
            <LogoutButton
              nextPath={switchPath}
              label={`Continue as ${reviewerName}`}
              className="btn-primary w-full justify-center"
            />
          </div>
        </div>
      </div>
    </main><Footer /></>
  );
}
