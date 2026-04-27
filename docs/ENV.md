# Skill Shots — environment variables

Authoritative reference. Validation lives in `apps/api/src/config/env.ts`.
The API refuses to start with an invalid env.

| Var                          | Required | Default                            | Description |
|------------------------------|----------|------------------------------------|-------------|
| `NODE_ENV`                   | no       | `development`                      | `development` / `test` / `production` |
| `PORT`                       | no       | `4000`                             | API listen port |
| `LOG_LEVEL`                  | no       | `info`                             | pino level |
| `DATABASE_URL`               | YES      | —                                  | postgres URL (must be `postgresql://`) |
| `JWT_ACCESS_SECRET`          | YES      | —                                  | ≥32 chars; **fresh CSPRNG**, NOT the example default |
| `JWT_REFRESH_SECRET`         | YES      | —                                  | ≥32 chars; **MUST differ** from access secret |
| `JWT_ACCESS_TTL_SECONDS`     | no       | `900` (15 min)                     | bounded 60–3600 |
| `JWT_REFRESH_TTL_SECONDS`    | no       | `2592000` (30 d)                   | bounded 1h–60d |
| `CORS_ORIGINS`               | YES      | —                                  | comma-list of allowed origins |
| `S3_ENDPOINT`                | YES      | —                                  | S3 / R2 / Minio URL |
| `S3_REGION`                  | YES      | —                                  | e.g. `us-east-1` |
| `S3_BUCKET`                  | YES      | —                                  | bucket name |
| `S3_ACCESS_KEY`              | YES      | —                                  | bucket access key |
| `S3_SECRET_KEY`              | YES      | —                                  | bucket secret |
| `S3_FORCE_PATH_STYLE`        | no       | `true`                             | minio + many R2 setups need this |
| `S3_PUBLIC_HOSTS`            | YES      | —                                  | comma-list of CDN hosts that may serve uploaded media |
| `MAX_VIDEO_BYTES`            | no       | `104857600` (100 MiB)              | hard cap; presigned-policy enforced |
| `MAX_VIDEO_DURATION_SECONDS` | no       | `120`                              | client-side hint; server transcoder enforces |
| `ALLOWED_VIDEO_MIME`         | YES      | —                                  | comma-list, e.g. `video/mp4,video/webm` |
| `STRIPE_SECRET_KEY`          | no\*     | empty                              | required before Phase-3 launch |
| `STRIPE_WEBHOOK_SECRET`      | no\*     | empty                              | required before Phase-3 launch |
| `STRIPE_PLATFORM_FEE_BPS`    | no       | `1250` (12.5%)                     | clamp 1000–1500 (10.0–15.0%) |
| `RL_GLOBAL_PER_MIN`          | no       | `600`                              | global rate-limit per IP per minute |
| `RL_AUTH_PER_MIN`            | no       | `20`                               | per-route limit on /auth |
| `RL_VOTE_PER_MIN`            | no       | `60`                               | per-route limit on /vote |
| `MIN_AGE_YEARS`              | no       | `18`                               | clamp 13–99 |

\* Empty Stripe values pass startup but `wallet/*` endpoints raise
`NotImplementedException` at runtime — the gating is intentional so the
API can run for development before Stripe is wired.
