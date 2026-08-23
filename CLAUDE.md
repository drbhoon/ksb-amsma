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
| 2 | Static content pages (About / Committee / Objectives) | 🔜 "Coming soon" placeholders now exist for all 10 nav routes; real content pending |
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

- **`config/committee-members.ts`** — the 8 founding committee members. These are
  **real addresses of real people**, several unverified (marked `TODO: verify`).
  They are safe during testing only because outbound mail is gated behind
  `EMAIL_REDIRECT_TO` / `EMAIL_LIVE` (see "Email is fail-safe by design").
  Verify every address before setting `EMAIL_LIVE=true`.
- **`config/membership.ts`** — fee amounts. Locked by MOA; treat as immutable.

## Local development

```bash
cp .env.example .env.local     # edit — at minimum set DATABASE_URL
npm install
npm run db:migrate             # apply prisma/migrations (or db:push for a scratch DB)
npm run db:seed                # populate 8 founding committee members
npm run dev                    # http://localhost:3000
```

## Railway deployment

Project `amsma-website` deploys from `main` of `github.com/drbhoon/ksb-amsma`.

Schema and seed are handled automatically by `railway.toml`:
`prisma migrate deploy` applies `prisma/migrations/0_init` (all 9 tables), then
`db:seed` upserts the 8 committee members. The seed is idempotent, so it is safe
on every boot; a seed failure is logged but does not block startup.

Variables to set (the five marked `[SET NOW]` in `.env.example` are enough for
the current test round):

| Variable | Value |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` — reference the Postgres service |
| `NEXT_PUBLIC_SITE_URL` | the Railway public URL, `https://`, no trailing slash |
| `DEV_ACCESS_KEY` | a long random string — guards `/dev/links` |
| `EMAIL_REDIRECT_TO` | `ksbhoon@rdc.in,drbhoon@gmail.com` |
| `TEST_MODE_PAYMENTS` | `true` |

`NEXT_PUBLIC_SITE_URL` is baked into review and payment links, so set it before
generating any test application — links made with a wrong value point at the
wrong host and cannot be repaired without re-applying.

## Current testing setup (Railway, Aug 2026)

Razorpay is **on hold** — the Society is still in formation and has no gateway
account. `amsma.in` is owned but not yet hosted, so Resend cannot deliver mail
until the domain is verified. Testing therefore runs without email and without
payments, using two mechanisms added for the purpose:

**1. Test console — `/dev/links?key=<DEV_ACCESS_KEY>`**
Lists every application with its 8 committee review links, the payment link, the
live vote tally, and an environment panel (committee seeded? email mode? payment
mode?). This is how the committee review step is reached while email is down.
404s unless `DEV_ACCESS_KEY` is set. Turn it off before the site goes public.

**2. Test-mode payment — `TEST_MODE_PAYMENTS=true`**
The pay page shows "Record as paid (test mode)" instead of Razorpay checkout.
It calls `/api/payments/test-activate`, which runs the same `activateMembership()`
as a real payment, so the Member row, member number and receipt are all exercised.
Member rows from this path carry a `TEST-*` payment reference. Disables itself
automatically once `PAYMENTS_ENABLED=true`.

### Email is fail-safe by design

`config/committee-members.ts` holds **real addresses of real people** (IIT Patna,
VNIT Nagpur, RDC). Outbound mail is therefore OFF unless explicitly switched on:

| Env | Behaviour |
|-----|-----------|
| `EMAIL_REDIRECT_TO=a@x,b@y` | All mail goes to those addresses; real recipient shown in subject as `[→ real@addr]`. **Testing mode.** |
| `EMAIL_LIVE=true` | Real delivery to real recipients. Production only. |
| neither | Nothing sent; every attempt logged. Default. |

Current testers: `ksbhoon@rdc.in`, `drbhoon@gmail.com`.

**A mode alone does not send.** A transport must also be configured - these are
two independent gates:

| Provider | When |
|---|---|
| `GMAIL_USER` + `GMAIL_APP_PASSWORD` | Now. Sends via `amsma2026@gmail.com`, needs no verified domain. Gmail rewrites From to the authenticated account, so `FROM_EMAIL` is ignored while this is set. ~500 mails/day. |
| `RESEND_API_KEY` | Once amsma.in is hosted and verified, for SPF/DKIM on the Association's own domain. Gmail takes precedence if both are set. |
| neither | Nothing is delivered; every attempt is logged. |

Sending from `amsma.in` needs only DNS records (SPF/DKIM) proving domain
ownership - **no mailbox at that address, and no web hosting**. Receiving is
separate: set `REPLY_TO` to a mailbox that exists, or replies to `noreply@`
bounce.

To check delivery without submitting an application:
`/api/dev/test-email?key=<DEV_ACCESS_KEY>&to=<address>` - in redirect mode it can
only reach the `EMAIL_REDIRECT_TO` addresses whatever `to` says.

### Rule 4 override (TEMPORARY)

`TEST_PROPOSER_EMAILS` accepts extra addresses as Proposer/Seconder so testers
can apply from their own mailbox. Currently `ksbhoon@rdc.in,drbhoon@gmail.com`.

These are deliberately **not** `CommitteeMember` rows. Adding them there would
raise the approver count to 10 and move the two-thirds quorum from 6 to 7,
silently breaking Schedule C. As an allowlist they affect the proposer check
only; they receive no review invitation and cannot vote.

The override announces itself in the boot log and as a red banner on
`/dev/links`. **Unset the variable before the site goes public** — Rule 4 is then
enforced again with no code change.

### Test walkthrough

1. Open `/dev/links?key=…` — confirm "Committee seeded 8 / 8". If it shows 0, the
   seed did not run and no application can be submitted.
2. Copy any two committee emails from that page.
3. Submit at `/membership/apply` using those two as Proposer and Seconder.
4. Reload `/dev/links?key=…` — the application appears with 8 pending review links.
5. Open 6 review links, approve each. On the 6th the status flips to
   `PAYMENT_PENDING` and a payment link appears on the console.
6. Open the payment link → "Record as paid (test mode)" → `Member` row created as
   `AMSMA-M-0001`.
7. To test rejection instead, reject on 3 links — status flips to `REJECTED`.

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
- **Unverified committee emails** in `config/committee-members.ts` — confirm each
  before enabling live email.
- **`/dev/links` test console** exposes applicant data to anyone holding
  `DEV_ACCESS_KEY`. Unset that variable before the site goes public; the route
  404s without it.
- **Phase 2 pages are placeholders** — `ComingSoon` stubs so the nav does not 404.
- **Newsletter has no unsubscribe flow** — `unsubscribedAt` exists on the model
  but nothing writes to it.
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
1a6e228  Add CLAUDE.md — handover context for Claude Code CLI
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
