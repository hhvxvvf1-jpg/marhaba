import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb, runInTransaction } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { getCurrentUser, isAdminRole, logAudit } from "@/lib/auth";
import { sanitizeString } from "@/lib/security";

const CreateReviewSchema = z.object({
  bookingId: z.number().int().positive(),
  overallRating: z.number().int().min(1).max(5),
  cleanlinessRating: z.number().int().min(1).max(5).optional().default(5),
  locationRating: z.number().int().min(1).max(5).optional().default(5),
  valueRating: z.number().int().min(1).max(5).optional().default(5),
  serviceRating: z.number().int().min(1).max(5).optional().default(5),
  comment: z.string().min(8).max(1500),
});

export async function POST(req: Request) {
  ensureSeeded();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to submit a verified review." }, { status: 401 });

  const body = await req.json();
  const parsed = CreateReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid review data", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = runInTransaction((db) => {
      const booking = db
        .prepare(`SELECT id, traveler_id, property_id, status FROM bookings WHERE id = ?`)
        .get(parsed.data.bookingId) as
        | { id: number; traveler_id: number | null; property_id: number; status: string }
        | undefined;

      if (!booking) throw new Error("Booking not found.");
      if (booking.traveler_id !== user.id) {
        throw new Error("Only the booking guest can submit a verified review.");
      }
      if (!["completed", "confirmed"].includes(booking.status)) {
        throw new Error("Only confirmed or completed bookings are eligible for verified reviews.");
      }

      const existing = db.prepare(`SELECT id FROM reviews WHERE booking_id = ?`).get(booking.id);
      if (existing) throw new Error("A review has already been submitted for this booking.");

      const res = db
        .prepare(
          `INSERT INTO reviews (
            property_id, booking_id, user_id, overall_rating,
            cleanliness_rating, location_rating, value_rating, service_rating, comment, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')`
        )
        .run(
          booking.property_id,
          booking.id,
          user.id,
          parsed.data.overallRating,
          parsed.data.cleanlinessRating,
          parsed.data.locationRating,
          parsed.data.valueRating,
          parsed.data.serviceRating,
          sanitizeString(parsed.data.comment, 1500)
        );

      const stats = db
        .prepare(
          `SELECT AVG(overall_rating) AS avg_r, COUNT(*) AS cnt
           FROM reviews WHERE property_id = ? AND status = 'published'`
        )
        .get(booking.property_id) as { avg_r: number; cnt: number };

      db.prepare(`UPDATE properties SET rating_avg = ?, review_count = ? WHERE id = ?`).run(
        Math.round((stats.avg_r || 0) * 10) / 10,
        stats.cnt,
        booking.property_id
      );

      logAudit(user.id, "review.created", "review", Number(res.lastInsertRowid), { propertyId: booking.property_id });
      return { reviewId: Number(res.lastInsertRowid) };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  ensureSeeded();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const db = getDb();
  const reviewId = Number(body.reviewId);
  const review = db
    .prepare(
      `SELECT r.*, p.partner_id, pa.user_id AS partner_user_id
       FROM reviews r
       JOIN properties p ON p.id = r.property_id
       JOIN partners pa ON pa.id = p.partner_id
       WHERE r.id = ?`
    )
    .get(reviewId) as { id: number; property_id: number; partner_user_id: number } | undefined;

  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });

  if (body.partnerReply !== undefined) {
    if (review.partner_user_id !== user.id && !isAdminRole(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    db.prepare(`UPDATE reviews SET partner_reply = ?, partner_replied_at = datetime('now') WHERE id = ?`).run(
      sanitizeString(body.partnerReply, 1000),
      reviewId
    );
    return NextResponse.json({ ok: true });
  }

  if (body.status && isAdminRole(user.role)) {
    db.prepare(`UPDATE reviews SET status = ? WHERE id = ?`).run(body.status, reviewId);
    const stats = db
      .prepare(`SELECT AVG(overall_rating) AS avg_r, COUNT(*) AS cnt FROM reviews WHERE property_id = ? AND status = 'published'`)
      .get(review.property_id) as { avg_r: number | null; cnt: number };
    db.prepare(`UPDATE properties SET rating_avg = ?, review_count = ? WHERE id = ?`).run(
      Math.round(((stats.avg_r || 0) * 10)) / 10,
      stats.cnt,
      review.property_id
    );
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
