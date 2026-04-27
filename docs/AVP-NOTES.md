# AVP-2 Pass Ledger

Per the AVP-2 Adversarial Validation Protocol, every body of code is run
through six tiers, minimum 36 passes. This ledger records what each pass
turned up. Findings carry **status** and **remediation** alongside their
inline annotations.

> Verdict is always **STILL BROKEN.** Shipping is explicit risk acceptance.

## Tier 1 — Existence proof

### Pass 1 — Skeleton audit (2026-04-27)

- **Finding:** Initial scaffold passes typecheck and unit tests.
- **Action:** None — baseline.

### Pass 2 — Null/zero/empty sweep (2026-04-27)

- **Finding:** `formatTimeLeft` returned non-deterministic output for
  invalid date strings.
- **Action:** Added `Number.isNaN` guard → returns `'closed'`.
- **Test:** `apps/mobile/src/lib/format.test.ts` — "returns 'closed' for invalid date".

### Pass 3 — Boundary sweep (2026-04-27)

- **Finding:** Username regex initially permitted dot — risk of
  `alice.smith` colliding with display logic that splits on dot.
- **Action:** Restricted to `[a-zA-Z0-9_]`.
- **Test:** `packages/shared-types/src/primitives.test.ts` —
  "rejects punctuation and whitespace".

### Pass 4 — Error-path completeness (2026-04-27)

- **Finding:** `verifyPassword` would throw on a malformed argon2 hash
  string (not a SyntaxError, but argon2's specific error). Boundary
  exposed as a 500 to clients otherwise.
- **Action:** Wrapped in try/catch; returns `false` on any verify error.

### Pass 5 — Type tightening (2026-04-27)

- **Finding:** TS strict mode flagged `noUncheckedIndexedAccess`
  violations in `parseOwnerFromKey`.
- **Action:** Added explicit non-null assertion + bounds check. Branded
  `Id`, `Email`, `Username`, `Cents`, `Url` to make accidental
  cross-mixing a type error.

### Pass 6 — Dependency audit (2026-04-27)

- **Finding:** `@fastify/helmet@12` peers `fastify@^5`; `@nestjs/platform-fastify@10.4`
  pins `fastify@4.28`. `pnpm overrides` to `4.29.1` resolves both.
- **Action:** Locked via `pnpm.overrides.fastify`. Constraint: bump on
  any NestJS major.

## Tier 2 — Failure resilience (queued)

### Passes 7–12

- **Pass 7 (fault injection):** stub failures for postgres + S3. Pending
  integration tests (requires `pnpm infra:up`).
- **Pass 8 (concurrency):** verify vote-count increments are atomic
  under concurrent voters. Done at DB level via `INCREMENT` in
  transaction; needs a stress test.
- **Pass 9 (resource exhaustion):** body cap @ 1 MiB; presigned cap @
  `MAX_VIDEO_BYTES`. Tested at zod schema level.
- **Pass 10 (degradation):** /health/live independent of DB. /health/ready
  fails closed.
- **Pass 11 (data integrity):** `WalletTransaction.idempotencyKey` UNIQUE
  prevents double-spend on retried Stripe webhooks. Tested.
- **Pass 12 (combined chaos):** queued — needs e2e harness.

## Tier 3 — Adversarial security (in progress)

- **Pass 13 (deserialization):** zod at every boundary, body cap before parse.
- **Pass 14 (injection sweep):** Prisma fully parameterizes; no raw SQL.
  Throttler caps abuse. CSP `'none'` on API responses.
- **Pass 15 (auth adversarial):** dummy-hash verify on missing user
  (timing-equalised). Refresh-token replay invalidates the chain.
- **Pass 16 (authz):** self-vote forbidden, creator-cannot-enter-own
  forbidden, `AdminGuard` independent of `JwtAuthGuard`.
- **Pass 17 (crypto):** argon2id (OWASP recommended params), HS256 JWT
  with audience + issuer, constant-time secret cmp.
- **Pass 18 (side-channel):** dummy-hash + length-equalising compare.
- **Pass 19 (supply-chain):** `pnpm.onlyBuiltDependencies` allow-list,
  weekly Gitleaks + audit + CodeQL.
- **Pass 20 (network):** Helmet HSTS preload, COOP/COEP/CORP, CORS allow-list.
- **Pass 21 (data at rest):** Argon2id refresh-token verifier; SHA-256
  index for fast lookup. Postgres encryption is operator concern.
- **Pass 22 (data in transit):** TLS-1.3-only is enforced at the edge
  proxy; **document in OPS.md** before launch.
- **Pass 23 (opsec):** redact paths, request-id correlation, error
  filter scrubs internal paths.
- **Pass 24 (fuzzing):** fast-check property tests on `VoteFraudService`.
  Backend zod input fuzzing pending.

## Tier 4 — UX/UI adversarial

- **Pass 25 (first-contact):** `pnpm install && pnpm infra:up && pnpm dev`
  stands up a working API in <5 min on a fresh laptop.
- **Pass 26 (error UX):** every alert tells the user *what*, *why*, and
  what to do next. `_` → space transformation makes API codes legible.
- **Pass 27 (a11y):** WCAG 2.1 AA — accessibilityRole on all interactive
  elements; high-contrast `accent` on `bg0` clears AAA.
- **Pass 28 (perf UX):** every fetch sets a "Loading…" state.
- **Pass 29 (adversarial user):** zod caps caption (280), bio (280),
  rules (2000) at the schema level.
- **Pass 30 (consistency):** 4/8 px grid via `space` tokens; type scale
  in `typo`; designed empty/loading/error states for Arena.

## Tier 5 — Integration & ecosystem

- **Pass 31:** API ↔ mobile share the same zod schemas — drift cannot
  happen unless both are edited at once.
- **Pass 32:** TBD — sibling-repo CROSSFIX once a sibling exists.
- **Pass 33:** TBD — full sibling test sweep on every change.

## Tier 6 — Meta-validation

- **Pass 34 (mutation):** Stryker config TBD.
- **Pass 35 (property):** fast-check on VoteFraudService at 30k cases.
  Add property tests on time-window logic, fee math.
- **Pass 36 (formal):** Out of scope until an invariant is identified
  that's both load-bearing and small enough to formally verify.

## SHIP-DECISION

**2026-04-27 — Initial scaffold:** SHIP-DECISION: STILL BROKEN.

Accepted residual risks:
- Phase 2/3/4 integration tests not yet wired (requires `pnpm infra:up`)
- Stripe Connect is a skeleton (`NotImplementedException`); cannot
  process payments
- CSAM scan integration is unconnected
- Rate limit is in-memory only

Signed: William Armstrong (thepictishbeast).
The loop resumes on the next commit.
