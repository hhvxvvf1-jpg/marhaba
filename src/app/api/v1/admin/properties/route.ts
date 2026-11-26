import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { getCurrentUser, hasPermission, logAudit } from "@/lib/auth";

export async function GET() {
  ensureSeeded();
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "admin:properties")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getDb();
  const properties = db
    .prepare(
      `SELECT p.*, pa.business_name AS partner_name
       FROM properties p
       JOIN partners pa ON pa.id = p.partner_id
       ORDER BY (p.status = 'pending_approval') DESC, p.created_at DESC`
    )
    .all();

  return NextResponse.json({ properties });
}

export async function PATCH(req: Request) {
  ensureSeeded();
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "admin:properties")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const propertyId = Number(body.propertyId);
  if (!propertyId) return NextResponse.json({ error: "Missing propertyId" }, { status: 400 });

  const db = getDb();
  db.prepare(
    `UPDATE properties
     SET status = COALESCE(?, status),
         verified = COALESCE(?, verified),
         featured = COALESCE(?, featured),
         sponsored = COALESCE(?, sponsored),
         commission_override_pct = CASE WHEN ? THEN ? ELSE commission_override_pct END,
         updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    body.status ?? null,
    body.verified !== undefined ? (body.verified ? 1 : 0) : null,
    body.featured !== undefined ? (body.featured ? 1 : 0) : null,
    body.sponsored !== undefined ? (body.sponsored ? 1 : 0) : null,
    body.commissionOverridePct !== undefined ? 1 : 0,
    body.commissionOverridePct ?? null,
    propertyId
  );

  logAudit(user.id, "admin.property_updated", "property", propertyId, body);
  return NextResponse.json({ ok: true });
}
