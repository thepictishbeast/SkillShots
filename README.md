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

## Status

Pre-code. This repo is the architecture spec + roadmap. First commit:
{date here}.

## License

TBD — pending owner decision. Suggested:
- Server / backend: AGPL-3.0-or-later
- Mobile shell: MIT
