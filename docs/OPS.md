# Skill Shots — Ops runbook (initial)

This file gets richer as we approach launch. For now it's a punch-list
of what production needs that local dev does not.

## Production topology (target)

```
            ┌──────────┐
            │  CDN     │  Cloudflare / Fastly + CSAM-scanned assets
            └────┬─────┘
                 │ TLS 1.3
            ┌────▼──────┐
            │ LB / WAF  │  Cloudflare / AWS WAF
            └────┬──────┘
                 │ mTLS to backplane
       ┌─────────┴─────────┐
       │                   │
  ┌────▼─────┐       ┌─────▼─────┐
  │ api (N)  │       │ workers   │
  └────┬─────┘       └─────┬─────┘
       │                   │
       ▼                   ▼
   Postgres           Redis     S3/R2
   (managed,          (managed) (S3+CSAM scan)
   PITR on)
```

## Required before public launch

- [ ] TLS 1.3 only at LB. HSTS preload.
- [ ] Stripe Connect onboarding, webhooks, payout, refund — all wired.
- [ ] CSAM scan (PhotoDNA / Rekognition) on every video upload.
- [ ] DMCA takedown procedure documented; <24h SLA staffed.
- [ ] Postgres PITR (point-in-time recovery) verified by drill.
- [ ] Backup encryption keys held separately from DB host.
- [ ] Redis-backed rate limiter (replaces in-memory throttler).
- [ ] Sentry / equivalent error tracking with PII scrubbing.
- [ ] Status page.
- [ ] Incident response runbook + on-call rotation.
- [ ] Legal review per launch market (see `LEGAL_NOTES.md`).
- [ ] Insurance: tech-E&O + cyber-liability + content-moderation.

## Secrets

- All secrets through your secret manager (AWS Secrets Manager,
  Vault, Doppler, etc.) — **never** environment files in git.
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are fresh per environment;
  rotate on a 90-day cadence.
- Stripe webhook secret rotates whenever staff with access leave.

## Observability

- **Liveness**: `GET /health/live` (cheap, always 200 if process up).
- **Readiness**: `GET /health/ready` (DB ping; gates traffic).
- **Logs**: pino JSON. Ship to a pipe that re-runs the redact paths
  before they hit your search index.
- **Metrics**: counter on `vote.cast`, `vote.flagged`, `entry.created`,
  `challenge.created`, `payout.completed`, `refund.requested`.

## Runbooks

- **Vote-fraud flood**: `SELECT * FROM votes WHERE invalidatedReason IS NOT NULL ORDER BY createdAt DESC LIMIT 200`
  → identify the cluster → ban ring members → notify affected challenge
  creators. Refund entries on disqualification.
- **Stripe webhook delivery failure**: Stripe automatically retries; ensure
  the idempotency key on `WalletTransaction` is preserved end-to-end so
  retries are no-ops, not double-spends.
- **Database lock**: do not `kill -9` postgres. Use `pg_terminate_backend`
  on the offending pid. If the lock holder is a migration, freeze deploys
  until migration completes; do **not** roll forward.
