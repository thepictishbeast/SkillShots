# Skill Shots — Roadmap

Phase ordering matters. Build the **battle loop** before everything
else. If users don't post → enter → vote → come back, no shipped
feature beyond that core matters.

## Phase 1 — Foundation

- Auth (sign up / login)
- Age verification
- Profiles
- Video upload (S3 / R2 + CDN)
- Basic challenge creation
- Arena feed (list challenges, no entries yet)

**Done when:** a logged-in user can browse the Arena, open a
challenge, see the proof video.

## Phase 2 — Competition loop

- Entry fees (Stripe Connect: hold + capture)
- Challenge entries (upload attempt video)
- Community voting (one vote per user per challenge)
- Vote restrictions (no self-vote, must be in voting window)
- Challenge countdowns
- Winner selection (highest valid vote count)

**Done when:** a challenge can be created, entered, voted on, and
declared a winner end-to-end.

## Phase 3 — Money

- Wallet
- Stripe Connect onboarding
- Platform fee (10–15% on completion)
- Payout logic
- Refund flow (cancelled challenges, failed entries)

**Done when:** real money moves correctly — pot funds, entry-fee
captures, winner payout, platform fee, and a clean ledger the
operator can audit.

## Phase 4 — Trust

- Reporting
- Admin review queue
- Fraud detection (vote rings, sock-puppets, IP/device clustering)
- Vote-abuse protection
- User bans

**Done when:** the admin tooling can act on a reported video within
hours of the report, the fraud-detection job runs on every vote
cluster, and bans propagate to in-flight entries.

## Phase 5 — Growth

- Leaderboards (global + category)
- Badges
- Boosted challenges (paid Arena boost)
- Verified profiles (subscription)
- Sharing (deep links + Open Graph cards)
- Push notifications

## Compliance + legal

Before launch in any market:

- Get legal review in every market (US state-by-state on the
  skill-vs-chance test, plus EU consumer-protection)
- Verify Stripe Connect ToS supports the use case
- Ship age + KYC verification (tier appropriate to local rules)
- Document rules, judging criteria, dispute path, refund policy
- Build the admin tooling FIRST — you cannot patch in moderation
  after a fraud incident lands you in the press

See `LEGAL_NOTES.md`.

## Anti-features (do NOT build first)

These are tempting but distract from the loop:

- Livestreaming
- DMs
- Brand sponsorships
- Complex creator analytics
- Fancy badge system
- Multi-stage tournaments
- AI-judged challenges (until community voting is proven)

If the loop works, these slot in. If the loop doesn't work, none of
these will save it.
