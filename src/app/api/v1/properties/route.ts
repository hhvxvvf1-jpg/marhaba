import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { enumerateNights } from "@/lib/booking-engine";
import { findNearestMoroccanCity, resolveMoroccanCity } from "@/lib/morocco-cities";

function resolveCityAlias(raw: string): string {
  return resolveMoroccanCity(raw);
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

export async function GET(req: Request) {
  ensureSeeded();
  const url = new URL(req.url);
  const qRaw = (url.searchParams.get("q") || "").trim();
  const q = qRaw.toLowerCase();
  const qCityResolved = qRaw ? resolveCityAlias(qRaw) : "";
  const cityRaw = (url.searchParams.get("city") || "").trim();
  const city = cityRaw && cityRaw.toLowerCase() !== "all" ? resolveCityAlias(cityRaw) : "";
  const region = (url.searchParams.get("region") || "").trim();
  const type = (url.searchParams.get("type") || "").trim();
  const category = (url.searchParams.get("category") || "").trim();
  const minPrice = Number(url.searchParams.get("minPrice") || 0);
  const maxPrice = Number(url.searchParams.get("maxPrice") || 100000);
  const starRating = Number(url.searchParams.get("starRating") || 0);
  const minRating = Number(url.searchParams.get("minRating") || 0);
  const amenitiesParam = (url.searchParams.get("amenities") || "").trim();
  const cancellationPolicy = (url.searchParams.get("cancellationPolicy") || "").trim();
  const verifiedOnly = url.searchParams.get("verified") === "true";
  const instantBookOnly = url.searchParams.get("instantBook") === "true";
  const checkIn = (url.searchParams.get("checkIn") || "").trim();
  const checkOut = (url.searchParams.get("checkOut") || "").trim();
  const adults = Math.max(1, Number(url.searchParams.get("adults") || 2));
  const children = Math.max(0, Number(url.searchParams.get("children") || 0));
  const rooms = Math.max(1, Number(url.searchParams.get("rooms") || 1));
  const userLat = url.searchParams.get("lat") ? Number(url.searchParams.get("lat")) : null;
  const userLng = url.searchParams.get("lng") ? Number(url.searchParams.get("lng")) : null;
  const radiusKm = Math.max(0, Number(url.searchParams.get("radiusKm") || 0));
  const sort = url.searchParams.get("sort") || "recommended";
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const limit = Math.min(60, Math.max(1, Number(url.searchParams.get("limit") || 24)));

  const db = getDb();
  const conditions: string[] = ["p.status = 'active'"];
  const params: (string | number)[] = [];

  if (q) {
    conditions.push(
      "(LOWER(p.title) LIKE ? OR LOWER(p.title_fr) LIKE ? OR LOWER(p.title_ar) LIKE ? OR LOWER(p.city) LIKE ? OR LOWER(p.city) = LOWER(?) OR LOWER(p.description) LIKE ? OR LOWER(p.amenities_json) LIKE ?)"
    );
    const pat = `%${q}%`;
    params.push(pat, pat, pat, pat, qCityResolved, pat, pat);
  }
  if (city) {
    conditions.push("LOWER(p.city) = LOWER(?)");
    params.push(city);
  }
  if (region) {
    conditions.push("LOWER(p.region) = LOWER(?)");
    params.push(region);
  }
  if (type && type !== "all") {
    conditions.push("p.marketplace_type = ?");
    params.push(type);
  }
  if (category && category !== "all") {
    if (category === "riad") {
      conditions.push("p.category IN ('riad', 'guesthouse')");
    } else {
      conditions.push("p.category = ?");
      params.push(category);
    }
  }
  if (minPrice > 0) {
    conditions.push("p.base_price_mad >= ?");
    params.push(minPrice);
  }
  if (maxPrice > 0 && maxPrice < 100000) {
    conditions.push("p.base_price_mad <= ?");
    params.push(maxPrice);
  }
  if (starRating > 0) {
    conditions.push("p.star_rating >= ?");
    params.push(starRating);
  }
  if (minRating > 0) {
    conditions.push("p.rating_avg >= ?");
    params.push(minRating);
  }
  if (cancellationPolicy) {
    conditions.push("p.cancellation_policy = ?");
    params.push(cancellationPolicy);
  }
  if (verifiedOnly) {
    conditions.push("p.verified = 1");
  }
  if (instantBookOnly) {
    conditions.push("p.instant_book = 1");
  }

  let orderBy = "p.featured DESC, p.sponsored DESC, p.rating_avg DESC, p.id ASC";
  if (sort === "price_asc") orderBy = "p.base_price_mad ASC, p.rating_avg DESC";
  else if (sort === "price_desc") orderBy = "p.base_price_mad DESC, p.rating_avg DESC";
  else if (sort === "rating") orderBy = "p.rating_avg DESC, p.review_count DESC";
  else if (sort === "popular") orderBy = "p.review_count DESC, p.featured DESC";

  const rows = db
    .prepare(
      `SELECT p.*, pa.business_name AS partner_name, pa.verification_status AS partner_verified
       FROM properties p
       JOIN partners pa ON pa.id = p.partner_id
       WHERE ${conditions.join(" AND ")}
       ORDER BY ${orderBy}`
    )
    .all(...params) as Array<Record<string, unknown>>;

  const requiredAmenities = amenitiesParam
    ? amenitiesParam.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
    : [];

  const nights = checkIn && checkOut ? enumerateNights(checkIn, checkOut) : [];

  let filtered = rows.filter((prop) => {
    if (requiredAmenities.length > 0) {
      const amText = String(prop.amenities_json || "").toLowerCase();
      for (const reqAm of requiredAmenities) {
        if (!amText.includes(reqAm)) return false;
      }
    }

    const propRooms = db
      .prepare(`SELECT * FROM room_types WHERE property_id = ? AND status = 'active'`)
      .all(prop.id as number) as Array<{
      id: number;
      max_adults: number;
      max_children: number;
      extra_beds: number;
      total_units: number;
    }>;

    const totalGuestNeeds = adults + children;
    const capableRooms = propRooms.filter(
      (r) => (r.max_adults + r.max_children + r.extra_beds) * rooms >= totalGuestNeeds
    );
    if (capableRooms.length === 0) return false;

    if (nights.length > 0) {
      const hasAvailableRoom = capableRooms.some((room) => {
        const overrides = db
          .prepare(`SELECT date, available_units, is_blackout, min_stay FROM availability_overrides WHERE room_type_id = ? AND date >= ? AND date < ?`)
          .all(room.id, checkIn, checkOut) as Array<{
          date: string;
          available_units: number | null;
          is_blackout: number;
          min_stay: number;
        }>;
        const ovMap = new Map(overrides.map((o) => [o.date, o]));
        const bookings = db
          .prepare(
            `SELECT check_in, check_out, units_booked FROM bookings
             WHERE room_type_id = ? AND check_in < ? AND check_out > ?
               AND (status IN ('confirmed','pending','completed') OR (status = 'pending_payment' AND datetime(hold_expires_at) > datetime('now')))`
          )
          .all(room.id, checkOut, checkIn) as Array<{ check_in: string; check_out: string; units_booked: number }>;

        for (const d of nights) {
          const ov = ovMap.get(d);
          if (ov?.is_blackout) return false;
          if (ov && nights.length < ov.min_stay) return false;
          const cap = ov && ov.available_units !== null ? ov.available_units : room.total_units;
          const booked = bookings
            .filter((b) => b.check_in <= d && b.check_out > d)
            .reduce((s, b) => s + b.units_booked, 0);
          if (cap - booked < rooms) return false;
        }
        return true;
      });
      if (!hasAvailableRoom) return false;
    }

    return true;
  });

  let nearestCityMeta: { name: string; distanceKm: number } | null = null;
  if (userLat !== null && userLng !== null && !Number.isNaN(userLat) && !Number.isNaN(userLng)) {
    const nearest = findNearestMoroccanCity(userLat, userLng);
    nearestCityMeta = { name: nearest.city.name, distanceKm: nearest.distanceKm };
    filtered = filtered.map((prop) => ({
      ...prop,
      distance_km: haversineKm(userLat, userLng, Number(prop.latitude), Number(prop.longitude)),
    }));
    if (radiusKm > 0) {
      filtered = filtered.filter((prop) => Number((prop as { distance_km?: number }).distance_km ?? 99999) <= radiusKm);
    }
    if (sort === "nearest") {
      filtered.sort((a, b) => Number((a as { distance_km?: number }).distance_km ?? 99999) - Number((b as { distance_km?: number }).distance_km ?? 99999));
    }
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  return NextResponse.json({
    items: paginated,
    pagination: { page, limit, total, totalPages },
    nearestCity: nearestCityMeta,
    filtersApplied: { q, city, region, type, category, minPrice, maxPrice, starRating, radiusKm, sort, checkIn, checkOut },
  });
}
