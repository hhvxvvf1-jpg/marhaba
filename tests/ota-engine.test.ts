import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";
import {
  calculateQuote,
  cancelAndRefundBookingTransactional,
  confirmBookingPaymentTransactional,
  createBookingTransactional,
  enumerateNights,
} from "@/lib/booking-engine";
import { createSession, getUserFromToken, hashPassword, revokeSession, verifyPassword } from "@/lib/auth";
import { runAssistantQuery } from "@/lib/ai-assistant";
import { formatMoney } from "@/lib/config";
import { LANGUAGES, DICTIONARY, t, tAmenity, tCity, tRegion } from "@/lib/i18n";
import { ESIM_PACKAGES } from "@/lib/services-catalog";
import { MOROCCO_CITIES, MOROCCO_REGIONS, findNearestMoroccanCity, resolveMoroccanCity } from "@/lib/morocco-cities";
import { computeRouteDistanceKm, generateMoroccoSchedules } from "@/lib/transport-engine";
import { pruneUnavailableOffers, queryActiveTransportOffers } from "@/lib/transport-offers";
import { checkRateLimit, isSameOriginRequest, maskEmail, sanitizePhone } from "@/lib/security";
import { generateBookingIcs, getIntegrationReadiness } from "@/lib/providers";

beforeAll(() => {
  ensureSeeded();
});

describe("MARHABA OTA Core Engine & Security", () => {
  it("seeds all 55 Moroccan listings, 12 destinations, and room types", () => {
    const db = getDb();
    const propCount = (db.prepare(`SELECT COUNT(*) AS cnt FROM properties`).get() as { cnt: number }).cnt;
    const destCount = (db.prepare(`SELECT COUNT(*) AS cnt FROM destinations`).get() as { cnt: number }).cnt;
    const roomCount = (db.prepare(`SELECT COUNT(*) AS cnt FROM room_types`).get() as { cnt: number }).cnt;
    expect(propCount).toBeGreaterThanOrEqual(55);
    expect(destCount).toBeGreaterThanOrEqual(12);
    expect(roomCount).toBeGreaterThanOrEqual(55);
  });

  it("hashes passwords with scrypt and manages DB-backed HMAC sessions", () => {
    const hash = hashPassword("SecretPass2026!");
    expect(verifyPassword("SecretPass2026!", hash)).toBe(true);
    expect(verifyPassword("WrongPass", hash)).toBe(false);

    const db = getDb();
    const traveler = db.prepare(`SELECT id FROM users WHERE email = 'traveler@marhaba.ma'`).get() as { id: number };
    const session = createSession(traveler.id, "127.0.0.1", "vitest");
    const user = getUserFromToken(session.token);
    expect(user?.id).toBe(traveler.id);
    expect(user?.role).toBe("traveler");

    revokeSession(session.token);
    expect(getUserFromToken(session.token)).toBeNull();
  });

  it("enumerates nights and computes multi-currency prices accurately", () => {
    expect(enumerateNights("2026-12-01", "2026-12-04")).toEqual(["2026-12-01", "2026-12-02", "2026-12-03"]);
    expect(formatMoney(1000, "MAD")).toContain("MAD");
    expect(formatMoney(1000, "EUR")).toContain("EUR");
    expect(formatMoney(1000, "USD")).toContain("USD");
  });

  it("calculates dynamic quotes with promo codes, VAT, service fee, and commission", () => {
    const db = getDb();
    const row = db
      .prepare(
        `SELECT p.id AS property_id, rt.id AS room_type_id
         FROM properties p JOIN room_types rt ON rt.property_id = p.id
         WHERE p.status = 'active' LIMIT 1`
      )
      .get() as { property_id: number; room_type_id: number };

    const q = calculateQuote({
      propertyId: row.property_id,
      roomTypeId: row.room_type_id,
      checkIn: "2027-02-10",
      checkOut: "2027-02-13",
      adults: 2,
      children: 0,
      units: 1,
      promoCode: "MARHABA10",
    });

    expect(q.available).toBe(true);
    expect(q.nights).toBe(3);
    expect(q.promoApplied?.code).toBe("MARHABA10");
    expect(q.discountMad).toBeGreaterThan(0);
    expect(q.taxesMad).toBeGreaterThan(0);
    expect(q.serviceFeeMad).toBeGreaterThan(0);
    expect(q.totalMad).toBeGreaterThan(q.subtotalMad - q.discountMad);
    expect(q.commissionMad + q.partnerNetMad).toBeGreaterThan(0);
  });

  it("prevents double-booking when room inventory is exhausted, then restores inventory on cancellation & refund", () => {
    const db = getDb();
    const traveler = db.prepare(`SELECT id FROM users WHERE email = 'traveler@marhaba.ma'`).get() as { id: number };
    const prop = db.prepare(`SELECT id, partner_id FROM properties WHERE status = 'active' LIMIT 1`).get() as {
      id: number;
      partner_id: number;
    };

    const rtRes = db
      .prepare(
        `INSERT INTO room_types (property_id, name, name_fr, name_ar, total_units, base_price_mad, max_adults, max_children, status)
         VALUES (?, 'Vitest Single Unit Suite', 'Suite Test', 'جناح اختبار', 1, 1000, 2, 1, 'active')`
      )
      .run(prop.id);
    const roomTypeId = Number(rtRes.lastInsertRowid);

    const checkIn = "2028-06-10";
    const checkOut = "2028-06-12";

    const firstBooking = createBookingTransactional({
      travelerId: traveler.id,
      propertyId: prop.id,
      roomTypeId,
      checkIn,
      checkOut,
      adults: 2,
      children: 0,
      units: 1,
      guestName: "Test Traveler",
      guestEmail: "traveler@marhaba.ma",
      guestPhone: "+212600000000",
      currency: "MAD",
    });

    expect(firstBooking.bookingRef).toMatch(/^MRH-/);

    expect(() =>
      createBookingTransactional({
        travelerId: null,
        propertyId: prop.id,
        roomTypeId,
        checkIn,
        checkOut,
        adults: 2,
        children: 0,
        units: 1,
        guestName: "Second Traveler",
        guestEmail: "second@marhaba.ma",
        guestPhone: "+212611111111",
        currency: "MAD",
      })
    ).toThrow(/available|unit/i);

    const payRes = confirmBookingPaymentTransactional({
      bookingId: firstBooking.bookingId,
      actorUserId: traveler.id,
      provider: "sandbox_card",
      methodSummary: "sandbox_card •••• 4242",
    });
    expect(payRes.status).toBe("confirmed");

    const ledgerCount = (
      db.prepare(`SELECT COUNT(*) AS cnt FROM ledger_entries WHERE booking_id = ?`).get(firstBooking.bookingId) as { cnt: number }
    ).cnt;
    expect(ledgerCount).toBe(5);

    const cancelRes = cancelAndRefundBookingTransactional({
      bookingId: firstBooking.bookingId,
      actorUserId: traveler.id,
      reason: "Test cancellation",
    });
    expect(cancelRes.refundAmountMad).toBe(firstBooking.quote.totalMad);

    const rebook = createBookingTransactional({
      travelerId: traveler.id,
      propertyId: prop.id,
      roomTypeId,
      checkIn,
      checkOut,
      adults: 2,
      children: 0,
      units: 1,
      guestName: "Rebook Traveler",
      guestEmail: "traveler@marhaba.ma",
      guestPhone: "+212600000000",
      currency: "MAD",
    });
    expect(rebook.bookingId).toBeGreaterThan(firstBooking.bookingId);

    cancelAndRefundBookingTransactional({
      bookingId: rebook.bookingId,
      actorUserId: traveler.id,
      reason: "Cleanup Vitest rebook",
    });
  });

  it("grounds AI Travel Assistant responses in live DB inventory across EN, FR, and AR", () => {
    const enRes = runAssistantQuery({ message: "3-day itinerary in Marrakech under 3000 MAD", lang: "en" });
    expect(enRes.groundedInLiveDb).toBe(true);
    expect(enRes.recommendations.length).toBeGreaterThan(0);
    expect(enRes.itinerary.length).toBe(3);

    const arRes = runAssistantQuery({ message: "أريد فندق في مراكش", lang: "ar" });
    expect(arRes.lang).toBe("ar");
    expect(arRes.recommendations.length).toBeGreaterThan(0);

    const laayouneRes = runAssistantQuery({ message: "Car in Laâyoune", lang: "en" });
    expect(laayouneRes.recommendations.some((r) => r.city === "Laâyoune")).toBe(true);

    const sosRes = runAssistantQuery({ message: "Morocco emergency police number", lang: "en" });
    expect(sosRes.serviceActionUrl).toBe("/services?tab=guide");
    expect(sosRes.reply).toContain("19");
  });

  it("supports all 7 V14 languages with RTL Arabic and V14 service schemas", () => {
    expect(LANGUAGES.map((l) => l.code)).toEqual(["ar", "fr", "en", "es", "de", "it", "pt"]);
    expect(LANGUAGES.find((l) => l.code === "ar")?.dir).toBe("rtl");
    for (const lang of LANGUAGES) {
      expect(DICTIONARY[lang.code]).toBeDefined();
      expect(t(lang.code, "nav.services").length).toBeGreaterThan(0);
      expect(t(lang.code, "nav.planner").length).toBeGreaterThan(0);
    }

    expect(ESIM_PACKAGES.length).toBeGreaterThanOrEqual(6);
    expect(ESIM_PACKAGES[0].priceMad).toBe(50);

    const db = getDb();
    const tables = db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name IN ('flight_requests','transport_requests','esim_requests','itineraries','beta_feedback')`)
      .all() as Array<{ name: string }>;
    expect(tables.length).toBe(5);
  });

  it("never exposes super-admin credentials in frontend components or public beta guides", () => {
    const authModal = fs.readFileSync(path.join(process.cwd(), "src/components/AuthModal.tsx"), "utf8");
    const adminPage = fs.readFileSync(path.join(process.cwd(), "src/app/admin/page.tsx"), "utf8");
    const betaGuide = fs.readFileSync(path.join(process.cwd(), "BETA_TEST_GUIDE.md"), "utf8");
    const readme = fs.readFileSync(path.join(process.cwd(), "README.md"), "utf8");

    expect(authModal).not.toContain("MarhabaAdmin2026!");
    expect(authModal).not.toContain("admin@marhaba.ma");
    expect(adminPage).not.toContain("admin@marhaba.ma");
    expect(betaGuide).not.toContain("MarhabaAdmin2026!");
    expect(readme).not.toContain("MarhabaAdmin2026!");
  });

  it("includes Moroccan cities across all 12 regions and resolves aliases cleanly", () => {
    expect(MOROCCO_REGIONS.length).toBe(12);
    expect(MOROCCO_CITIES.length).toBeGreaterThanOrEqual(50);
    expect(resolveMoroccanCity("casa")).toBe("Casablanca");
    expect(resolveMoroccanCity("tanger")).toBe("Tangier");
    expect(resolveMoroccanCity("العيون")).toBe("Laâyoune");
    expect(resolveMoroccanCity("tetouan")).toBe("Tétouan");
    expect(resolveMoroccanCity("إفران")).toBe("Ifrane");
  });

  it("auto-detects and prevents duplicate overlapping reservations in the same category while allowing different categories", () => {
    const db = getDb();
    const traveler = db.prepare(`SELECT id, email FROM users WHERE email = 'traveler@marhaba.ma'`).get() as {
      id: number;
      email: string;
    };
    const stays = db
      .prepare(
        `SELECT p.id AS property_id, rt.id AS room_type_id
         FROM properties p JOIN room_types rt ON rt.property_id = p.id
         WHERE p.status = 'active' AND p.marketplace_type = 'stay'
         GROUP BY p.id LIMIT 2`
      )
      .all() as Array<{ property_id: number; room_type_id: number }>;
    const car = db
      .prepare(
        `SELECT p.id AS property_id, rt.id AS room_type_id
         FROM properties p JOIN room_types rt ON rt.property_id = p.id
         WHERE p.status = 'active' AND p.marketplace_type = 'car'
         LIMIT 1`
      )
      .get() as { property_id: number; room_type_id: number };

    const checkIn = "2027-09-10";
    const checkOut = "2027-09-14";

    const firstStay = createBookingTransactional({
      travelerId: traveler.id,
      propertyId: stays[0].property_id,
      roomTypeId: stays[0].room_type_id,
      checkIn,
      checkOut,
      adults: 2,
      children: 0,
      units: 1,
      guestName: "Dup Guard Tester",
      guestEmail: traveler.email,
      guestPhone: "+212600000000",
      currency: "MAD",
    });

    // Quote for another stay on overlapping dates should auto-detect the category conflict
    const overlapQuote = calculateQuote({
      propertyId: stays[1].property_id,
      roomTypeId: stays[1].room_type_id,
      checkIn: "2027-09-11",
      checkOut: "2027-09-13",
      travelerId: traveler.id,
      guestEmail: traveler.email,
    });
    expect(overlapQuote.duplicateConflict).toBeDefined();
    expect(overlapQuote.duplicateConflict?.bookingRef).toBe(firstStay.bookingRef);
    expect(overlapQuote.duplicateConflict?.category).toBe("stay");

    // Creating a second stay booking on overlapping dates should throw
    expect(() =>
      createBookingTransactional({
        travelerId: traveler.id,
        propertyId: stays[1].property_id,
        roomTypeId: stays[1].room_type_id,
        checkIn: "2027-09-11",
        checkOut: "2027-09-13",
        adults: 2,
        children: 0,
        units: 1,
        guestName: "Dup Guard Tester",
        guestEmail: traveler.email,
        guestPhone: "+212600000000",
        currency: "MAD",
      })
    ).toThrow(/Auto-detected existing/i);

    // Different category (car rental) on the same dates should NOT conflict
    const carQuote = calculateQuote({
      propertyId: car.property_id,
      roomTypeId: car.room_type_id,
      checkIn,
      checkOut,
      travelerId: traveler.id,
      guestEmail: traveler.email,
    });
    expect(carQuote.duplicateConflict).toBeUndefined();

    // Cleanup test stay booking
    cancelAndRefundBookingTransactional({
      bookingId: firstStay.bookingId,
      actorUserId: traveler.id,
      reason: "Cleanup duplicate detection test",
    });
  });

  it("maintains full 7-language key parity and translates all 56 cities, 12 regions, and amenities", () => {
    const enKeys = Object.keys(DICTIONARY.en).sort();
    expect(enKeys.length).toBeGreaterThanOrEqual(350);
    for (const lang of LANGUAGES) {
      const langKeys = Object.keys(DICTIONARY[lang.code]);
      const missing = enKeys.filter((k) => !langKeys.includes(k));
      const extra = langKeys.filter((k) => !enKeys.includes(k));
      expect(missing).toEqual([]);
      expect(extra).toEqual([]);
    }

    for (const city of MOROCCO_CITIES) {
      expect(tCity("ar", city.name)).toBe(city.nameAr);
      expect(tCity("fr", city.name)).toBe(city.nameFr);
    }

    for (const region of MOROCCO_REGIONS) {
      expect(tRegion("ar", region)).not.toBe(region);
    }

    expect(tAmenity("ar", "Wi-Fi")).toBe(tAmenity("ar", "Wifi"));
    expect(tAmenity("fr", "Free cancellation")).not.toBe("Free cancellation");

    expect(findNearestMoroccanCity(33.5731, -7.5898).city.name).toBe("Casablanca");
    expect(findNearestMoroccanCity(27.1536, -13.2033).city.name).toBe("Laâyoune");

    const boraqSchedules = generateMoroccoSchedules("Tangier", "Casablanca", "intercity");
    expect(boraqSchedules.some((s) => s.isHighSpeed && s.carrierType === "train_oncf")).toBe(true);
    expect(boraqSchedules.some((s) => s.carrierType === "bus_ctm")).toBe(true);
    expect(boraqSchedules.some((s) => s.carrierType === "supratours")).toBe(true);
    expect(boraqSchedules.some((s) => s.carrierType === "taxi_transfer")).toBe(true);
    expect(computeRouteDistanceKm("Laâyoune", "Dakhla")).toBeGreaterThan(400);

    const db = getDb();
    const casaAgadir = queryActiveTransportOffers(db, {
      originCity: "Casablanca",
      destCity: "Agadir",
      mode: "intercity",
    });
    expect(casaAgadir.offers.some((o) => o.carrierBrand.includes("CTM") && o.fareMad === 285)).toBe(true);
    expect(casaAgadir.summary.soldOutHiddenCount).toBeGreaterThanOrEqual(1);
    expect(casaAgadir.offers.every((o) => o.status === "active" && o.seatsLeft > 0)).toBe(true);

    // Unverified niche corridor must NOT fabricate fake schedules
    const niche = queryActiveTransportOffers(db, {
      originCity: "Chefchaouen",
      destCity: "Dakhla",
      mode: "intercity",
    });
    expect(niche.offers).toEqual([]);
    expect(niche.externalSearchLinks.some((l) => l.name === "CheckMyBus")).toBe(true);

    // Expired/removed offers are automatically purged by watchdog pruning
    db.prepare(
      `INSERT OR REPLACE INTO transport_offers (
        offer_code, mode, carrier_type, carrier_brand, line_name,
        origin_city, destination_city, origin_station, destination_station,
        dep_time, arr_time, duration_mins, distance_km, fare_mad, stops,
        amenities_json, seats_left, is_high_speed, source_portal, source_url,
        status, valid_until
      ) VALUES ('TEST-EXPIRED-OFFER', 'intercity', 'bus_ctm', 'CTM Test', 'Test', 'Casablanca', 'Agadir', 'A', 'B', '08:00', '14:00', 360, 465, 285, 1, '[]', 5, 0, 'booking.ctm.ma', 'https://booking.ctm.ma', 'active', '2020-01-01')`
    ).run();
    const prune = pruneUnavailableOffers(db);
    expect(prune.expiredRemoved).toBeGreaterThanOrEqual(1);
    const afterPrune = db.prepare(`SELECT COUNT(*) AS cnt FROM transport_offers WHERE offer_code = 'TEST-EXPIRED-OFFER'`).get() as { cnt: number };
    expect(afterPrune.cnt).toBe(0);
  });

  it("enforces OTA security guards: CSRF origin check, phone sanitization, email masking & rate limiting", () => {
    const sameOriginReq = new Request("https://marhaba.ma/api/v1/bookings", {
      method: "POST",
      headers: { host: "marhaba.ma", origin: "https://marhaba.ma" },
    });
    const crossOriginReq = new Request("https://marhaba.ma/api/v1/bookings", {
      method: "POST",
      headers: { host: "marhaba.ma", origin: "https://evil-attacker.example" },
    });
    expect(isSameOriginRequest(sameOriginReq)).toBe(true);
    expect(isSameOriginRequest(crossOriginReq)).toBe(false);
    expect(sanitizePhone("+212 6-12<script>34")).toBe("+212 6-1234");
    expect(maskEmail("traveler@marhaba.ma")).toBe("tr***@marhaba.ma");

    const rk = `vitest-${Date.now()}`;
    expect(checkRateLimit(rk, 2, 60_000)).toBe(true);
    expect(checkRateLimit(rk, 2, 60_000)).toBe(true);
    expect(checkRateLimit(rk, 2, 60_000)).toBe(false);
  });

  it("organizes Stays across all 5 branded categories (hotel, apartment, riad, villa, resort) with verified local images", () => {
    const db = getDb();
    for (const cat of ["hotel", "apartment", "riad", "villa", "resort"]) {
      const cnt = (
        db.prepare(`SELECT COUNT(*) AS cnt FROM properties WHERE status = 'active' AND marketplace_type = 'stay' AND category = ?`).get(cat) as {
          cnt: number;
        }
      ).cnt;
      expect(cnt).toBeGreaterThanOrEqual(4);
    }

    const stays = db
      .prepare(`SELECT id, category, images_json FROM properties WHERE status = 'active' AND marketplace_type = 'stay'`)
      .all() as Array<{ id: number; category: string; images_json: string }>;
    const legacyBad = new Set(["/images/listings/37.jpg", "/images/listings/38.jpg", "/images/listings/39.jpg", "/images/listings/40.jpg", "/images/listings/41.jpg", "/images/listings/stay-apartment.jpg"]);
    for (const s of stays) {
      const imgs = JSON.parse(s.images_json) as string[];
      expect(imgs.length).toBeGreaterThan(0);
      expect(legacyBad.has(imgs[0])).toBe(false);
      const diskPath = path.join(process.cwd(), "public", imgs[0]);
      expect(fs.existsSync(diskPath)).toBe(true);
    }
  });

  it("validates production integration readiness, RFC-5545 booking ICS export, and PWA manifest shortcuts", () => {
    const readiness = getIntegrationReadiness();
    expect(readiness.items.length).toBeGreaterThanOrEqual(8);
    expect(readiness.liveCount + readiness.sandboxCount).toBe(readiness.items.length);

    const ics = generateBookingIcs({
      bookingRef: "MRH-TEST99",
      title: "Riad Fès Heritage",
      city: "Fès",
      roomName: "Royal Patio Suite",
      checkIn: "2026-12-20",
      checkOut: "2026-12-23",
      guestName: "Karim Tazi",
      status: "confirmed",
    });
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("DTSTART;VALUE=DATE:20261220");
    expect(ics).toContain("DTEND;VALUE=DATE:20261223");
    expect(ics).toContain("MRH-TEST99@marhaba.ma");

    const manifest = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public", "manifest.json"), "utf8"));
    expect(manifest.display).toBe("standalone");
    expect(Array.isArray(manifest.shortcuts)).toBe(true);
    expect(manifest.shortcuts.length).toBeGreaterThanOrEqual(4);
    for (const icon of manifest.icons) {
      expect(["any", "maskable"]).toContain(icon.purpose);
      expect(fs.existsSync(path.join(process.cwd(), "public", icon.src))).toBe(true);
    }
  });
});
