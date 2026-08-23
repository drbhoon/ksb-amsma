import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { MEMBERSHIP_TIERS, formatInr } from '@/config/membership';
import { APPROVAL_QUORUM, REJECTION_THRESHOLD } from '@/config/committee-members';
import { emailMode, emailProvider } from '@/lib/email';
import { siteUrl } from '@/lib/site-url';
import { paymentsEnabled, testPaymentsEnabled } from '@/lib/membership';
import { testProposerEmails } from '@/lib/test-overrides';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'AMSMA — Test Console',
  robots: { index: false, follow: false },
};

/**
 * Testing console — Railway only.
 *
 * The committee review step is a magic link delivered by email. Until amsma.in
 * is verified with Resend no email can be delivered, which would leave the whole
 * Phase 3 flow untestable. This page reads the same links straight from the
 * database so testing can proceed without working email.
 *
 * Access requires DEV_ACCESS_KEY to be set AND matched via ?key=. With the env
 * var unset the route 404s, so it stays inert unless deliberately switched on.
 * Turn it off before amsma.in goes public.
 */

type Props = { searchParams: { key?: string } };

export default async function DevLinksPage({ searchParams }: Props) {
  const expected = process.env.DEV_ACCESS_KEY;
  if (!expected || searchParams.key !== expected) notFound();

  const site = siteUrl();

  const [applications, committee, subscriberCount, members] = await Promise.all([
    prisma.membershipApplication.findMany({
      orderBy: { submittedAt: 'desc' },
      include: {
        reviews: {
          include: { committeeMember: true },
          orderBy: { committeeMember: { name: 'asc' } },
        },
      },
    }),
    prisma.committeeMember.findMany({ orderBy: { name: 'asc' } }),
    prisma.newsletterSubscriber.count(),
    prisma.member.findMany({ orderBy: { memberNo: 'asc' } }),
  ]);

  const mode = emailMode();
  const provider = emailProvider();
  const overrideEmails = testProposerEmails();

  return (
    <div className="min-h-screen bg-stone-100 py-10">
      <div className="mx-auto max-w-5xl px-4 space-y-8">
        <header>
          <h1 className="font-display font-bold text-2xl tracking-tight">AMSMA Test Console</h1>
          <p className="text-sm text-stone-600 mt-1">
            Internal testing aid — not linked from the site, not indexed.
          </p>
        </header>

        {overrideEmails.length > 0 && (
          <div className="p-4 bg-red-50 border-2 border-red-400 rounded-lg">
            <p className="font-semibold text-red-900">Rule 4 override is ACTIVE</p>
            <p className="text-sm text-red-800 mt-1">
              These addresses are being accepted as Proposer or Seconder even though they are
              not committee members:{' '}
              {overrideEmails.map((e) => (
                <code key={e} className="font-mono text-xs bg-white px-1.5 py-0.5 rounded mr-1">
                  {e}
                </code>
              ))}
            </p>
            <p className="text-sm text-red-800 mt-2">
              They cannot vote and the approval quorum is unchanged at {APPROVAL_QUORUM} of{' '}
              {committee.length}. Remove the <code className="font-mono text-xs">TEST_PROPOSER_EMAILS</code>{' '}
              variable to enforce Rule 4 again before the site goes public.
            </p>
          </div>
        )}

        <Card title="Environment">
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Stat k="Committee seeded" v={`${committee.length} / 8`} bad={committee.length !== 8} />
            <Stat k="Approvals needed" v={String(APPROVAL_QUORUM)} />
            <Stat k="Rejections block at" v={String(REJECTION_THRESHOLD)} />
            <Stat k="Newsletter signups" v={String(subscriberCount)} />
            <Stat
              k="Email mode"
              v={mode}
              bad={mode === 'off'}
              note={
                mode === 'off'
                  ? 'Nothing is sent — use the links below'
                  : mode === 'redirect'
                    ? 'All mail redirected to testers'
                    : 'LIVE — real recipients'
              }
            />
            <Stat
              k="Payments"
              v={paymentsEnabled() ? 'Razorpay live' : testPaymentsEnabled() ? 'Test mode' : 'Disabled'}
              bad={!paymentsEnabled() && !testPaymentsEnabled()}
            />
            <Stat
              k="Mail provider"
              v={provider === 'none' ? 'not configured' : provider}
              bad={provider === 'none'}
              note={provider === 'none' ? 'Nothing can be delivered' : undefined}
            />
            <Stat k="Members registered" v={String(members.length)} />
            <Stat k="Applications" v={String(applications.length)} />
          </dl>
        </Card>

        <Card title="Committee members — use any two as Proposer & Seconder">
          {committee.length === 0 ? (
            <Warn>
              No committee members in the database — the seed did not run. An application
              cannot be submitted until it does.
            </Warn>
          ) : (
            <ul className="grid md:grid-cols-2 gap-x-6 gap-y-1 text-sm">
              {committee.map((c) => (
                <li
                  key={c.id}
                  className="flex justify-between gap-3 py-1 border-b border-stone-100"
                >
                  <span className="text-stone-700">{c.name}</span>
                  <code className="font-mono text-xs text-stone-500">{c.email}</code>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={`Applications (${applications.length})`}>
          {applications.length === 0 ? (
            <p className="text-sm text-stone-600">
              None yet. Submit one at{' '}
              <a className="text-amber-700 underline" href="/membership/apply">
                /membership/apply
              </a>
              .
            </p>
          ) : (
            <div className="space-y-6">
              {applications.map((app) => {
                const approvals = app.reviews.filter((r) => r.decision === 'APPROVE').length;
                const rejections = app.reviews.filter((r) => r.decision === 'REJECT').length;
                return (
                  <div key={app.id} className="border border-stone-200 rounded-lg overflow-hidden">
                    <div className="bg-stone-50 px-4 py-3 flex flex-wrap items-baseline justify-between gap-2">
                      <div>
                        <span className="font-mono text-sm font-semibold">{app.applicationNo}</span>
                        <span className="text-stone-600 text-sm"> — {app.organizationName}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-stone-600">
                          {MEMBERSHIP_TIERS[app.tier].label} ·{' '}
                          {formatInr(MEMBERSHIP_TIERS[app.tier].annualFeeRupees)}
                        </span>
                        <span className="px-2 py-1 rounded bg-stone-900 text-white font-medium">
                          {app.status}
                        </span>
                      </div>
                    </div>

                    <div className="px-4 py-3 text-xs text-stone-600 border-b border-stone-100">
                      Tally: <strong>{approvals}</strong> approved / <strong>{rejections}</strong>{' '}
                      rejected — needs {APPROVAL_QUORUM} to approve, {REJECTION_THRESHOLD} to block.
                    </div>

                    <ul className="divide-y divide-stone-100">
                      {app.reviews.map((r) => (
                        <li
                          key={r.id}
                          className="px-4 py-2 flex flex-wrap items-center gap-3 text-sm"
                        >
                          <span className="flex-1 min-w-[180px] text-stone-700">
                            {r.committeeMember.name}
                          </span>
                          <span
                            className={
                              'text-xs font-medium px-2 py-0.5 rounded ' +
                              (r.decision === 'APPROVE'
                                ? 'bg-green-100 text-green-800'
                                : r.decision === 'REJECT'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-stone-100 text-stone-600')
                            }
                          >
                            {r.decision}
                          </span>
                          {r.decision === 'PENDING' ? (
                            <a
                              href={`${site}/review/${r.token}`}
                              className="text-xs text-amber-700 underline font-medium"
                            >
                              open review link →
                            </a>
                          ) : (
                            <span className="text-xs text-stone-400">link used</span>
                          )}
                        </li>
                      ))}
                    </ul>

                    {app.paymentToken && (
                      <div className="px-4 py-3 bg-amber-50 border-t border-amber-200 text-sm">
                        <a
                          href={`${site}/membership/pay/${app.paymentToken}`}
                          className="text-amber-800 underline font-medium"
                        >
                          open payment link →
                        </a>
                        {app.paymentExpiresAt && (
                          <span className="text-xs text-amber-700 ml-2">
                            expires {app.paymentExpiresAt.toLocaleDateString('en-IN')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {members.length > 0 && (
          <Card title={`Register of Members (${members.length})`}>
            <ul className="text-sm divide-y divide-stone-100">
              {members.map((m) => (
                <li key={m.id} className="py-2 flex flex-wrap justify-between gap-2">
                  <span>
                    <code className="font-mono text-xs">{m.memberNo}</code> — {m.organizationName}
                  </span>
                  <span className="text-xs text-stone-500">
                    {MEMBERSHIP_TIERS[m.tier].label} · expires{' '}
                    {m.expiresAt.toLocaleDateString('en-IN')}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-stone-200 p-6">
      <h2 className="font-display font-semibold text-lg mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Stat({ k, v, bad, note }: { k: string; v: string; bad?: boolean; note?: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.1em] text-stone-500">{k}</dt>
      <dd className={'font-semibold mt-1 ' + (bad ? 'text-red-700' : 'text-stone-900')}>{v}</dd>
      {note && <dd className="text-[11px] text-stone-500 mt-0.5">{note}</dd>}
    </div>
  );
}

function Warn({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
      {children}
    </div>
  );
}
