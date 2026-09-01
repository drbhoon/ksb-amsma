import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { MEMBERSHIP_TIERS, formatInr } from '@/config/membership';
import { APPROVAL_QUORUM, APPROVERS } from '@/config/committee-members';
import { tallyReviews } from '@/lib/membership';
import { ReviewActions } from './ReviewActions';
import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';

export const dynamic = 'force-dynamic';

type Props = { params: { token: string } };

export default async function ReviewPage({ params }: Props) {
  const review = await prisma.applicationReview.findUnique({
    where: { token: params.token },
    include: {
      committeeMember: true,
      application: true,
    },
  });

  if (!review) notFound();

  const now = new Date();
  const expired = review.tokenExpiresAt < now;
  const alreadyDecided = review.decision !== 'PENDING';
  const app = review.application;
  const tier = MEMBERSHIP_TIERS[app.tier];

  const { approvals, rejections, pending } = await tallyReviews(app.id);

  return (
    <><Header /><main className="min-h-screen membership-surface py-12 md:py-16">
      <div className="container-x max-w-3xl">
        {/* Header card */}
        <div className="membership-hero p-8">
          <div className="text-xs uppercase tracking-[0.12em] text-amber-light mb-2">
            Managing Committee — Application Review
          </div>
          <h1 className="font-display font-bold text-3xl mb-2 tracking-tight">
            {app.applicationNo}
          </h1>
          <div className="text-white/70 text-sm">
            Reviewing as: <span className="text-white font-medium">{review.committeeMember.name}</span>
          </div>
        </div>

        {/* Body card */}
        <div className="membership-card border-t-0 p-5 sm:p-8 space-y-8">
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
          ) : app.status === 'PAYMENT_PENDING' || app.status === 'ACTIVE' ? (
            <StatusBanner variant="info">
              This application has already reached the required approval quorum and is being processed.
            </StatusBanner>
          ) : app.status === 'REJECTED' ? (
            <StatusBanner variant="info">
              This application has been rejected by the committee.
            </StatusBanner>
          ) : null}

          {/* Live tally */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <TallyCard label="Approvals" count={approvals} target={APPROVAL_QUORUM} colour="success" />
            <TallyCard label="Rejections" count={rejections} target={APPROVERS.length - APPROVAL_QUORUM + 1} colour="danger" />
            <TallyCard label="Pending" count={pending} target={APPROVERS.length} colour="stone" />
          </div>

          {/* Applicant details */}
          <div>
            <SectionTitle>Applicant</SectionTitle>
            <DetailRow k="Organisation" v={app.organizationName} />
            <DetailRow k="Category" v={tier.label} />
            <DetailRow k="Annual fee" v={formatInr(tier.annualFeeRupees)} />
            <DetailRow k="Contact person" v={`${app.contactName} · ${app.contactEmail} · ${app.contactPhone}`} />
            <DetailRow k="PAN" v={app.pan} />
            {app.gstNumber && <DetailRow k="GST" v={app.gstNumber} />}
            {app.crushingCapacityMtMonth != null && (
              <DetailRow k="Crushing capacity" v={`${app.crushingCapacityMtMonth.toLocaleString('en-IN')} MT/month`} />
            )}
            {app.natureOfBusiness && <DetailRow k="Nature of business" v={app.natureOfBusiness} />}
            <DetailRow k="Address" v={`${app.addressLine}, ${app.city}, ${app.state} – ${app.pincode}`} />
          </div>

          <div>
            <SectionTitle>Authorised Signatory</SectionTitle>
            <DetailRow k="Name" v={`${app.signatoryName} (${app.signatoryDesignation})`} />
            <DetailRow k="Contact" v={`${app.signatoryEmail} · ${app.signatoryPhone}`} />
          </div>

          <div>
            <SectionTitle>Supporting Document</SectionTitle>
            <DetailRow k="Type" v={app.companyProofType?.replace('_', ' ') || '—'} />
            <DetailRow
              k="URL"
              v={
                <a href={app.companyProofUrl || '#'} target="_blank" rel="noopener noreferrer"
                   className="text-amber hover:underline break-all">
                  {app.companyProofUrl}
                </a>
              }
            />
          </div>

          <div>
            <SectionTitle>Proposer &amp; Seconder</SectionTitle>
            <DetailRow k="Proposer" v={`${app.proposerName} — ${app.proposerEmail}`} />
            <DetailRow k="Seconder" v={`${app.seconderName} — ${app.seconderEmail}`} />
          </div>

          {/* Vote actions */}
          {!expired && !alreadyDecided && app.status === 'UNDER_REVIEW' && (
            <ReviewActions token={params.token} applicationNo={app.applicationNo} />
          )}
        </div>

        <p className="text-xs text-stone-500 mt-6 text-center">
          Per Rule 4 of the Rules &amp; Regulations, admission requires a two-thirds majority
          approval of the Managing Committee ({APPROVAL_QUORUM} of {APPROVERS.length} members).
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
    <div className={`border p-4 text-center ${colourMap[colour]}`}>
      <div className="text-xs uppercase tracking-[0.1em] font-semibold">{label}</div>
      <div className="font-display font-bold text-2xl mt-1">{count}<span className="text-sm font-normal opacity-60"> / {target}</span></div>
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
