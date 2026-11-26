import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { getCurrentUser, isAdminRole, logAudit } from "@/lib/auth";
import { checkRateLimit, getClientIp, sanitizePhone, sanitizeString } from "@/lib/security";
import { estimatePrivateTransferMad, pruneUnavailableOffers } from "@/lib/transport-offers";

const TransportSchema = z.object({
  mode: z.enum(["intercity", "intracity"]).default("intercity"),
  carrierType: z.enum(["train_oncf", "bus_ctm", "supratours", "bus_regional", "taxi_transfer"]).default("train_oncf"),
  originCity: z.string().min(2).max(80),
  destinationCity: z.string().min(2).max(80),
  travelDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  passengers: z.number().int().min(1).max(9).default(1),
  contactPhone: z.string().min(4).max(40),
  selectedScheduleFareMad: z.number().int().min(20).max(50000).optional(),
  selectedDeparture: z.string().max(80).optional(),
  seatClass: z.enum(["standard", "comfort", "vip"]).optional(),
  offerCode: z.string().max(80).optional(),
  paymentMethod: z.string().max(60).optional(),
  seatPreference: z.string().max(60).optional(),
  passengerName: z.string().max(120).optional(),
  promoCode: z.string().max(40).optional(),
  requestKind: z.enum(["booking", "route_request"]).optional(),
});

export async function GET() {
  ensureSeeded();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ requests: [] });
  const db = getDb();
  const rows = isAdminRole(user.role)
    ? db.prepare(`SELECT * FROM transport_requests ORDER BY created_at DESC LIMIT 100`).all()
    : db.prepare(`SELECT * FROM transport_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`).all(user.id);
  return NextResponse.json({ requests: rows });
}

export async function POST(req: Request) {
  ensureSeeded();
  const ip = getClientIp(req);
  if (!checkRateLimit(`transport:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many transport requests. Please wait a minute." }, { status: 429 });
  }
  const user = await getCurrentUser();
  const body = await req.json();
  const parsed = TransportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please provide valid cities, date, and phone number." }, { status: 400 });
  }

  if (parsed.data.mode === "intercity" && parsed.data.originCity.toLowerCase() === parsed.data.destinationCity.toLowerCase()) {
    return NextResponse.json({ error: "Origin and destination cities must differ for inter-city routes." }, { status: 400 });
  }

  const db = getDb();
  pruneUnavailableOffers(db);

  let verifiedFareMad = parsed.data.selectedScheduleFareMad;
  let verifiedCarrierBrand = parsed.data.selectedDeparture || "";

  // If booking against a catalog offer, verify it is still active and has seats
  if (parsed.data.offerCode && !parsed.data.offerCode.startsWith("TRANSFER-")) {
    const offer = db
      .prepare(`SELECT * FROM transport_offers WHERE offer_code = ?`)
      .get(parsed.data.offerCode) as
      | { id: number; status: string; seats_left: number; fare_mad: number; carrier_brand: string; dep_time: string }
      | undefined;

    if (!offer || offer.status !== "active" || offer.seats_left < parsed.data.passengers) {
      if (offer && offer.seats_left <= 0) {
        db.prepare(`UPDATE transport_offers SET status = 'sold_out' WHERE id = ?`).run(offer.id);
      }
      return NextResponse.json(
        { error: "This carrier offer is sold out or no longer available and has been removed from live offers." },
        { status: 409 }
      );
    }

    const mult = parsed.data.seatClass === "comfort" ? 1.35 : parsed.data.seatClass === "vip" ? 1.75 : 1;
    verifiedFareMad = Math.round(offer.fare_mad * mult) * parsed.data.passengers;
    verifiedCarrierBrand = `${offer.carrier_brand} ${offer.dep_time}`;
  }

  const baseIndicativeMad =
    verifiedFareMad ||
    (parsed.data.mode === "intracity"
      ? 150 * Math.ceil(parsed.data.passengers / 4)
      : estimatePrivateTransferMad(parsed.data.originCity, parsed.data.destinationCity) *
        Math.ceil(parsed.data.passengers / 4));

  const cleanPromo = (parsed.data.promoCode || "").trim().toUpperCase();
  const discountRate = cleanPromo === "SAHARA15" ? 0.15 : cleanPromo === "MARHABA10" ? 0.1 : 0;
  const serviceFeeMad = parsed.data.requestKind === "route_request" ? 0 : 5;
  const indicativeMad = Math.max(20, Math.round(baseIndicativeMad * (1 - discountRate)) + serviceFeeMad);

  // transport_requests schema CHECK accepts ('train_oncf','bus_ctm','supratours','taxi_transfer')
  const dbCarrierType =
    parsed.data.carrierType === "bus_regional" ? "bus_ctm" : parsed.data.carrierType;

  const ref = `TRN-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

  const notesSummary = [
    verifiedCarrierBrand,
    parsed.data.passengerName ? `Pax: ${sanitizeString(parsed.data.passengerName, 60)}` : "",
    parsed.data.seatPreference ? `Seat: ${sanitizeString(parsed.data.seatPreference, 30)}` : "",
    parsed.data.paymentMethod ? `Pay: ${sanitizeString(parsed.data.paymentMethod, 30)}` : "",
    parsed.data.requestKind === "route_request" ? "Priority route request" : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const res = db
    .prepare(
      `INSERT INTO transport_requests (
        request_ref, user_id, mode, carrier_type, origin_city, destination_city,
        travel_date, passengers, indicative_price_mad, contact_phone, admin_notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_quote')`
    )
    .run(
      ref,
      user?.id ?? null,
      parsed.data.mode,
      dbCarrierType,
      sanitizeString(parsed.data.originCity, 80),
      sanitizeString(parsed.data.destinationCity, 80),
      parsed.data.travelDate,
      parsed.data.passengers,
      indicativeMad,
      sanitizePhone(parsed.data.contactPhone, 40),
      notesSummary ? sanitizeString(notesSummary, 220) : ""
    );

  logAudit(user?.id ?? null, "service.transport_requested", "transport_request", Number(res.lastInsertRowid), {
    ref,
    offerCode: parsed.data.offerCode || null,
    selectedDeparture: verifiedCarrierBrand || null,
    seatClass: parsed.data.seatClass || "standard",
  });

  return NextResponse.json(
    {
      id: Number(res.lastInsertRowid),
      requestRef: ref,
      indicativePriceMad: indicativeMad,
      status: "pending_quote",
      note: "Verified offer reservation request logged. Final ticket confirmation is issued against active carrier inventory.",
    },
    { status: 201 }
  );
}
