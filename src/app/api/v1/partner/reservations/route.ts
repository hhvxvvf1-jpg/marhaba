import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { logAudit } from "@/lib/auth";
import { cancelAndRefundBookingTransactional } from "@/lib/booking-engine";
import { requirePartnerContext } from "@/lib/partner-helper";

export async function GET() {
  ensureSeeded();
  const ctx = await requirePartnerContext();
  if (ctx.error || !ctx.partner) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const db = getDb();
  const reservations = db
    .prepare(
      `SELECT b.*, p.title AS property_title, rt.name AS room_name
       FROM bookings b
       JOIN properties p ON p.id = b.property_id
       JOIN room_types rt ON rt.id = b.room_type_id
       WHERE b.partner_id = ?
       ORDER BY b.created_at DESC`
    )
    .all(ctx.partner.id);

  return NextResponse.json({ reservations });
}

export async function PATCH(req: Request) {
  ensureSeeded();
  const ctx = await requirePartnerContext();
  if (ctx.error || !ctx.partner || !ctx.user) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const body = await req.json();
  const bookingId = Number(body.bookingId);
  const action = String(body.action || "");

  const db = getDb();
  const booking = db
    .prepare(`SELECT * FROM bookings WHERE id = ? AND partner_id = ?`)
    .get(bookingId, ctx.partner.id) as { id: number; status: string; traveler_id: number | null; booking_ref: string } | undefined;

  if (!booking) return NextResponse.json({ error: "Reservation not found" }, { status: 404 });

  if (action === "cancel" || action === "reject") {
    const res = cancelAndRefundBookingTransactional({
      bookingId,
      actorUserId: ctx.user.id,
      reason: body.note || `Partner ${action}ed reservation`,
      forceFullRefund: true,
    });
    return NextResponse.json(res);
  }

  const statusMap: Record<string, string> = {
    confirm: "confirmed",
    complete: "completed",
    no_show: "no_show",
  };
  const nextStatus = statusMap[action];
  if (!nextStatus) return NextResponse.json({ error: "Unsupported action" }, { status: 400 });

  db.prepare(`UPDATE bookings SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(nextStatus, bookingId);
  db.prepare(
    `INSERT INTO booking_status_history (booking_id, from_status, to_status, changed_by_user_id, note)
     VALUES (?, ?, ?, ?, ?)`
  ).run(bookingId, booking.status, nextStatus, ctx.user.id, body.note || `Partner marked ${nextStatus}`);

  if (booking.traveler_id) {
    db.prepare(
      `INSERT INTO notifications (user_id, type, title, body, link_url)
       VALUES (?, 'booking_update', ?, ?, '/account')`
    ).run(booking.traveler_id, `Booking ${booking.booking_ref} ${nextStatus}`, `Property updated your reservation to ${nextStatus}.`);
  }

  logAudit(ctx.user.id, `partner.booking_${action}`, "booking", bookingId, { nextStatus });
  return NextResponse.json({ ok: true, status: nextStatus });
}
