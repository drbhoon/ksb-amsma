# ksb-amsma

Website for the **Aggregate & M sand Manufacturers Association** — a national industry body registered as a Society under the Societies Registration Act, 1860 (Maharashtra).

Domain: **amsma.in**

## Status

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Scaffold, design system, homepage, newsletter | ✅ Complete |
| 2 | Static content pages (About / Committee / Objectives) | 🔜 Placeholder folders |
| **3** | **Membership: online application → committee review (magic-link) → Razorpay payment → Register of Members** | **✅ Complete** |
| 4 | Events + paid registration | ⏳ Next |
| 5 | Admin panel (NextAuth), content management, R2 file uploads | ⏳ |
| 6 | Migrate to production domain via Docker on RDC.ai | ⏳ |

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind · Prisma + Postgres · Razorpay · Resend

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
- `MembershipApplication` created with status `UNDER_REVIEW`
- One `ApplicationReview` row is created per committee member, each with a **cryptographically random single-use magic-link token** (14-day expiry)
- Confirmation email to applicant
- Review invitation email to each committee member with their unique link

### 2. Committee review (`/review/[token]` — no login)

Each committee member clicks their unique link to see the full application, live vote tally, and Approve/Reject buttons. Comments optional for approval, required for rejection.

Vote tally logic (per Rule 4, 2/3 majority):
- **Approvals ≥ 6/8** → status becomes `PAYMENT_PENDING`, payment-link email sent
- **Rejections ≥ 3/8** (mathematically blocks approval) → status becomes `REJECTED`, rejection email sent
- Otherwise → status stays `UNDER_REVIEW`

### 3. Payment (`/membership/pay/[token]`)

Applicant clicks the payment link, Razorpay Checkout opens with the correct amount (from `MEMBERSHIP_TIERS` config). On successful payment:
- Client-side handler → `/api/payments/verify` verifies HMAC-SHA256 signature
- Webhook (`/api/payments/webhook`) provides server-side fallback for reconciliation
- On verified payment: `MembershipApplication.status = ACTIVE`, `Member` row created in Register of Members with `AMSMA-M-NNNN` number, receipt emailed

### 4. Active membership

`Member` record has 12-month expiry, tier, capacity, and all details required by Rule 4.iii for the Register of Members.

## Configuration files (edit these before production)

- **`config/committee-members.ts`** — the 8 founding committee members. **Update emails to real addresses before running `npm run db:seed`.**
- **`config/membership.ts`** — fee amounts and eligibility. Do not modify without a Managing Committee resolution (2/3 majority per Rules).

## Key numbering conventions

- Application: `AMSMA-{year}-{4-digit-counter}` — e.g. `AMSMA-2026-0001`
- Member: `AMSMA-M-{4-digit-counter}` — e.g. `AMSMA-M-0001`

## Test the flow end-to-end locally

1. `npm run db:push && npm run db:seed`
2. Set `RESEND_API_KEY` (or leave unset — emails will be logged, not sent)
3. Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID` to Razorpay **test-mode keys**
4. `npm run dev`
5. Visit `/membership/apply`, submit an application using two founder emails as proposer/seconder
6. Check server logs for review link URLs (`http://localhost:3000/review/{token}`)
7. Open 6 review links in different tabs → approve each → status → `PAYMENT_PENDING`
8. Applicant receives payment link → click → use Razorpay test card `4111 1111 1111 1111`, any future expiry, any CVV
9. On success → member record created, receipt email sent

## Production go-live checklist

- [ ] Real committee-member emails in `config/committee-members.ts` and re-seed
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
├── review/[token]/           magic-link committee review (standalone layout)
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
├── schema.prisma             7 models: CommitteeMember, MembershipApplication,
│                             ApplicationReview, Member, Event, Publication, etc.
└── seed.ts                   populates committee members from config
```
