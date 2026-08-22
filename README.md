# ksb-amsma

Official website of the **Aggregate & M sand Manufacturers Association** (AMSMA).

**Production domain:** [amsma.in](https://amsma.in) (registered, migration in Phase 6)
**Development:** Railway (deployed from GitHub `main` branch, same workflow as rdcc.ai)

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Prisma · Postgres · Razorpay · Cloudflare R2 · Resend

---

## Deployment workflow

Standard Dr. Bhoon workflow, matching rdcc.ai:

```
    GitHub (main branch, this repo: ksb-amsma)
                    │
                    ▼
    Railway (auto-deploy on push, prototype URL)
                    │
                    ▼ (after committee sign-off)
    amsma.in (Docker → Azure Linux, RDC.ai-style production)
```

---

## Phase status

| Phase | Scope | Status |
|---|---|---|
| **1** | Scaffold + design system + Homepage + Newsletter (end-to-end) + Dockerfile + Prisma schema | ✅ **This commit** |
| 2 | About / Committee / Objectives content pages (MDX) | Pending |
| 3 | Membership application + committee approval workflow + Razorpay | Pending — needs design decisions |
| 4 | Events + registration | Pending |
| 5 | Admin panel (magic-link auth) + R2 file uploads | Pending |
| 6 | Migration to amsma.in (Docker on Azure) | Pending |

---

## First-time setup (local dev)

```bash
# Clone
git clone https://github.com/drbhoon/ksb-amsma.git
cd ksb-amsma

# Install (--legacy-peer-deps until React 19 shakedown finishes)
npm install --legacy-peer-deps

# Env
cp .env.example .env.local
# Fill DATABASE_URL, RESEND_API_KEY, FROM_EMAIL at minimum

# DB schema (creates tables in your Postgres)
npx prisma db push

# Run
npm run dev
```

Open http://localhost:3000

**Quick local Postgres:**
```bash
docker run -d --name amsma-pg -e POSTGRES_PASSWORD=dev -p 5432:5432 postgres:16
# then set: DATABASE_URL=postgresql://postgres:dev@localhost:5432/postgres
```

---

## Deploy to Railway (staging)

1. Push this repo to GitHub: `github.com/drbhoon/ksb-amsma` (or your account)
2. Railway → **New Project → Deploy from GitHub → select ksb-amsma**
3. Add a **Postgres** service in the same project (auto-injects `DATABASE_URL`)
4. Fill remaining env vars from `.env.example` in the **Variables** tab
5. Push to `main` → auto-deploys

Migrations run automatically on each deploy (see `railway.toml` → `startCommand: prisma migrate deploy && npm run start`).

**First-time initial migration (before Prisma migrations exist):**
```bash
# Locally, once
npx prisma migrate dev --name init
git add prisma/migrations && git commit -m "Initial migration" && git push
```

---

## Migrate to amsma.in (production, Phase 6)

Once tested on Railway, clone to production repo with the Dockerfile:

```bash
# On the amsma.in server (or Azure)
git clone https://github.com/drbhoon/ksb-amsma.git amsma
cd amsma

docker build -t amsma-web:latest .

docker run -d \
  --name amsma-web \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file /etc/amsma/env \
  amsma-web:latest
```

Standalone Next.js output → final image ~150 MB. Reverse proxy amsma.in → localhost:3000 via Nginx or Caddy.

---

## Project structure

```
ksb-amsma/
├── app/
│   ├── layout.tsx          Root layout, fonts, metadata
│   ├── page.tsx            Homepage (Hero + Objectives + Committee + Newsletter)
│   ├── globals.css         Tailwind + AMSMA design tokens
│   └── api/
│       └── newsletter/subscribe/route.ts
├── components/
│   ├── marketing/          Header, Footer
│   └── forms/              NewsletterForm
├── lib/
│   ├── db.ts               Prisma singleton
│   └── email.ts            Resend wrapper
├── prisma/
│   └── schema.prisma       7 models (Member, Event, Publication, Gallery, Newsletter, Admin, Session)
├── content/                Reserved for MDX (Phase 2)
├── public/                 Static assets
├── Dockerfile              Multi-stage build
├── railway.toml            Railway config
└── .env.example            Env template (grouped by phase)
```

---

## Content editing

**Phase 1:** Content lives in `app/page.tsx` (see `OBJECTIVES` and `COMMITTEE` constants at the top). Edit and commit.

**Phase 2:** Content moves to `content/*.mdx` — committee members edit Markdown without touching React.

**Phase 5:** Admin panel allows non-technical committee members to add Events, Publications, and Gallery images via web UI.

---

## Environment variables

All variables documented in `.env.example`, grouped by phase. You only need Phase 1 variables (`DATABASE_URL`, `RESEND_API_KEY`, `FROM_EMAIL`) to run the newsletter feature.

---

## Domain

- **Development:** `*.up.railway.app` (auto-assigned by Railway)
- **Production:** `amsma.in` (registered, DNS to be pointed at production server in Phase 6)

---

## License

© 2026 Aggregate & M sand Manufacturers Association. All rights reserved.
