import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { getCurrentUser, isAdminRole } from "@/lib/auth";
import { cancelAndRefundBookingTransactional } from "@/lib/booking-engine";
import { sanitizeString } from "@/lib/security";

const CancelSchema = z.object({
  reason: z.string().min(3).max(400).optional().default("Traveler requested cancellation"),
  forceFullRefund: z.boolean().optional().default(false),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  ensureSeeded();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const bookingId = Number(id);
  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = CancelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid cancellation request" }, { status: 400 });
    }

    const db = getDb();
    const booking = db
      .prepare(
        `SELECT b.id, b.traveler_id, pa.user_id AS partner_user_id
         FROM bookings b JOIN partners pa ON pa.id = b.partner_id
         WHERE b.id = ?`
      )
      .get(bookingId) as { id: number; traveler_id: number | null; partner_user_id: number } | undefined;

    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    const isOwner = booking.traveler_id === user.id || booking.partner_user_id === user.id;
    const isAdmin = isAdminRole(user.role);
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const res = cancelAndRefundBookingTransactional({
      bookingId,
      actorUserId: user.id,
      reason: sanitizeString(parsed.data.reason, 400),
      forceFullRefund: isAdmin ? parsed.data.forceFullRefund : false,
    });

    return NextResponse.json(res);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
