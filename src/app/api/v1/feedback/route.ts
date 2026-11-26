import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { getCurrentUser, isAdminRole, logAudit } from "@/lib/auth";
import { checkRateLimit, sanitizeString } from "@/lib/security";

const FeedbackSchema = z.object({
  category: z.enum(["bug", "design", "confusing", "missing", "slow", "booking", "language", "suggestion"]),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  pageUrl: z.string().max(240).optional().default(""),
  locale: z.string().max(10).optional().default("en"),
  description: z.string().min(10).max(2000),
});

export async function GET() {
  ensureSeeded();
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const db = getDb();
  const items = db
    .prepare(
      `SELECT bf.*, u.email AS user_email
       FROM beta_feedback bf
       LEFT JOIN users u ON u.id = bf.user_id
       ORDER BY bf.created_at DESC LIMIT 200`
    )
    .all();
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  ensureSeeded();
  const ip = req.headers.get("x-forwarded-for") || "local";
  if (!checkRateLimit(`feedback:${ip}`, 15, 60_000)) {
    return NextResponse.json({ error: "Too many feedback submissions. Please wait a minute." }, { status: 429 });
  }

  const user = await getCurrentUser();
  const body = await req.json();
  const parsed = FeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please provide a valid category and at least 10 characters describing your feedback." }, { status: 400 });
  }

  const db = getDb();
  const ref = `FDB-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

  const res = db
    .prepare(
      `INSERT INTO beta_feedback (feedback_ref, user_id, category, severity, page_url, locale, description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'open')`
    )
    .run(
      ref,
      user?.id ?? null,
      parsed.data.category,
      parsed.data.severity,
      sanitizeString(parsed.data.pageUrl, 240),
      sanitizeString(parsed.data.locale, 10),
      sanitizeString(parsed.data.description, 2000)
    );

  logAudit(user?.id ?? null, "beta.feedback_submitted", "beta_feedback", Number(res.lastInsertRowid), {
    ref,
    category: parsed.data.category,
    severity: parsed.data.severity,
  });

  return NextResponse.json(
    {
      id: Number(res.lastInsertRowid),
      feedbackRef: ref,
      status: "open",
      message: "Thank you! Your public beta feedback has been recorded for our engineering team.",
    },
    { status: 201 }
  );
}

export async function PATCH(req: Request) {
  ensureSeeded();
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const body = await req.json();
  const id = Number(body.id);
  const status = String(body.status || "triaged");
  if (!["open", "triaged", "resolved", "wont_fix"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const db = getDb();
  db.prepare(`UPDATE beta_feedback SET status = ?, admin_notes = COALESCE(?, admin_notes) WHERE id = ?`).run(
    status,
    body.adminNotes ? sanitizeString(String(body.adminNotes), 500) : null,
    id
  );
  logAudit(user.id, "admin.feedback_updated", "beta_feedback", id, { status });
  return NextResponse.json({ ok: true });
}
