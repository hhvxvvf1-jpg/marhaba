import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { getCurrentUser, isAdminRole } from "@/lib/auth";
import { getPaymentProviderStatus } from "@/lib/config";

export async function GET() {
  ensureSeeded();
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ error: "Super Admin / Admin access required" }, { status: 403 });
  }

  const db = getDb();

  const metrics = {
    totalUsers: (db.prepare(`SELECT COUNT(*) AS cnt FROM users`).get() as { cnt: number }).cnt,
    totalPartners: (db.prepare(`SELECT COUNT(*) AS cnt FROM partners`).get() as { cnt: number }).cnt,
    verifiedPartners: (db.prepare(`SELECT COUNT(*) AS cnt FROM partners WHERE verification_status = 'verified'`).get() as { cnt: number }).cnt,
    totalProperties: (db.prepare(`SELECT COUNT(*) AS cnt FROM properties`).get() as { cnt: number }).cnt,
    activeProperties: (db.prepare(`SELECT COUNT(*) AS cnt FROM properties WHERE status = 'active'`).get() as { cnt: number }).cnt,
    pendingProperties: (db.prepare(`SELECT COUNT(*) AS cnt FROM properties WHERE status = 'pending_approval'`).get() as { cnt: number }).cnt,
    totalBookings: (db.prepare(`SELECT COUNT(*) AS cnt FROM bookings`).get() as { cnt: number }).cnt,
    confirmedBookings: (db.prepare(`SELECT COUNT(*) AS cnt FROM bookings WHERE status IN ('confirmed','completed')`).get() as { cnt: number }).cnt,
    pendingBookings: (db.prepare(`SELECT COUNT(*) AS cnt FROM bookings WHERE status IN ('pending','pending_payment')`).get() as { cnt: number }).cnt,
    cancelledBookings: (db.prepare(`SELECT COUNT(*) AS cnt FROM bookings WHERE status IN ('cancelled','refunded','partially_refunded')`).get() as { cnt: number }).cnt,
  };

  const financials = db
    .prepare(
      `SELECT
        COALESCE(SUM(CASE WHEN status IN ('confirmed','completed') THEN total_mad ELSE 0 END), 0) AS gmv_mad,
        COALESCE(SUM(CASE WHEN status IN ('confirmed','completed') THEN commission_mad ELSE 0 END), 0) AS commission_revenue_mad,
        COALESCE(SUM(CASE WHEN status IN ('confirmed','completed') THEN service_fee_mad ELSE 0 END), 0) AS service_fee_revenue_mad,
        COALESCE(SUM(CASE WHEN status IN ('confirmed','completed') THEN taxes_mad ELSE 0 END), 0) AS tax_collected_mad
       FROM bookings`
    )
    .get();

  const refundsTotal = (
    db.prepare(`SELECT COALESCE(SUM(amount_mad), 0) AS total FROM refunds WHERE status = 'processed'`).get() as { total: number }
  ).total;

  const pendingPayouts = (
    db.prepare(`SELECT COALESCE(SUM(amount_mad), 0) AS total FROM payouts WHERE status IN ('requested','approved')`).get() as { total: number }
  ).total;

  const geoDistribution = db
    .prepare(
      `SELECT p.city, COUNT(DISTINCT p.id) AS properties, COUNT(b.id) AS bookings,
              COALESCE(SUM(CASE WHEN b.status IN ('confirmed','completed') THEN b.total_mad ELSE 0 END), 0) AS revenue_mad
       FROM properties p
       LEFT JOIN bookings b ON b.property_id = p.id
       GROUP BY p.city
       ORDER BY revenue_mad DESC, properties DESC`
    )
    .all();

  const auditLogs = db
    .prepare(
      `SELECT a.*, u.email AS actor_email
       FROM audit_logs a
       LEFT JOIN users u ON u.id = a.actor_user_id
       ORDER BY a.created_at DESC
       LIMIT 30`
    )
    .all();

  return NextResponse.json({
    metrics,
    financials,
    refundsTotal,
    pendingPayouts,
    geoDistribution,
    auditLogs,
    paymentProviders: getPaymentProviderStatus(),
  });
}
