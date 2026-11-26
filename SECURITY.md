# MARHABA V14 — Security & Privacy Architecture

## Authentication & Session Security
- Passwords hashed using Node `crypto.scrypt` with unique per-user 16-byte salts and timing-safe comparison (`src/lib/auth.ts`).
- Sessions stored server-side in SQLite (`sessions` table) using SHA-256 token hashes and signed HTTP-only cookies (`marhaba_session`, HMAC-SHA256).
- Self-service profile edits and account deletion/anonymization supported via `/api/v1/account`.

## Authorization & Data Isolation
- Role-Based Access Control (`traveler`, `partner_owner`, `partner_manager`, `partner_staff`, `affiliate`, `support`, `finance`, `content_manager`, `admin`, `super_admin`) enforced server-side on all API routes.
- Travelers can only inspect, modify, or cancel their own bookings.
- Partners can only manage properties and reservations owned by their `partner_id`.
- Admin credentials are never exposed in frontend code or public tester guides.

## HTTP Headers & Input Validation
- Security headers configured in `next.config.ts`: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.
- Request payloads validated with `zod`; strings sanitized against XSS; SQL statements parameterized via `better-sqlite3`.
- No raw payment card numbers are ever persisted.

## Privacy Notice
Draft Privacy Policy (`/legal/privacy`) and Terms (`/legal/terms`) are aligned with Moroccan Law 09-08 (CNDP) and GDPR principles and marked for formal legal counsel review before commercial launch.
