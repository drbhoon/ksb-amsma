// Smoke test: the approval path for Phases 1-3.
// Submit -> 8 review rows -> 6/8 quorum -> payment link -> test-mode activation
// -> Register of Members, plus tier auto-correction and single-use tokens.
//
// Runs against a LIVE server and a REAL Postgres over HTTP - it does not mock.
// Verifies behaviour that only appears once the database exists, which is
// exactly what a Railway deploy exercises for the first time.
//
// Usage (server already running, DATABASE_URL pointing at its database):
//   BASE_URL=http://127.0.0.1:4010 DEV_ACCESS_KEY=yourkey node scripts/smoke-approval.mjs
//
// DESTRUCTIVE: clears applications, reviews and members first.
// Never point this at anything but a disposable test database.

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const BASE = process.env.BASE_URL || 'http://127.0.0.1:4010';
const KEY = process.env.DEV_ACCESS_KEY || 'testkey123';
await prisma.member.deleteMany({});
await prisma.applicationReview.deleteMany({});
await prisma.membershipApplication.deleteMany({});
let failures = 0;
const ok = (c, m) => { console.log(`${c ? '  PASS' : '  FAIL'}  ${m}`); if (!c) failures++; };

// 1. healthcheck path
const home = await fetch(`${BASE}/`);
ok(home.status === 200, `GET / -> ${home.status} (Railway healthcheckPath)`);

// 2. dev console guard
const noKey = await fetch(`${BASE}/dev/links`);
ok(noKey.status === 404, `GET /dev/links without key -> ${noKey.status} (expect 404)`);
const withKey = await fetch(`${BASE}/dev/links?key=${KEY}`);
ok(withKey.status === 200, `GET /dev/links?key=... -> ${withKey.status}`);

// 3. submit an application
const payload = {
  tier: 'ORDINARY_LARGE',
  organizationName: 'Deccan Aggregates Pvt Ltd',
  contactName: 'Ravi Kulkarni', contactEmail: 'ravi@deccanagg.test', contactPhone: '9876543210',
  addressLine: 'Plot 14, MIDC Industrial Area', city: 'Pune', state: 'Maharashtra',
  pincode: '411019', pan: 'AABCD1234E', gstNumber: '',
  crushingCapacityMtMonth: '150000', natureOfBusiness: '',
  signatoryName: 'Ravi Kulkarni', signatoryDesignation: 'Managing Director',
  signatoryEmail: 'ravi@deccanagg.test', signatoryPhone: '9876543210',
  companyProofUrl: 'https://drive.google.com/file/d/testproof',
  companyProofType: 'incorporation',
  proposerName: 'Dr. Karnail Singh Bhoon', proposerEmail: 'karnail.singh.bhoon@example.com',
  seconderName: 'Mr. Rudra Mohan Sahu', seconderEmail: 'rudra.mohan.sahu@example.com',
  agreeRules: true,
};
const applyRes = await fetch(`${BASE}/api/membership/apply`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
});
const applyData = await applyRes.json();
ok(applyRes.status === 200, `POST /api/membership/apply -> ${applyRes.status} ${JSON.stringify(applyData)}`);
ok(applyData.applicationNo === 'AMSMA-2026-0001', `application no = ${applyData.applicationNo} (expect AMSMA-2026-0001)`);
ok(applyData.reviewersNotified === 8, `review rows created = ${applyData.reviewersNotified} (expect 8)`);

// 4. wrong-tier guard
const badTier = await fetch(`${BASE}/api/membership/apply`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ...payload, contactEmail: 'x@y.test', crushingCapacityMtMonth: '60000' }),
});
ok(badTier.status === 400, `capacity 60k declared as ORDINARY_LARGE -> ${badTier.status} (expect 400)`);

// 5. approve six times = quorum
const app = await prisma.membershipApplication.findFirst({
  where: { applicationNo: applyData.applicationNo },
  include: { reviews: true },
});
const tokens = app.reviews.map((r) => r.token);
for (let i = 0; i < 6; i++) {
  const v = await fetch(`${BASE}/api/review/${tokens[i]}/vote`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision: 'APPROVE' }),
  });
  const vd = await v.json();
  if (i < 5) ok(v.status === 200 && vd.newStatus === 'UNDER_REVIEW', `vote ${i + 1}/6 -> ${vd.newStatus} (still under review)`);
  else ok(v.status === 200 && vd.newStatus === 'PAYMENT_PENDING', `vote 6/6 -> ${vd.newStatus} (quorum reached)`);
}

// 6. token is single use
const reuse = await fetch(`${BASE}/api/review/${tokens[0]}/vote`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ decision: 'APPROVE' }),
});
ok(reuse.status === 409, `re-using a spent review token -> ${reuse.status} (expect 409)`);

// 7. pay page + test-mode activation
const paid = await prisma.membershipApplication.findFirst({ where: { id: app.id } });
ok(!!paid.paymentToken, `payment token issued: ${paid.paymentToken ? 'yes' : 'NO'}`);
const payPage = await fetch(`${BASE}/membership/pay/${paid.paymentToken}`);
const payHtml = await payPage.text();
ok(payPage.status === 200, `GET /membership/pay/[token] -> ${payPage.status}`);
ok(payHtml.includes('test mode'), `pay page shows test-mode panel, not Razorpay`);

const act = await fetch(`${BASE}/api/payments/test-activate`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ paymentToken: paid.paymentToken }),
});
const actData = await act.json();
ok(act.status === 200 && actData.memberNo === 'AMSMA-M-0001', `test activation -> ${JSON.stringify(actData)}`);

// 8. idempotency
const again = await fetch(`${BASE}/api/payments/test-activate`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ paymentToken: paid.paymentToken }),
});
const againData = await again.json();
ok(againData.already === true && againData.memberNo === 'AMSMA-M-0001', `second activation is idempotent -> ${JSON.stringify(againData)}`);
ok((await prisma.member.count()) === 1, `Member rows = ${await prisma.member.count()} (expect exactly 1)`);

const m = await prisma.member.findFirst();
ok(m.tier === 'ORDINARY_LARGE' && m.organizationName === 'Deccan Aggregates Pvt Ltd',
   `member row: ${m.memberNo} ${m.organizationName} ${m.tier}`);

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
await prisma.$disconnect();
process.exit(failures === 0 ? 0 : 1);
