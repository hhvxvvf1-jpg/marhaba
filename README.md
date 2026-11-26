# MARHABA V14 — Multilingual AI Travel & Services Marketplace

MARHABA V14 evolves the original MARHABA V13 HTML prototype into a production-ready, full-stack **Next.js 15 + TypeScript + SQLite** travel marketplace serving Morocco (including Laâyoune, Dakhla, Marrakech, Casablanca, Agadir, Essaouira, Fès, Chefchaouen, Rabat, Tangier, Merzouga, Ouarzazate, Meknes).

---

## 1. V13 → V14 Feature Inventory & Preservation Checklist

| V13 Feature / Ecosystem | V14 Implementation | Status |
|---|---|---|
| **Accommodations** (hotels, riads, villas, apartments, camps) | SSR `/`, `/search`, `/properties/[slug]`, `/destinations/[slug]`, Partner Portal (`/partner`) | Preserved & Upgraded |
| **Car Rentals** (economy, auto/manual, 4x4, luxury, delivery) | Real-time DB listings, search filter `type=car`, arrival cross-sell after flight requests | Preserved & Upgraded |
| **Food & Restaurants** | Searchable `type=food` catalog, pricing, provider confirmation | Preserved & Upgraded |
| **Experiences & Activities** | Searchable `type=exp` catalog, desert/surf/cultural excursions, availability checks | Preserved & Upgraded |
| **Flights Requests** (Europe ↔ Morocco, one-way/return, cabin, baggage, flexible dates) | `/services?tab=flights` + `POST /api/v1/services/flights` + `flight_requests` SQLite table + arrival car suggestions (honest `pending_quote` — no fake live airline seats) | Preserved & Upgraded |
| **Trains & Buses** (ONCF / Al Boraq / CTM / Supratours / transfers) | `/services?tab=transport` + `POST /api/v1/services/transport` + `transport_requests` SQLite table | Preserved & Upgraded |
| **eSIM Maroc** (1 / 3 / 5 / 10 / 20 GB packages, unlocked phone notice) | `/services?tab=esim` + `POST /api/v1/services/esim` + `esim_requests` SQLite table (`pending_provider` until eSIM API connected) | Preserved & Upgraded |
| **Additional Travel Services** (SOS 19 / 177 / 15, FX/ATMs, Visa, Medical, Luggage) | `/services?tab=guide` + AI Assistant emergency triggers | Preserved & Upgraded |
| **AI Trip Planner & Multi-Service Builder** | `/planner` + `POST /api/v1/planner` + `itineraries` table + optional multi-provider hold creation | Preserved & Upgraded |
| **Multilingual AI Concierge** (EN, FR, AR / Darija) | `AiAssistantDrawer` + `POST /api/v1/ai/assistant` & `/api/assistant` grounded in live SQLite | Preserved & Upgraded |
| **7 Languages + Arabic RTL** (`ar`, `fr`, `en`, `es`, `de`, `it`, `pt`) | `src/lib/i18n.ts` + `Navbar` selector + automatic `dir="rtl"` for `ar` | Preserved & Upgraded |
| **Dark / Light / Auto Theme** | `globals.css` `[data-theme]` + `prefers-color-scheme: dark` + `Navbar` toggle | Preserved & Upgraded |
| **Near-Me Geolocation Search & Interactive Map** | `/search` Near Me button (`navigator.geolocation` + Haversine km) + SVG Morocco map | Preserved & Upgraded |
| **Mobile Bottom Navigation & PWA** | `MobileBottomNav` + `/manifest.json` + `/sw.js` + `/offline` fallback | Preserved & Upgraded |
| **Role-Based Auth, Partner Portal, Super Admin, Double-Entry Ledger** | `scrypt` + HMAC HTTP-only sessions, `/partner` (iCal `.ics` sync, bulk calendar, pricing rules), `/admin` | New V14 Core |

---

## 2. Database Architecture (`src/db/schema.ts`)

SQLite (`better-sqlite3`, WAL mode, `foreign_keys = ON`, `IMMEDIATE` transactions) with 32 normalized tables:
- **Core Auth & RBAC**: `users`, `sessions`, `audit_logs`, `partners`
- **Marketplace Inventory**: `destinations`, `properties`, `room_types`, `availability_overrides`, `pricing_rules`, `promotions`, `wishlists`
- **Transactional OTA Engine**: `bookings`, `booking_items`, `payments`, `refunds`, `payouts`, `ledger_entries`
- **Travel Services & Planner (V14)**: `flight_requests`, `transport_requests`, `esim_requests`, `itineraries`
- **Engagement & Ops**: `reviews`, `conversations`, `messages`, `notifications`, `support_tickets`, `affiliates`, `referral_clicks`, `newsletter_subscribers`, `channel_integrations`, `sync_logs`, `cms_blocks`, `system_settings`

---

## 3. Key API Endpoints

- `GET /api/v1/marketplace/home` — Featured destinations, stays, cars, experiences, active promotions
- `GET /api/v1/properties` — Filterable search (`q` with Arabic/Latin aliases, `city`, `type`, `minPrice`, `maxPrice`, `amenities`, `lat`/`lng`, `sort=nearest`)
- `POST /api/v1/bookings/quote` & `POST /api/v1/bookings` — Live quote + 15-minute transactional hold
- `POST /api/v1/bookings/[id]/pay` & `POST /api/v1/bookings/[id]/cancel` — Payment capture (sandbox/provider) & cancellation/refund ledger entries
- `GET/POST /api/v1/services/flights` — Flight fare requests + destination car rental cross-sell
- `GET/POST /api/v1/services/transport` — ONCF/CTM/Supratours & transfer requests
- `GET/POST /api/v1/services/esim` — Morocco eSIM packages & activation requests
- `GET/POST /api/v1/planner` — Budget-aware real-DB itinerary builder + multi-service hold creation
- `POST /api/v1/ai/assistant` (and `/api/assistant`) — Live-DB grounded AI travel assistant
- `GET/PATCH /api/v1/admin/services` — Super Admin management of flight, transport, and eSIM requests

---

## 4. Installation & Deployment

```bash
cp .env.example .env.local
npm install
npm run db:seed
npm test
npx tsc --noEmit
npm run build
npm run start
```

### Public Beta Demo Accounts
- **Traveler**: `traveler@marhaba.ma` / `MarhabaTraveler2026!`
- **Partner**: `partner@marhaba.ma` / `MarhabaPartner2026!`
- **Affiliate**: `affiliate@marhaba.ma` / `MarhabaAffiliate2026!`

*(Administrator credentials are kept private and are not published in frontend code or public docs.)*

### Security & Truthfulness Guardrails
- Passwords hashed with Node `crypto.scrypt` + per-user salt; HTTP-only HMAC-SHA256 cookies.
- No fake live airline, train, or eSIM provider confirmations; all external requests begin as `pending_quote` or `pending_provider`.
- Sandbox payment processing is explicitly labeled as sandbox until live gateway keys (`CMI`, `Stripe`, `PayPal`) are configured in `.env.local`.
