import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { getCurrentUser, hasPermission, logAudit } from "@/lib/auth";

export async function GET(req: Request) {
  ensureSeeded();
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "admin:users")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const role = url.searchParams.get("role") || "";

  const db = getDb();
  const where: string[] = ["1=1"];
  const params: string[] = [];
  if (q) {
    where.push("(LOWER(email) LIKE ? OR LOWER(full_name) LIKE ?)");
    params.push(`%${q}%`, `%${q}%`);
  }
  if (role) {
    where.push("role = ?");
    params.push(role);
  }

  const users = db
    .prepare(
      `SELECT id, email, full_name, phone, role, status, email_verified, loyalty_points, referral_code, created_at
       FROM users WHERE ${where.join(" AND ")} ORDER BY created_at DESC`
    )
    .all(...params);

  const partners = db
    .prepare(
      `SELECT pa.*, u.email, u.full_name
       FROM partners pa JOIN users u ON u.id = pa.user_id
       ORDER BY pa.created_at DESC`
    )
    .all();

  return NextResponse.json({ users, partners });
}

export async function PATCH(req: Request) {
  ensureSeeded();
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "admin:users")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const db = getDb();

  if (body.partnerId && body.verificationStatus) {
    db.prepare(`UPDATE partners SET verification_status = ?, updated_at = datetime('now') WHERE id = ?`).run(
      body.verificationStatus,
      Number(body.partnerId)
    );
    logAudit(user.id, "admin.partner_verification", "partner", body.partnerId, {
      verificationStatus: body.verificationStatus,
    });
    return NextResponse.json({ ok: true });
  }

  const targetId = Number(body.userId);
  if (!targetId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  if (body.status) {
    db.prepare(`UPDATE users SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(body.status, targetId);
  }
  if (body.role && user.role === "super_admin") {
    db.prepare(`UPDATE users SET role = ?, updated_at = datetime('now') WHERE id = ?`).run(body.role, targetId);
  }
  if (body.emailVerified !== undefined) {
    db.prepare(`UPDATE users SET email_verified = ?, updated_at = datetime('now') WHERE id = ?`).run(
      body.emailVerified ? 1 : 0,
      targetId
    );
  }

  logAudit(user.id, "admin.user_updated", "user", targetId, body);
  return NextResponse.json({ ok: true });
}
