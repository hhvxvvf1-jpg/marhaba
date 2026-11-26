# MARHABA V14 — Deployment & Infrastructure Guide

## Architecture Requirements
MARHABA V14 requires a **Node.js server runtime** with persistent filesystem storage for SQLite (`data/marhaba.db`) — or an external SQL/Postgres adapter if scaled horizontally. Static-only hosts such as GitHub Pages cannot execute `/api/v1/*` backend routes, database transactions, or session authentication.

## Recommended Hosting Options
1. **Docker / VPS / Cloud Run / Fly.io / Railway** (supports persistent volume at `/app/data` for SQLite WAL).
2. **Vercel / Serverless** (only when migrated to an external managed database such as Turso/libSQL or PostgreSQL).

## Pre-Deployment Checklist
- [ ] Configure `.env.local` (or platform secrets) from `.env.example` with a strong `MARHABA_SESSION_SECRET`.
- [ ] Keep sandbox payment mode active until CMI / Stripe / PayPal merchant webhooks are verified.
- [ ] Run `npx tsc --noEmit`, `npm test`, and `npm run build`.
- [ ] Confirm `/api/v1/health` returns `{"status":"ok","database":"connected"}`.
- [ ] Schedule automated daily backups of `data/marhaba.db` (using SQLite `.backup`).

## Rollback Procedure
1. Stop the active application process.
2. Restore the previous release build artifact and pre-migration `data/marhaba.db` snapshot.
3. Restart `npm run start` and verify `/api/v1/health`.
