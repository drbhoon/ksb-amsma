// Destructive end-to-end test for a disposable database only.
// Tests: submit -> two sponsor endorsements -> 48-hour committee stage ->
// five-of-eight quorum -> admin confirmation -> payment pending.

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000';
const PASSWORD = process.env.PORTAL_SEED_PASSWORD;
const CRON_SECRET = process.env.CRON_SECRET;
if (!PASSWORD) throw new Error('Set PORTAL_SEED_PASSWORD before this test.');
if (!CRON_SECRET) throw new Error('Set CRON_SECRET before this test.');

let failures = 0;
const ok = (condition, message) => {
  console.log(`${condition ? '  PASS' : '  FAIL'}  ${message}`);
  if (!condition) failures += 1;
};

async function login(email) {
  const response = await fetch(`${BASE}/api/portal/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  const data = await response.json();
  ok(response.status === 200, `login ${email} -> ${response.status}`);
  return { cookie: (response.headers.get('set-cookie') || '').split(';')[0], data };
}

async function vote(review, decision = 'APPROVE', comment) {
  const account = await login(review.committeeMember.email);
  const response = await fetch(`${BASE}/api/review/${review.token}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: account.cookie },
    body: JSON.stringify({ decision, comment }),
  });
  return { response, data: await response.json() };
}

await prisma.portalSession.deleteMany({});
await prisma.auditEvent.deleteMany({});
await prisma.member.deleteMany({});
await prisma.applicationReview.deleteMany({});
await prisma.membershipApplication.deleteMany({});

const committee = await prisma.committeeMember.findMany({
  where: { canApproveApplications: true }, orderBy: { name: 'asc' },
});
ok(committee.length === 8, `eligible committee count = ${committee.length}`);
const proposer = committee[0];
const seconder = committee[1];

const payload = {
  tier: 'ASSOCIATE', organizationName: 'Workflow Test Aggregates LLP',
  contactName: 'Test Applicant', contactEmail: 'applicant@workflow.test', contactPhone: '9876543210',
  addressLine: '1 Test Road', city: 'Thane', state: 'Maharashtra', pincode: '400610',
  pan: 'AABCT1234F', gstNumber: '', crushingCapacityMtMonth: '', natureOfBusiness: 'Test consultancy',
  signatoryName: 'Test Applicant', signatoryDesignation: 'Director',
  signatoryEmail: 'applicant@workflow.test', signatoryPhone: '9876543210',
  companyProofUrl: 'https://example.com/test-proof.pdf', companyProofType: 'incorporation',
  proposerSlug: proposer.slug,
  seconderSlug: seconder.slug,
  agreeRules: true, agreePrivacy: true,
};
const submission = await fetch(`${BASE}/api/membership/apply`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
});
const submitted = await submission.json();
ok(submission.status === 200, `application submit -> ${submission.status}`);
let application = await prisma.membershipApplication.findUnique({
  where: { applicationNo: submitted.applicationNo },
  include: { reviews: { include: { committeeMember: true } } },
});
ok(application.status === 'SPONSOR_REVIEW', `initial status = ${application.status}`);
ok(application.reviews.length === 2 && application.reviews.every((r) => r.phase === 'SPONSOR'), 'only two sponsor reviews created');

const unauthorised = await fetch(`${BASE}/api/review/${application.reviews[0].token}/vote`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ decision: 'APPROVE' }),
});
ok(unauthorised.status === 401, `vote without login -> ${unauthorised.status}`);

for (const review of application.reviews) {
  const result = await vote(review);
  ok(result.response.status === 200, `sponsor endorsement by ${review.committeeMember.name}`);
}
application = await prisma.membershipApplication.findUnique({
  where: { id: application.id }, include: { reviews: { include: { committeeMember: true } } },
});
ok(application.status === 'COMMITTEE_REVIEW', `after sponsors = ${application.status}`);
ok(application.reviews.length === 8, `total review records = ${application.reviews.length}`);
ok(application.reviews.filter((r) => r.decision === 'APPROVE').length === 2, 'sponsor endorsements count as two approvals');
ok(Boolean(application.committeeReviewDeadlineAt), '48-hour committee deadline exists');

const pending = application.reviews.filter((review) => review.decision === 'PENDING');
for (let index = 0; index < 3; index += 1) {
  const result = await vote(pending[index]);
  ok(result.response.status === 200, `committee approval ${index + 3} of 5`);
}
application = await prisma.membershipApplication.findUnique({ where: { id: application.id } });
ok(application.status === 'ADMIN_REVIEW' && application.committeeResult === 'APPROVED', 'five approvals move to admin confirmation');
ok(!application.paymentToken, 'payment link does not exist before admin confirmation');

const admin = await prisma.portalUser.findFirstOrThrow({ where: { role: 'ADMIN', active: true } });
const adminLogin = await login(admin.email);
const confirmation = await fetch(`${BASE}/api/admin/applications/${application.id}/action`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminLogin.cookie },
  body: JSON.stringify({ action: 'CONFIRM', note: 'End-to-end test confirmation' }),
});
ok(confirmation.status === 200, `admin confirmation -> ${confirmation.status}`);
application = await prisma.membershipApplication.findUnique({ where: { id: application.id } });
ok(application.status === 'PAYMENT_PENDING' && Boolean(application.paymentToken), 'admin releases approval and payment link');
ok(application.adminConfirmedById === admin.id, 'admin identity is recorded');
ok((await prisma.auditEvent.count({ where: { applicationId: application.id } })) >= 7, 'audit history recorded');

// A separate application confirms that an expired committee window pauses
// instead of rejecting, and that the admin can open a new 48-hour window.
const pausedPayload = {
  ...payload,
  organizationName: 'No Quorum Test Aggregates LLP',
  contactEmail: 'no-quorum@workflow.test',
  signatoryEmail: 'no-quorum@workflow.test',
  pan: 'AABCT5678F',
};
const pausedSubmission = await fetch(`${BASE}/api/membership/apply`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pausedPayload),
});
const pausedSubmitted = await pausedSubmission.json();
ok(pausedSubmission.status === 200, 'no-quorum test application submitted');
let pausedApplication = await prisma.membershipApplication.findUnique({
  where: { applicationNo: pausedSubmitted.applicationNo },
  include: { reviews: { include: { committeeMember: true } } },
});
for (const review of pausedApplication.reviews) await vote(review);
pausedApplication = await prisma.membershipApplication.findUnique({ where: { id: pausedApplication.id } });
ok(pausedApplication.status === 'COMMITTEE_REVIEW', 'no-quorum test reached committee review');
await prisma.membershipApplication.update({
  where: { id: pausedApplication.id }, data: { committeeReviewDeadlineAt: new Date(Date.now() - 60_000) },
});
const deadlineRun = await fetch(`${BASE}/api/cron/reviews`, {
  method: 'POST', headers: { Authorization: `Bearer ${CRON_SECRET}` },
});
ok(deadlineRun.status === 200, `deadline processor -> ${deadlineRun.status}`);
pausedApplication = await prisma.membershipApplication.findUnique({ where: { id: pausedApplication.id } });
ok(pausedApplication.status === 'PAUSED_NO_QUORUM', 'expired review pauses without rejection');
const extension = await fetch(`${BASE}/api/admin/applications/${pausedApplication.id}/action`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminLogin.cookie },
  body: JSON.stringify({ action: 'EXTEND' }),
});
ok(extension.status === 200, `admin extends paused review -> ${extension.status}`);
pausedApplication = await prisma.membershipApplication.findUnique({ where: { id: pausedApplication.id } });
ok(pausedApplication.status === 'COMMITTEE_REVIEW' && pausedApplication.committeeReviewDeadlineAt > new Date(), 'new 48-hour window is open');

console.log(failures === 0 ? '\nSTAGED APPROVAL TEST PASSED' : `\n${failures} CHECK(S) FAILED`);
await prisma.$disconnect();
process.exit(failures === 0 ? 0 : 1);
