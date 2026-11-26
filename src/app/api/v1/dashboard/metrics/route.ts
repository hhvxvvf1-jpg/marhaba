import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function authorized(request: NextRequest): boolean {
  const expected = process.env.MARHABA_DASHBOARD_API_KEY;
  const supplied = request.headers.get("x-marhaba-dashboard-key");
  if (!expected || !supplied) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  if (!process.env.MARHABA_DASHBOARD_API_KEY) {
    return NextResponse.json({ error: "Dashboard API is not configured" }, { status: 503 });
  }
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    const count = (sql: string) => Number((db.prepare(sql).get() as { total: number }).total || 0);
    const metrics = {
      users: count("SELECT COUNT(*) AS total FROM users"),
      partners: count("SELECT COUNT(*) AS total FROM partners"),
      verifiedPartners: count("SELECT COUNT(*) AS total FROM partners WHERE verification_status = 'verified'"),
      properties: count("SELECT COUNT(*) AS total FROM properties"),
      activeProperties: count("SELECT COUNT(*) AS total FROM properties WHERE status = 'active'"),
      pendingProperties: count("SELECT COUNT(*) AS total FROM properties WHERE status = 'pending_approval'"),
      bookings: count("SELECT COUNT(*) AS total FROM bookings"),
      confirmedBookings: count("SELECT COUNT(*) AS total FROM bookings WHERE status IN ('confirmed','completed')"),
      pendingBookings: count("SELECT COUNT(*) AS total FROM bookings WHERE status IN ('pending','pending_payment')"),
      supportTickets: count("SELECT COUNT(*) AS total FROM support_tickets"),
      openSupportTickets: count("SELECT COUNT(*) AS total FROM support_tickets WHERE status NOT IN ('resolved','closed')"),
      newsletterSubscribers: count("SELECT COUNT(*) AS total FROM newsletter_subscribers"),
    };

    const finance = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN status IN ('confirmed','completed') THEN total_mad ELSE 0 END), 0) AS gmvMad,
        COALESCE(SUM(CASE WHEN status IN ('confirmed','completed') THEN commission_mad ELSE 0 END), 0) AS commissionMad
      FROM bookings
    `).get();

    const bookingsByStatus = db.prepare(`
      SELECT status, COUNT(*) AS total
      FROM bookings
      GROUP BY status
      ORDER BY total DESC
    `).all();

    const recentAudit = db.prepare(`
      SELECT a.id, a.action, a.entity_type AS entityType, a.entity_id AS entityId,
             a.created_at AS createdAt, u.email AS actorEmail
      FROM audit_logs a
      LEFT JOIN users u ON u.id = a.actor_user_id
      ORDER BY a.id DESC
      LIMIT 15
    `).all();

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      metrics,
      finance,
      bookingsByStatus,
      recentAudit,
    }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch {
    return NextResponse.json({ error: "Unable to read dashboard metrics" }, { status: 500 });
  }
}
