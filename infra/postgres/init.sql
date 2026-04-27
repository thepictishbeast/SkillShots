-- Postgres init for Skill Shots.
-- Citext is used by Prisma's @db.Citext on the email column for
-- case-insensitive uniqueness without an extra LOWER() index.
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
