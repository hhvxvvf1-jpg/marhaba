import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { getCurrentUser, isAdminRole, logAudit } from "@/lib/auth";
import { checkRateLimit, getClientIp, sanitizePhone, sanitizeString } from "@/lib/security";

const FlightReqSchema = z.object({
  tripType: z.enum(["one_way", "round_trip"]).default("round_trip"),
  origin: z.string().min(2).max(100),
  destination: z.string().min(2).max(100),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z.string().optional().default(""),
  cabinClass: z.enum(["economy", "business"]).default("economy"),
  adults: z.number().int().min(1).max(9).default(1),
  children: z.number().int().min(0).max(8).default(0),
  extraBaggage: z.boolean().default(false),
  flexibleDates: z.boolean().default(false),
  contactPhone: z.string().min(6).max(40),
  contactEmail: z.string().email().optional().or(z.literal("")),
});

export async function GET() {
  ensureSeeded();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ requests: [] });

  const db = getDb();
  const rows = isAdminRole(user.role)
    ? db.prepare(`SELECT * FROM flight_requests ORDER BY created_at DESC LIMIT 100`).all()
    : db.prepare(`SELECT * FROM flight_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`).all(user.id);

  return NextResponse.json({ requests: rows });
}

export async function POST(req: Request) {
  ensureSeeded();
  const ip = getClientIp(req);
  if (!checkRateLimit(`flights:${ip}`, 15, 60_000)) {
    return NextResponse.json({ error: "Too many flight quote requests. Please wait a minute." }, { status: 429 });
  }
  const user = await getCurrentUser();
  const body = await req.json();
  const parsed = FlightReqSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please provide valid origin, destination, departure date, and contact phone." }, { status: 400 });
  }

  if (parsed.data.tripType === "round_trip" && parsed.data.returnDate && parsed.data.returnDate < parsed.data.departureDate) {
    return NextResponse.json({ error: "Return date must be on or after departure date." }, { status: 400 });
  }

  const db = getDb();
  const ref = `FLT-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

  const res = db
    .prepare(
      `INSERT INTO flight_requests (
        request_ref, user_id, trip_type, origin, destination, departure_date, return_date,
        cabin_class, adults, children, extra_baggage, flexible_dates, contact_phone, contact_email, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_quote')`
    )
    .run(
      ref,
      user?.id ?? null,
      parsed.data.tripType,
      sanitizeString(parsed.data.origin, 100),
      sanitizeString(parsed.data.destination, 100),
      parsed.data.departureDate,
      parsed.data.tripType === "round_trip" ? sanitizeString(parsed.data.returnDate, 20) : "",
      parsed.data.cabinClass,
      parsed.data.adults,
      parsed.data.children,
      parsed.data.extraBaggage ? 1 : 0,
      parsed.data.flexibleDates ? 1 : 0,
      sanitizePhone(parsed.data.contactPhone, 40),
      sanitizeString(parsed.data.contactEmail || user?.email || "", 120)
    );

  // Suggest arriving car rentals in destination city
  const destLower = parsed.data.destination.toLowerCase();
  const arrivalCars = db
    .prepare(
      `SELECT id, slug, title, city, base_price_mad, images_json
       FROM properties
       WHERE status = 'active' AND marketplace_type = 'car' AND LOWER(city) LIKE ?
       ORDER BY base_price_mad ASC LIMIT 3`
    )
    .all(`%${destLower.split(" ")[0]}%`);

  if (user) {
    db.prepare(
      `INSERT INTO notifications (user_id, type, title, body, link_url)
       VALUES (?, 'flight_request', ?, ?, '/services?tab=flights')`
    ).run(
      user.id,
      `Flight fare request ${ref} received`,
      `${parsed.data.origin} → ${parsed.data.destination} (${parsed.data.departureDate}). Status: pending_quote (airline inventory requires advisor/GDS confirmation).`
    );
  }

  logAudit(user?.id ?? null, "service.flight_requested", "flight_request", Number(res.lastInsertRowid), { ref });

  return NextResponse.json(
    {
      id: Number(res.lastInsertRowid),
      requestRef: ref,
      status: "pending_quote",
      note: "Flight request saved. Live airline inventory and ticketing require GDS/airline provider confirmation; an advisor will quote the best fare.",
      arrivalCars,
    },
    { status: 201 }
  );
}
