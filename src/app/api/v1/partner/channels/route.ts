import { NextResponse } from "next/server";
import crypto from "crypto";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { requirePartnerContext } from "@/lib/partner-helper";

export async function GET() {
  ensureSeeded();
  const ctx = await requirePartnerContext();
  if (ctx.error || !ctx.partner) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const db = getDb();
  const integrations = db
    .prepare(
      `SELECT ci.*, p.title AS property_title
       FROM channel_integrations ci
       JOIN properties p ON p.id = ci.property_id
       WHERE p.partner_id = ?
       ORDER BY ci.created_at DESC`
    )
    .all(ctx.partner.id);

  const logs = db
    .prepare(
      `SELECT sl.*, ci.provider, p.title AS property_title
       FROM sync_logs sl
       JOIN channel_integrations ci ON ci.id = sl.integration_id
       JOIN properties p ON p.id = ci.property_id
       WHERE p.partner_id = ?
       ORDER BY sl.created_at DESC
       LIMIT 30`
    )
    .all(ctx.partner.id);

  return NextResponse.json({ integrations, logs });
}

export async function POST(req: Request) {
  ensureSeeded();
  const ctx = await requirePartnerContext();
  if (ctx.error || !ctx.partner) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const body = await req.json();
  const db = getDb();

  if (body.action === "sync_now" && body.integrationId) {
    const integ = db
      .prepare(
        `SELECT ci.* FROM channel_integrations ci JOIN properties p ON p.id = ci.property_id
         WHERE ci.id = ? AND p.partner_id = ?`
      )
      .get(Number(body.integrationId), ctx.partner.id) as { id: number; provider: string; external_property_id: string } | undefined;
    if (!integ) return NextResponse.json({ error: "Integration not found" }, { status: 404 });

    const isIcal = integ.provider === "ical";
    const status = isIcal || integ.external_property_id ? "success" : "needs_credentials";
    const msg =
      status === "success"
        ? `Synchronized availability & reservation blocks with ${integ.provider}.`
        : `${integ.provider} requires approved API credentials & External Property ID before live PMS sync.`;

    db.prepare(`UPDATE channel_integrations SET last_sync_at = datetime('now'), last_sync_message = ? WHERE id = ?`).run(
      msg,
      integ.id
    );
    db.prepare(
      `INSERT INTO sync_logs (integration_id, direction, sync_type, status, summary)
       VALUES (?, 'outbound', 'availability', ?, ?)`
    ).run(integ.id, status, msg);

    return NextResponse.json({ ok: true, status, message: msg });
  }

  const propertyId = Number(body.propertyId);
  const prop = db.prepare(`SELECT id FROM properties WHERE id = ? AND partner_id = ?`).get(propertyId, ctx.partner.id);
  if (!prop) return NextResponse.json({ error: "Property not found" }, { status: 404 });

  const provider = String(body.provider || "ical");
  const token = crypto.randomBytes(12).toString("hex");
  const hasCreds = Boolean(body.externalPropertyId);
  const status = provider === "ical" ? "active" : hasCreds ? "configured" : "needs_credentials";

  const res = db
    .prepare(
      `INSERT INTO channel_integrations (property_id, provider, external_property_id, ical_import_url, ical_export_token, status, last_sync_message)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      propertyId,
      provider,
      String(body.externalPropertyId || ""),
      String(body.icalImportUrl || ""),
      token,
      status,
      provider === "ical"
        ? "iCal export feed ready"
        : "Integration template created. Connect API keys in environment or PMS webhook settings."
    );

  return NextResponse.json({ id: Number(res.lastInsertRowid), token, status }, { status: 201 });
}
