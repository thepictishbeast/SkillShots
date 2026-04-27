# Skill Shots — Security

Skill Shots handles cash, video, and votes. The threat model is heavy.

This document captures the threat model, the controls in place, and how
to report vulnerabilities.

## Reporting a vulnerability

**DO NOT** open a public issue.

Email **security@skillshots.app** (placeholder until DNS lands) with:
- A clear description of the issue
- Reproducer (request, payload, video)
- Impact assessment
- Your name + a coordination handle

We will acknowledge within 72h, scope within 7d, and disclose with you
post-fix. Bounty rules will live at `/security/bounty.html` once the
program is funded.

## Threat model (excerpt)

### Adversary classes

1. **Skiddies** — script kiddies running off-the-shelf scanners, vote bots,
   and credential stuffing.
2. **Operators of competing platforms** — well-funded reverse-engineers
   looking for a market-killing exploit.
3. **State actors / advanced** — full source access, supply-chain
   compromise, hardware implants, AI-assisted vuln discovery.

We design for class 3 because cheap controls protect against all three.

### Crown jewels

| Asset             | Why it matters                              |
|-------------------|---------------------------------------------|
| User funds        | Direct financial loss + class-action risk.  |
| Vote integrity    | Loss of trust → platform death.             |
| User PII          | GDPR/CCPA + reputational.                   |
| CSAM-free uploads | Existential — operator goes to prison.      |
| Refresh tokens    | Persistent account compromise.              |
| Stripe keys       | Funds drain.                                |

## Controls

### Auth

- **Argon2id** password hashes (m=19MB, t=2, p=1).
- **JWT HS256** access tokens (15 min). Strong audience + issuer claims.
- **Opaque refresh tokens** (256-bit), SHA-256-indexed + Argon2id verified.
- **Refresh rotation** with parent-chain replay detection: presenting a
  revoked refresh token invalidates **all** sessions for that user.
- **Constant-time compare** for any secret material.
- **No user enumeration**: same response shape for unknown email vs wrong
  password, with timing-equalised dummy-hash verification.

### Input

- **zod validation** at every public boundary; same schemas in mobile +
  api so DTOs cannot drift.
- **Body size cap** (1 MiB) at the Fastify layer.
- **Username ASCII-only** to prevent homoglyph impersonation.
- **Cents-as-integers** — never floats for money.

### Uploads

- **Direct-to-S3 presigned POST** with policy-pinned content-type,
  content-length range, and key prefix.
- **HEAD verification** server-side before any URL is persisted to the DB.
- **CSAM scan** (PhotoDNA / AWS Rekognition) is required before any
  video appears in a public feed — Phase-1 ships the hook; integration
  before public launch.

### Voting

- **One vote per (challenge, voter)** at app + DB level (unique index).
- **Self-vote forbidden** at the application layer.
- **Vote counts hidden during voting window** to mitigate bandwagon abuse.
- **Fraud scorer** flags new accounts, IP clusters, and co-vote rings.
  Auto-flag at score ≥75; review queue at ≥50.

### Payments

- **Stripe Connect** for payouts. KYC required.
- **Webhook signature verification** before any DB write.
- **Append-only ledger** (`WalletTransaction`) with idempotency keys
  to make double-spend on retry impossible.

### Logging + secrets

- **Pino** with redact paths covering authorization headers, password
  fields, refresh tokens, set-cookie, and PII (email, DOB).
- **No secret comparisons via `===`**; every secret cmp is constant-time.
- **`.env` never committed**; `pnpm.onlyBuiltDependencies` controls
  which native packages are allowed to run install scripts.

### Transport + edge

- **CORS allow-list** (no `*`) read from env at startup.
- **Helmet** with default-src `'none'`, frame-ancestors `'none'`, HSTS
  for 2 years preload, strict CORP/COEP/COOP.
- **TLS 1.3 only** at the edge — enforce in nginx/cloud-LB config.

### Build supply chain

- **pnpm with frozen lockfile** in CI.
- **`onlyBuiltDependencies` allow-list** for postinstall scripts.
- **Weekly CodeQL + npm audit + Gitleaks** scans on `main`.

## Known gaps (tracked)

- Phase 3: Stripe Connect payout flow is a `NotImplementedException`
  skeleton. **Cannot launch** until this is wired and webhook
  signatures verified.
- Phase 1.5: third-party identity check (Stripe Identity) for
  age-promote-from-self-declaration is not yet wired.
- CSAM hash list integration (PhotoDNA) is hooked at architecture
  but unconnected; **mandatory pre-launch**.
- Rate limits use in-memory throttler. Replace with redis-backed
  throttler before scale-out.

## AVP-2 alignment

This project follows the AVP-2 Adversarial Validation Protocol — see
`docs/AVP-NOTES.md` for the per-pass ledger.
