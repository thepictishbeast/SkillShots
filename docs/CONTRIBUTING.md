# Contributing to Skill Shots

## Getting started

```bash
git clone https://github.com/thepictishbeast/SkillShots.git
cd SkillShots
nvm use            # node 22
corepack enable    # if you don't have pnpm
pnpm install
pnpm infra:up      # starts postgres + minio + redis
cd apps/api
cp .env.example .env
# Edit .env and replace JWT_*_SECRET with `openssl rand -base64 64` twice.
pnpm prisma migrate dev
pnpm dev           # API on :4000
```

In a second terminal:

```bash
cd apps/mobile
pnpm start         # Expo dev server; press i / a / w
```

## Dev loop

1. Branch from `main`.
2. **Add a test first** for any non-trivial change.
3. Run `pnpm typecheck && pnpm test` before pushing.
4. Open a PR; CI will run typecheck, tests, audit, and CodeQL.

## AVP-2 gates

This project follows the AVP-2 Adversarial Validation Protocol. Before
shipping any non-trivial change, run the short-loop (Tiers 1–3, six
passes) on the diff. Annotate findings inline with the standard tags:

```
BUG ASSUMPTION:
AVP-PASS-N:
SAFETY:
SECURITY:
REGRESSION-GUARD:
SHIP-DECISION:
```

See `docs/AVP-NOTES.md` for the running ledger.

## Coding rules

- **No `any` outside narrow type-bridging**; tsconfig `strict` is the floor.
- **No `unwrap`-style operators** (non-null assertions `!`) in service
  code without a comment explaining why.
- **Money is integer cents.** Never floats.
- **Public functions ≥ 4 tests** as a target. Property tests for any
  predicate in fraud / pricing / time-window code.
- **No comments that restate the code.** Save comments for non-obvious
  WHY (constraints, invariants, regressions, security proofs).
- **Conventional commits** are encouraged but not enforced.

## Filing a security issue

See `docs/SECURITY.md`. Do not open a public issue.

## Pull-request checklist

- [ ] Tests added or updated
- [ ] `pnpm typecheck` clean
- [ ] `pnpm test` green
- [ ] Migration added if Prisma schema changed (`pnpm prisma migrate dev`)
- [ ] AVP annotations added if security-relevant
- [ ] No secrets in the diff
