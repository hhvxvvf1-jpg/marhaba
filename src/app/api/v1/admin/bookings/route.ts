import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { getCurrentUser, hasPermission, logAudit } from "@/lib/auth";
import { cancelAndRefundBookingTransactional } from "@/lib/booking-engine";

export async function GET(req: Request) {
  ensureSeeded();
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "admin:bookings")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "";
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();

  const db = getDb();
  const where: string[] = ["1=1"];
  const params: string[] = [];
  if (status) {
    where.push("b.status = ?");
    params.push(status);
  }
  if (q) {
    where.push("(LOWER(b.booking_ref) LIKE ? OR LOWER(b.guest_name) LIKE ? OR LOWER(b.guest_email) LIKE ?)");
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }

  const bookings = db
    .prepare(
      `SELECT b.*, p.title AS property_title, p.city, rt.name AS room_name, pa.business_name AS partner_name
       FROM bookings b
       JOIN properties p ON p.id = b.property_id
       JOIN room_types rt ON rt.id = b.room_type_id
       JOIN partners pa ON pa.id = b.partner_id
       WHERE ${where.join(" AND ")}
       ORDER BY b.created_at DESC
       LIMIT 100`
    )
    .all(...params);

  return NextResponse.json({ bookings });
}

export async function PATCH(req: Request) {
  ensureSeeded();
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "admin:bookings")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const bookingId = Number(body.bookingId);
  if (!bookingId) return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });

  if (body.action === "cancel_refund") {
    const res = cancelAndRefundBookingTransactional({
      bookingId,
      actorUserId: user.id,
      reason: body.reason || "Admin cancellation & refund",
      forceFullRefund: Boolean(body.forceFullRefund),
    });
    return NextResponse.json(res);
  }

  if (body.status) {
    const db = getDb();
    const cur = db.prepare(`SELECT status FROM bookings WHERE id = ?`).get(bookingId) as { status: string } | undefined;
    if (!cur) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    db.prepare(`UPDATE bookings SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(body.status, bookingId);
    db.prepare(
      `INSERT INTO booking_status_history (booking_id, from_status, to_status, changed_by_user_id, note)
       VALUES (?, ?, ?, ?, ?)`
    ).run(bookingId, cur.status, body.status, user.id, body.note || "Admin status intervention");
    logAudit(user.id, "admin.booking_status", "booking", bookingId, { from: cur.status, to: body.status });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
