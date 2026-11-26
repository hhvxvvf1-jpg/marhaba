import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { getCurrentUser } from "@/lib/auth";
import { createBookingTransactional } from "@/lib/booking-engine";
import { checkRateLimit, getClientIp, sanitizePhone, sanitizeString } from "@/lib/security";

const CreateBookingSchema = z.object({
  propertyId: z.number().int().positive(),
  roomTypeId: z.number().int().positive(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  adults: z.number().int().min(1).max(20).optional().default(2),
  children: z.number().int().min(0).max(20).optional().default(0),
  units: z.number().int().min(1).max(10).optional().default(1),
  promoCode: z.string().max(40).optional(),
  currency: z.enum(["MAD", "EUR", "USD"]).optional().default("MAD"),
  guestName: z.string().min(2).max(120),
  guestEmail: z.string().email(),
  guestPhone: z.string().min(6).max(40),
  specialRequests: z.string().max(500).optional(),
  affiliateCode: z.string().max(40).optional(),
  referralCode: z.string().max(40).optional(),
});

export async function GET() {
  ensureSeeded();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const bookings = db
    .prepare(
      `SELECT b.*, p.title AS property_title, p.slug AS property_slug, p.city, p.images_json, p.cancellation_policy,
              rt.name AS room_name,
              (SELECT COUNT(*) FROM reviews r WHERE r.booking_id = b.id) AS has_review
       FROM bookings b
       JOIN properties p ON p.id = b.property_id
       JOIN room_types rt ON rt.id = b.room_type_id
       WHERE b.traveler_id = ?
       ORDER BY b.created_at DESC`
    )
    .all(user.id);

  return NextResponse.json({ bookings });
}

export async function POST(req: Request) {
  ensureSeeded();
  const ip = getClientIp(req);
  if (!checkRateLimit(`booking:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many booking requests. Please wait a minute." }, { status: 429 });
  }
  const user = await getCurrentUser();
  try {
    const body = await req.json();
    const parsed = CreateBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid booking request", details: parsed.error.flatten() }, { status: 400 });
    }

    const result = createBookingTransactional({
      ...parsed.data,
      travelerId: user?.id ?? null,
      guestName: sanitizeString(parsed.data.guestName, 120),
      guestEmail: parsed.data.guestEmail.trim().toLowerCase(),
      guestPhone: sanitizePhone(parsed.data.guestPhone, 40),
      specialRequests: sanitizeString(parsed.data.specialRequests || "", 500),
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 409 });
  }
}
