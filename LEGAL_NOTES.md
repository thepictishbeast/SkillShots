# Skill Shots — Legal notes (NOT legal advice)

This file collects the regulatory + compliance issues you will hit
before launch. **None of this replaces a lawyer in your jurisdiction.**
Treat it as a punch-list to bring to one.

## The skill-vs-chance test

Most jurisdictions distinguish between "games of skill" and "games of
chance." Cash competitions on games of chance are gambling and need
specific licenses. Cash competitions on games of skill are usually
fine (with caveats).

Skill Shots is positioned as **skill-based**:

- Each challenge has clear, measurable rules
- Winner is decided by community vote on objective adherence to those
  rules — not on randomness, not on chance

But:

- "Community voting" can be argued in court as a popularity contest,
  not a skill judgment. The framing of voting matters.
- Some US states (looking at you, Arizona, Arkansas, Louisiana,
  Montana, South Carolina, South Dakota, Tennessee) have very strict
  skill-vs-chance tests; some prohibit paid skill competitions
  entirely.
- The EU treats this differently — many member states require operator
  licenses for any paid competition.

**Action:** get a lawyer to map your launch markets to the rule. Have
them write the user-facing rules language so it's defensible.

## Voting framing

Use language like:

> Winners are selected by community vote based on how well each entry
> follows the challenge rules.

NOT:

> Vote for your favorite!

The first is defensible; the second sounds like a popularity contest.

## Payments + KYC

Stripe Connect is the right primitive. But:

- Read Stripe's "Acceptable Use" policy carefully — they restrict
  some skill-competition use cases.
- You will need to KYC users before they can receive payouts (Stripe
  requires it for Connect).
- You may need to KYC users before they can ENTER paid challenges,
  depending on jurisdiction (anti-money-laundering rules).
- Refund policy must be documented BEFORE the user pays. Display it
  on the entry screen.

## Age verification

- Hard floor: 18+ in most jurisdictions (paid competition + payouts).
- Some markets: 21+ for cash prizes (EU some states).
- Self-declaration is not enough. Use an identity check (Stripe
  Identity or similar).

## Data + privacy

- Video uploads: GDPR / CCPA "right to be forgotten" applies. You
  must be able to delete a user's videos, votes, and PII on request.
- Vote records: identify-the-voter data is PII; protect it.
- Backups: include the right-to-be-forgotten path or you create a
  retention-policy violation.

## Moderation obligations

- **DMCA**: takedowns within 24h.
- **CSAM scanning**: you must scan video uploads. AWS Rekognition or
  PhotoDNA is the standard.
- **Hate speech / harassment**: most jurisdictions require some
  reporting + takedown obligation. EU's Digital Services Act is the
  hardest test currently.

## Tax

- US: 1099-NEC for any creator earning >$600/year.
- EU: VAT applies on the platform fee (different rates per country).
- Withholding for international winners: review per market.

## Insurance

- Get tech-E&O + cyber-liability + content-moderation coverage before
  launch.
- A single moderation failure that goes viral can sink the platform;
  insurance buys you the runway to fix it.

## Recommended order

1. Pick launch markets (probably US + Canada to start).
2. Get a lawyer who specializes in skill-competition / fantasy-sports
   in your launch markets.
3. Have them write: ToS, EULA, refund policy, voting-rules language,
   privacy policy, DMCA policy, content-moderation policy.
4. THEN build.
