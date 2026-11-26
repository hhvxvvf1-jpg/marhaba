import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { getCurrentUser, hasPermission, isAdminRole, logAudit } from "@/lib/auth";

export async function GET() {
  ensureSeeded();
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const db = getDb();
  const cmsBlocks = db.prepare(`SELECT * FROM cms_blocks ORDER BY key ASC`).all();
  const tickets = db
    .prepare(
      `SELECT st.*, u.email AS user_email, u.full_name AS user_name
       FROM support_tickets st
       LEFT JOIN users u ON u.id = st.user_id
       ORDER BY st.created_at DESC`
    )
    .all();
  const settings = db.prepare(`SELECT * FROM system_settings`).all();
  const reviews = db
    .prepare(
      `SELECT r.*, p.title AS property_title, u.full_name AS author_name
       FROM reviews r
       JOIN properties p ON p.id = r.property_id
       JOIN users u ON u.id = r.user_id
       ORDER BY r.created_at DESC`
    )
    .all();

  return NextResponse.json({ cmsBlocks, tickets, settings, reviews });
}

export async function PATCH(req: Request) {
  ensureSeeded();
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const db = getDb();

  if (body.type === "cms_block" && hasPermission(user.role, "admin:cms")) {
    db.prepare(
      `UPDATE cms_blocks SET title = ?, title_fr = ?, title_ar = ?, content_json = ?, is_active = ?, updated_at = datetime('now') WHERE key = ?`
    ).run(
      body.title,
      body.titleFr || body.title,
      body.titleAr || body.title,
      typeof body.contentJson === "string" ? body.contentJson : JSON.stringify(body.contentJson || {}),
      body.isActive ? 1 : 0,
      body.key
    );
    logAudit(user.id, "admin.cms_updated", "cms_block", body.key, {});
    return NextResponse.json({ ok: true });
  }

  if (body.type === "support_ticket" && hasPermission(user.role, "admin:support")) {
    db.prepare(
      `UPDATE support_tickets SET status = ?, admin_notes = COALESCE(?, admin_notes), assigned_to_user_id = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(body.status, body.adminNotes ?? null, user.id, Number(body.ticketId));
    logAudit(user.id, "admin.ticket_updated", "support_ticket", body.ticketId, { status: body.status });
    return NextResponse.json({ ok: true });
  }

  if (body.type === "system_setting" && hasPermission(user.role, "admin:settings")) {
    db.prepare(`INSERT OR REPLACE INTO system_settings (key, value_json, updated_at) VALUES (?, ?, datetime('now'))`).run(
      body.key,
      JSON.stringify(body.value)
    );
    logAudit(user.id, "admin.setting_updated", "system_settings", body.key, { value: body.value });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Forbidden or invalid update type" }, { status: 400 });
}
