# MARHABA V14 — Testing & Quality Verification Guide

## Automated Test Suite (`tests/ota-engine.test.ts`)
Run the full Vitest suite:
```bash
npm test
```

Verified coverage includes:
- Database seeding (55+ listings, 13 destinations, room types)
- Password hashing (`scrypt`) and DB-backed HMAC session lifecycle
- Multi-currency formatting (`MAD`, `EUR`, `USD`) and night enumeration
- Dynamic quoting engine (promotions, VAT, service fee, partner commission)
- ACID double-booking prevention & inventory restoration on cancellation/refund
- Live-DB grounded AI Travel Assistant (EN, FR, AR, Laâyoune, emergency SOS)
- 7-language dictionary & Arabic RTL direction (`ar`, `fr`, `en`, `es`, `de`, `it`, `pt`)
- V14 service schemas (`flight_requests`, `transport_requests`, `esim_requests`, `itineraries`)

## Type & Build Verification
```bash
npx tsc --noEmit
npm run build
```

## Live Server End-to-End Smoke Checks
Verify all SSR routes (`/`, `/search`, `/services`, `/planner`, `/offline`, `/destinations/laayoune`, `/account`, `/partner`, `/admin`, `/feedback`, `/legal/privacy`, `/legal/terms`), `/api/v1/health`, authentication flows, RBAC isolation, booking holds, and beta feedback submission.
