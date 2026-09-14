# ksb-amsma

Website for the **Aggregate & M sand Manufacturers Association** — a national industry body registered as a Society under the Societies Registration Act, 1860 (Maharashtra).

Domain: **amsma.in**

## Status

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Scaffold, design system, homepage, newsletter | ✅ Complete |
| 2 | Static content pages (About / Committee / Objectives) | 🔜 Placeholder folders |
| **3** | **Membership: application → sponsor endorsements → 48-hour committee vote → admin confirmation → payment** | **✅ Complete** |
| 4 | Events + paid registration | ⏳ Next |
| 5 | Access-controlled committee and admin portal | ✅ Membership workflow complete |
| 6 | Migrate to production domain via Docker on RDC.ai | ⏳ |

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind · Prisma + Postgres · Auth.js with Google OAuth · Razorpay · Resend

## Local development

```bash
cp .env.example .env.local  # then edit
npm install
npm run db:push             # push Prisma schema to database
npm run db:seed             # populate 8 founding committee members
npm run dev
```

Open http://localhost:3000

## Deployment to Railway

1. Create Postgres service — `DATABASE_URL` populates automatically.
2. Set env vars (all from `.env.example`):
   - `RESEND_API_KEY`, `FROM_EMAIL` (verify domain in Resend first)
   - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`
   - `NEXT_PUBLIC_SITE_URL` = production URL
   - `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `PORTAL_ADMIN_EMAIL`, `CRON_SECRET`
3. Deploy — build runs `prisma generate && next build`.
4. **Run seed once** after first deploy: `railway run npm run db:seed`
5. Configure Razorpay webhook in dashboard:
   - URL: `https://amsma.in/api/payments/webhook`
   - Events: `payment.captured`
   - Secret: match `RAZORPAY_WEBHOOK_SECRET`

## Phase 3: Membership flow — how it works

### 1. Applicant submits application (`/membership/apply`)

Form collects: category, organisation details, PAN, address, authorised signatory, one company-proof URL (Google Drive / Dropbox link), and names/emails of a **proposer** and **seconder** (both must be existing committee members).

Business validation:
- Ordinary tiers require crushing capacity ≥ 50,000 MT/month
- Category is auto-corrected: capacity ≥ 1L MT/month → `ORDINARY_LARGE`
- Proposer and seconder emails must exist in the `CommitteeMember` table
- Duplicate contactEmail with an in-flight application → rejected

On successful submit:
- `MembershipApplication` is created with status `SPONSOR_REVIEW`
- Two sponsor-review records are created for the proposer and seconder
- Confirmation email to applicant
- Review invitation email to the proposer and seconder

### 2. Sponsor endorsements and committee review

Every reviewer must sign in. The review link identifies the application but does not grant access by itself. The proposer and seconder act first. Their endorsements count toward quorum. After both endorse, the other six eligible committee members receive review emails and a 48-hour committee window starts.

Interim vote logic:
- **Approvals ≥ 5/8** → `ADMIN_REVIEW`
- **Rejections ≥ 4/8** → `ADMIN_REVIEW` with a rejection result
- No quorum after 48 hours → `PAUSED_NO_QUORUM`; an admin can start another 48-hour window
- The admin confirms the recorded result and cannot reverse it through the dashboard

### 3. Admin confirmation (`/admin`)

The admin sees the full application, decision history, dates, and tally. Confirmation releases the final emails. An approved application moves to `PAYMENT_PENDING`.

### 4. Payment (`/membership/pay/[token]`)

Applicant clicks the payment link, Razorpay Checkout opens with the correct amount (from `MEMBERSHIP_TIERS` config). On successful payment:
- Client-side handler → `/api/payments/verify` verifies HMAC-SHA256 signature
- Webhook (`/api/payments/webhook`) provides server-side fallback for reconciliation
- On verified payment: `MembershipApplication.status = ACTIVE`, `Member` row created in Register of Members with `AMSMA-M-NNNN` number, receipt emailed

### 5. Active membership

`Member` record has 12-month expiry, tier, capacity, and all details required by Rule 4.iii for the Register of Members.

## Configuration files (edit these before production)

- **`config/committee-members.ts`** — the 8 founding committee members. Six working addresses came from `main`. Two `example.com` placeholders still require confirmed Google addresses before live use.
- **`config/membership.ts`** — fee amounts and eligibility. Do not modify without a Managing Committee resolution (2/3 majority per Rules).

## Key numbering conventions

- Application: `AMSMA-{year}-{4-digit-counter}` — e.g. `AMSMA-2026-0001`
- Member: `AMSMA-M-{4-digit-counter}` — e.g. `AMSMA-M-0001`

## Test the flow end-to-end locally

1. Set the Google OAuth variables, then run `npm run db:push && npm run db:seed`.
2. Set `RESEND_API_KEY` (or leave unset — emails will be logged, not sent)
3. Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID` to Razorpay **test-mode keys**
4. Run `npm run dev`.
5. For the automated workflow test, use a disposable test database and enable `PORTAL_TEST_AUTH` only in that test process.
6. Run `npm run test:workflow` to test sponsor review, five-of-eight quorum, admin confirmation, access control, the no-quorum pause, and a new 48-hour window.
7. For a manual payment test, use Razorpay test card `4111 1111 1111 1111`, any future expiry, and any CVV.
8. On success, a member record is created and a receipt email is sent.

## Production go-live checklist

- [ ] Replace the two remaining `example.com` committee placeholders and confirm that all eight addresses can use Google sign-in
- [ ] Google OAuth production callback: `https://amsma.in/api/auth/callback/google`
- [ ] Run the review-deadline job at least hourly
- [ ] Resend: verify `amsma.in` sending domain
- [ ] Razorpay: complete KYC, switch to Live mode keys
- [ ] Razorpay: configure production webhook URL
- [ ] Set `NEXT_PUBLIC_SITE_URL=https://amsma.in`
- [ ] Test with a real ₹100 transaction end-to-end, then refund

## Directory structure

```
app/
├── (marketing)/              route group with shared header + footer
│   ├── page.tsx              homepage
│   ├── membership/
│   │   ├── page.tsx          tiers page
│   │   ├── apply/            application form
│   │   └── pay/[token]/      Razorpay checkout page
│   └── ...
├── review/[token]/           OAuth-protected committee review
└── api/
    ├── membership/apply/     POST — create application
    ├── review/[token]/vote/  POST — record committee vote
    ├── payments/
    │   ├── create-order/     POST — Razorpay order
    │   ├── verify/           POST — client-side signature verify + activate
    │   └── webhook/          POST — server-side webhook reconciliation
    └── newsletter/subscribe/ POST — Phase 1

config/                       single sources of truth (edit before production)
├── committee-members.ts
└── membership.ts

lib/                          shared server code
├── db.ts, email.ts, tokens.ts, membership.ts, razorpay.ts

prisma/
├── schema.prisma             application, review, user, session, audit, member,
│                             event, and publication data models
└── seed.ts                   populates committee members and the Google allowlist
```
