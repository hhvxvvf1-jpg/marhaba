import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { getCurrentUser, isAdminRole, logAudit } from "@/lib/auth";
import { computeRouteDistanceKm } from "@/lib/transport-engine";
import { sanitizeString } from "@/lib/security";

const NewOfferSchema = z.object({
  carrierType: z.enum(["train_oncf", "bus_ctm", "supratours", "bus_regional", "taxi_transfer"]).default("bus_ctm"),
  carrierBrand: z.string().min(2).max(60),
  lineName: z.string().min(2).max(80).default("Direct Service"),
  originCity: z.string().min(2).max(60),
  destinationCity: z.string().min(2).max(60),
  originStation: z.string().min(2).max(80),
  destinationStation: z.string().min(2).max(80),
  depTime: z.string().regex(/^\d{2}:\d{2}$/),
  arrTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationMins: z.number().int().min(15).max(2000),
  fareMad: z.number().min(10).max(20000),
  seatsLeft: z.number().int().min(1).max(200).default(20),
  validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default("2027-12-31"),
});

export async function GET() {
  ensureSeeded();
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const db = getDb();
  const flights = db.prepare(`SELECT * FROM flight_requests ORDER BY created_at DESC LIMIT 100`).all();
  const transport = db.prepare(`SELECT * FROM transport_requests ORDER BY created_at DESC LIMIT 100`).all();
  const esims = db.prepare(`SELECT * FROM esim_requests ORDER BY created_at DESC LIMIT 100`).all();
  const itineraries = db.prepare(`SELECT * FROM itineraries ORDER BY created_at DESC LIMIT 50`).all();
  const transportOffers = db.prepare(`SELECT * FROM transport_offers ORDER BY origin_city, dep_time LIMIT 200`).all();

  return NextResponse.json({ flights, transport, esims, itineraries, transportOffers });
}

export async function PATCH(req: Request) {
  ensureSeeded();
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const body = await req.json();
  const db = getDb();
  const id = Number(body.id);

  if (body.type === "flight") {
    db.prepare(
      `UPDATE flight_requests SET status = ?, quoted_price_mad = COALESCE(?, quoted_price_mad), admin_notes = COALESCE(?, admin_notes), updated_at = datetime('now') WHERE id = ?`
    ).run(body.status, body.quotedPriceMad ?? null, body.adminNotes ?? null, id);
    logAudit(user.id, "admin.flight_updated", "flight_request", id, body);
    return NextResponse.json({ ok: true });
  }

  if (body.type === "transport") {
    db.prepare(
      `UPDATE transport_requests SET status = ?, indicative_price_mad = COALESCE(?, indicative_price_mad), admin_notes = COALESCE(?, admin_notes), updated_at = datetime('now') WHERE id = ?`
    ).run(body.status, body.indicativePriceMad ?? null, body.adminNotes ?? null, id);
    logAudit(user.id, "admin.transport_updated", "transport_request", id, body);
    return NextResponse.json({ ok: true });
  }

  if (body.type === "esim") {
    db.prepare(
      `UPDATE esim_requests SET status = ?, qr_payload = COALESCE(?, qr_payload), updated_at = datetime('now') WHERE id = ?`
    ).run(body.status, body.qrPayload ?? null, id);
    logAudit(user.id, "admin.esim_updated", "esim_request", id, body);
    return NextResponse.json({ ok: true });
  }

  if (body.type === "transport_offer") {
    if (body.status === "removed") {
      db.prepare(`DELETE FROM transport_offers WHERE id = ?`).run(id);
    } else {
      db.prepare(
        `UPDATE transport_offers SET status = ?, seats_left = COALESCE(?, seats_left), fare_mad = COALESCE(?, fare_mad), last_checked_at = datetime('now') WHERE id = ?`
      ).run(body.status, body.seatsLeft ?? null, body.fareMad ?? null, id);
    }
    logAudit(user.id, "admin.transport_offer_updated", "transport_offer", id, body);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown service type" }, { status: 400 });
}

export async function POST(req: Request) {
  ensureSeeded();
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = NewOfferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid transport offer details" }, { status: 400 });
  }

  const d = parsed.data;
  const db = getDb();
  const code = `MRH-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const distanceKm = computeRouteDistanceKm(d.originCity, d.destinationCity);

  const res = db
    .prepare(
      `INSERT INTO transport_offers (
        offer_code, mode, carrier_type, carrier_brand, line_name,
        origin_city, destination_city, origin_station, destination_station,
        dep_time, arr_time, duration_mins, distance_km, fare_mad, stops,
        amenities_json, seats_left, is_high_speed, source_portal, source_url,
        status, valid_until
      ) VALUES (?, 'intercity', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 0, 'marhaba.ma', '/services?tab=transport', 'active', ?)`
    )
    .run(
      code,
      d.carrierType,
      sanitizeString(d.carrierBrand, 60),
      sanitizeString(d.lineName, 80),
      sanitizeString(d.originCity, 60),
      sanitizeString(d.destinationCity, 60),
      sanitizeString(d.originStation, 80),
      sanitizeString(d.destinationStation, 80),
      d.depTime,
      d.arrTime,
      d.durationMins,
      distanceKm,
      d.fareMad,
      JSON.stringify(["A/C", "Wi-Fi", "Verified MARHABA"]),
      d.seatsLeft,
      d.validUntil
    );

  logAudit(user.id, "admin.transport_offer_created", "transport_offer", Number(res.lastInsertRowid), { code });
  return NextResponse.json({ id: Number(res.lastInsertRowid), offerCode: code }, { status: 201 });
}
