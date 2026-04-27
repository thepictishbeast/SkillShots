# Skill Shots

**Skill Shots is where users post real skill challenges, pay to enter,
and the community votes on the best attempt. Clear rules. Real stakes.
Public results.**

A mobile-first, video-based competition app where every challenge has:
- A proof video the creator posts
- An entry fee challengers pay to attempt
- A pot the winner takes (minus a 10–15% platform fee)
- A public voting period the community decides during

Think TikTok meets skill battles, with money on the line and
transparent rules.

## Why this is different from a regular social app

Cash + community voting creates two real risks:

1. Popularity can beat skill
2. Voting can be manipulated

So the framing matters. We position voting as:

> Winners are selected by community vote based on how well each entry
> follows the challenge rules.

And we ship fraud-protection from day one. Anything paid + voted needs
serious anti-abuse from the start, not later.

## Core mechanics

- Users post skill challenges with clear rules + measurable outcomes
- Other users pay to challenge and upload their own attempt video
- Winners are decided by community vote during the voting window
- Each challenge clearly displays entry amount, payout preview, rules,
  and how judging works
- Global + category-based leaderboards rank top earners, win streaks,
  most wins, top creators

## What's in this repo (right now)

This is the architecture + roadmap scaffold. Code lands as the MVP
phases (see `ROADMAP.md`).

- `README.md`         — this file
- `ARCHITECTURE.md`   — full app + data + API spec
- `ROADMAP.md`        — MVP build order + phase gates
- `LEGAL_NOTES.md`    — paid competition + voting compliance
  considerations (NOT legal advice)
- `LICENSE`           — TBD; suggested AGPL-3.0 for the server, MIT
  for the mobile shell

## MVP scope (the only thing that matters first)

Build the **battle loop**. If users don't post → enter → vote → come
back, every other feature is wasted work.

1. Sign up / login / age verification
2. User profile
3. Arena feed
4. Create challenge (3-step flow)
5. Upload video
6. Enter challenge + pay entry fee
7. Community voting
8. Winner selection + payout
9. Reporting
10. Admin moderation panel

Skip until people are using it: leaderboards, boosted challenges,
verified-badge subscription, livestream, DMs, brand sponsorships.

## Stack (recommended)

| Layer        | Pick                                          |
|--------------|-----------------------------------------------|
| Mobile       | React Native + Expo                          |
| Backend      | Node.js + NestJS (or Next.js API routes)      |
| Database     | PostgreSQL                                    |
| Video stor.  | AWS S3 or Cloudflare R2                      |
| Payments     | Stripe Connect                                |
| Auth         | Clerk / Firebase Auth / Supabase Auth        |
| Push         | Firebase Cloud Messaging or Expo Push        |
| Moderation   | AI scan (text/video) → human-review queue    |

## Compliance posture

Paid competitions + user payouts + community voting is a regulated
combination. Before launch:

- Get legal review in every market you plan to launch
- Verify Stripe Connect ToS for skill-vs-chance categorization
- Implement age + identity verification (KYC tier)
- Document the rules, judging criteria, and dispute path
- Build the admin tooling FIRST (you cannot patch it in later)

See `LEGAL_NOTES.md`.

## Repo layout

```
.
├── apps/
│   ├── api/                  NestJS + Fastify + Prisma + Postgres
│   └── mobile/               Expo Router + React Native
├── packages/
│   └── shared-types/         Zod schemas shared by api and mobile
├── infra/
│   ├── docker-compose.yml    postgres + minio + redis (dev only)
│   └── postgres/init.sql     citext + pgcrypto
├── .github/workflows/        api-ci, mobile-ci, security (CodeQL+audit+gitleaks)
├── docs/
│   ├── SECURITY.md           threat model + vuln disclosure
│   ├── CONTRIBUTING.md       dev loop + AVP-2 gates
│   ├── ENV.md                authoritative env-var reference
│   ├── AVP-NOTES.md          per-pass AVP-2 ledger
│   └── OPS.md                production runbook (initial)
├── ARCHITECTURE.md           full app + data + API spec
├── ROADMAP.md                MVP build order
├── LEGAL_NOTES.md            paid-competition + voting compliance
└── README.md                 (this file)
```

## Quick start

```bash
nvm use && corepack enable
pnpm install
pnpm infra:up
cd apps/api
cp .env.example .env
# Replace JWT_*_SECRET with `openssl rand -base64 64` (twice, different).
pnpm prisma migrate dev
pnpm dev          # API on :4000
```

In another shell:

```bash
cd apps/mobile
pnpm start        # Expo dev server
```

## Status

**Phase-1 backend foundation + mobile shell shipped 2026-04-27.**

| Layer                    | State                                          |
|--------------------------|------------------------------------------------|
| Auth (signup/login/refresh) | ✅ argon2id + JWT + opaque rotating refresh   |
| Profiles                 | ✅                                              |
| Video upload             | ✅ presigned-POST to S3/R2/Minio                |
| Challenge create + list  | ✅                                              |
| Entries                  | ✅ one-per-user-per-challenge enforced          |
| Voting + fraud scorer    | ✅ skeleton with auto-flag at score ≥75         |
| Wallet ledger            | ⚠️  schema + balance read; payout = Phase 3   |
| Moderation + admin panel | ✅ reports endpoint + admin resolve            |
| Mobile shell (auth+arena+detail) | ✅                                       |
| Stripe Connect           | ❌ Phase 3                                      |
| CSAM scan                | ❌ Pre-launch mandatory                         |

65 tests passing (24 shared-types + 41 api). See `docs/AVP-NOTES.md`
for the AVP-2 pass ledger and `docs/SECURITY.md` for the threat model.

## License

TBD — pending owner decision. Suggested:
- Server / backend: AGPL-3.0-or-later
- Mobile shell: MIT
