# AMSMA Website (ksb-amsma) — Claude Code Handover

This file is read automatically by Claude Code CLI on startup. It gives Claude Code
the project context that was built up over the earlier claude.ai sessions, so you
don't need to re-explain the architecture, business rules, or history.

---

## Project

Public website for the **Aggregate & M sand Manufacturers Association (AMSMA)** —
a national industry body being registered as a Society under the Societies
Registration Act 1860 (Maharashtra). Domain: **amsma.in** (already registered).

## Owner

**Dr. K.S. Bhoon**, COTO at RDC Concrete (India) Ltd., serving as Vice President
of AMSMA. This is a personal project, not RDC-owned. Referred to as "Dr. Bhoon"
or informally "Vijay".

## Deployment pattern (matches Dr. Bhoon's standard flow)

1. **Development / testing:** Railway, auto-deploys from `main` branch of
   `github.com/drbhoon/ksb-amsma`.
2. **Production (Phase 6):** Docker → deploy to `rdc.ai` (Azure Linux server).

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- Prisma + Postgres (Railway-provisioned)
- Razorpay (raw REST client, no SDK) for annual subscription payments
- Resend for transactional email (lazy-init, tolerates missing key at build time)
- Deferred to Phase 5: NextAuth v5 magic-link admin, Cloudflare R2 for file uploads

## Phase status

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Scaffold, design system, homepage, newsletter | ✅ Done |
| 2 | Static content pages (About / Committee / Objectives) — MDX | 🔜 Placeholder folders exist under `app/(marketing)/` |
| 3 | Membership: application → magic-link committee review → Razorpay → Register of Members | ✅ Done |
| 4 | Events with paid registration | ⏳ Schema stubs exist |
| 5 | Admin panel (NextAuth), R2 file uploads, member directory | ⏳ |
| 6 | Docker + migrate to rdc.ai | ⏳ |

## Non-negotiable business rules

These come from Schedule C of the AMSMA Rules & Regulations and must not drift:

- **Fees & tier eligibility** live in `config/membership.ts` — do not modify
  without a Managing Committee resolution passed by 2/3 majority.
- **Approval quorum:** 2/3 majority (6 of 8 committee members) for new admissions.
- **Rejection threshold:** 3/8 rejections mathematically blocks approval → auto-rejected.
- **Payment window after approval:** 14 days.
- **Proposer & Seconder:** both required, both must exist as `CommitteeMember` rows.
- **Individuals eligible for `ASSOCIATE` tier only** — never Ordinary.
- **Ordinary tier minimum:** 50,000 MT/month crushing capacity.
- **Ordinary tier split:** ≥1L MT/month → `ORDINARY_LARGE` (₹50k/yr, weight 2);
  50k–1L MT/month → `ORDINARY_REGULAR` (₹25k/yr, weight 1). Category is
  auto-corrected in the submit endpoint based on declared capacity.

## Numbering conventions

- Application: `AMSMA-{year}-{4-digit-counter}` — e.g. `AMSMA-2026-0001`
- Member: `AMSMA-M-{4-digit-counter}` — e.g. `AMSMA-M-0001`

Both counters use `prisma.count()` — adequate for expected volume (a handful of
applications per month). Not race-safe at scale; revisit if we ever hit >10
concurrent applications.

## Configuration files — edit before production

- **`config/committee-members.ts`** — the 8 founding committee members. **Emails
  are placeholders and MUST be updated with real addresses before running
  `npm run db:seed` on production.** Magic-link review invitations go to whatever
  is in this file.
- **`config/membership.ts`** — fee amounts. Locked by MOA; treat as immutable.

## Local development

```bash
cp .env.example .env.local     # edit — at minimum set DATABASE_URL
npm install
npm run db:push                # push Prisma schema to Postgres
npm run db:seed                # populate 8 founding committee members
npm run dev                    # http://localhost:3000
```

## Railway deployment

1. Create new Railway project → deploy from GitHub `drbhoon/ksb-amsma`
2. Add a Postgres service (auto-populates `DATABASE_URL`)
3. Set all env vars from `.env.example`:
   - `RESEND_API_KEY`, `FROM_EMAIL` (verify `amsma.in` in Resend dashboard first)
   - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`,
     `NEXT_PUBLIC_RAZORPAY_KEY_ID` — start with **test-mode** keys
   - `NEXT_PUBLIC_SITE_URL` = Railway URL initially, then `https://amsma.in`
4. Deploy — build runs `prisma generate && next build`
5. **Run seed once** after first deploy: `railway run npm run db:seed`
6. Configure Razorpay webhook in dashboard:
   - URL: `https://<railway-url>/api/payments/webhook`
   - Event: `payment.captured`
   - Secret must match `RAZORPAY_WEBHOOK_SECRET`

## End-to-end test flow (test mode)

1. Visit `/membership/apply`, fill form using **two founder emails** as proposer
   and seconder (must match `config/committee-members.ts`)
2. Submit — check server logs for the 8 magic-link review URLs (or founder inboxes
   if Resend is live)
3. Open 6 review links → approve each → status transitions to `PAYMENT_PENDING`,
   payment email fires to applicant
4. Follow payment link → Razorpay opens → test card `4111 1111 1111 1111`, any
   future expiry, any CVV
5. On success → `Member` row created with `AMSMA-M-0001`, receipt email sent

## Directory layout

```
app/
├── (marketing)/              route group with shared header + footer
│   ├── page.tsx              homepage
│   ├── membership/
│   │   ├── page.tsx          tiers page
│   │   ├── apply/            application form
│   │   └── pay/[token]/      Razorpay checkout page
│   └── {about,committee,objectives}/  Phase 2 placeholders
├── review/[token]/           magic-link committee review (standalone)
├── api/
│   ├── membership/apply/     POST — create application, send review invites
│   ├── review/[token]/vote/  POST — record committee vote, transition status
│   ├── payments/
│   │   ├── create-order/     POST — Razorpay order
│   │   ├── verify/           POST — client-side HMAC verify + activate member
│   │   └── webhook/          POST — server-side webhook reconciliation
│   └── newsletter/subscribe/ POST — Phase 1
config/
├── committee-members.ts      SINGLE SOURCE — 8 founders + quorum math
└── membership.ts             SINGLE SOURCE — 4 tiers + fees
lib/
├── db.ts, email.ts, tokens.ts, membership.ts, razorpay.ts
components/
├── marketing/{Header,Footer}.tsx
└── forms/{NewsletterForm,MembershipApplicationForm}.tsx
prisma/
├── schema.prisma             7 models
└── seed.ts                   populates committee from config
```

## Known limitations / tech debt to address in later phases

- **File uploads deferred:** applicants paste Google Drive URLs for company proof.
  Phase 5 replaces this with native R2 upload.
- **No admin panel yet:** Phase 5. Currently committee acts via magic-link email
  only, and there's no UI to view all applications, resend invites, or manually
  override a decision. Manageable at expected volume; will become painful past
  ~30 applications.
- **Application/member numbering not race-safe** under concurrency. See above.
- **Placeholder committee emails** in `config/committee-members.ts` — must be
  updated before production seed.
- **No PDF invoice generation** — payment receipt email is HTML only. GST invoice
  workflow deferred.

## Working preferences (Dr. Bhoon)

- Ask clarifying questions before large refactors; context matters more than speed.
- Prefer Railway-first deploy; production migration to `rdc.ai` is last step.
- Testing pattern: build → push to `main` → Railway auto-deploys → test on Railway
  URL → iterate. Only migrate to prod after full test cycle.
- Concise, direct communication. No over-hedging or excessive apologies.

## Git history

```
45c26de  Phase 3: Membership flow — application, magic-link committee review, Razorpay payment
f2c5a3a  Phase 1: Scaffold, design system, homepage, newsletter end-to-end
```

## Immediate next task suggestions

Pick whichever aligns with priority:

- **Phase 2:** Build out static content pages (About, Committee bios, Objectives,
  Rules summary). MDX is a good choice — lets non-technical folk edit content.
- **Test-and-fix pass on Phase 3:** Do a full end-to-end walkthrough on Railway
  with test-mode Razorpay, fix any friction found.
- **Phase 4:** Events with paid registration — schema is already stubbed
  (`Event`, `EventRegistration` models); needs UI + API + Razorpay wiring.
