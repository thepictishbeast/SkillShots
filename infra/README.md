# Skill Shots — local infra

Three services for local dev:

| Service   | Port  | Purpose                                  |
|-----------|-------|------------------------------------------|
| postgres  | 5432  | App database. citext + pgcrypto enabled. |
| minio     | 9000  | S3-compatible object store for videos.   |
| minio UI  | 9001  | Web console (`minioadmin / minioadmin`). |
| redis     | 6379  | Rate-limit + queue backbone.             |

## Quick start

```bash
pnpm infra:up
cd apps/api
cp .env.example .env
# Edit .env to put real JWT secrets — `openssl rand -base64 64` twice.
pnpm prisma migrate dev
pnpm dev
```

## Reset

```bash
pnpm infra:reset    # destructive: wipes all volumes
```

## Production note

This compose file is **dev-only**. Production deployment uses managed Postgres,
S3 / R2, and ElastiCache / Upstash. See `docs/OPS.md` for production topology.
