# MARHABA V14 — Public Beta Testing Guide

Welcome to the **MARHABA V14 Public Beta**!

## Important Beta Notice
- **Demo Data**: Listings and prices include seeded demonstration records for testing across Morocco (including Laâyoune, Dakhla, Marrakech, Casablanca, Agadir, Essaouira, Fès, Chefchaouen, and Merzouga).
- **Sandbox Payments**: Checkout runs in **Sandbox Mode**. No real credit card charges occur.
- **External Inquiries**: Flight requests, ONCF/CTM transport requests, and eSIM orders create honest `pending_quote` / `pending_provider` records—live airline/carrier/eSIM issuance requires external provider APIs.

## Demo Accounts for Testers
- **Traveler Demo**: `traveler@marhaba.ma` / `MarhabaTraveler2026!`
- **Partner Demo**: `partner@marhaba.ma` / `MarhabaPartner2026!`
- **Affiliate Demo**: `affiliate@marhaba.ma` / `MarhabaAffiliate2026!`
*(Or click **"Sign in"** → **"Create account"** to register a fresh tester account.)*

## What to Test
1. **Language & Theme**: Switch between all 7 languages (including Arabic RTL) and Light / Dark / Auto themes in the header preferences menu (`EN · MAD`).
2. **Search & Discovery**: Filter by category (`Stay`, `Car`, `Food`, `Experience`), search `Laâyoune` or `العيون`, test **Near Me** geolocation, and toggle **Map View**.
3. **Booking & Account**: Request a quote, apply promo `MARHABA10`, submit a hold, complete Sandbox checkout, inspect `/account` receipts, modify dates, or cancel/refund.
4. **Services & AI Trip Planner**: Submit a Flight, Train/Bus, or eSIM request at `/services`, or build a budget-aware itinerary at `/planner`.
5. **Partner Portal (`/partner`)**: Manage listings, inventory calendar, pricing rules, and reservations.
6. **Send Beta Feedback**: Report any bug, layout issue, or suggestion at `/feedback`.
