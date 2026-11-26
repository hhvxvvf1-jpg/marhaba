import { NextResponse } from "next/server";
import crypto from "crypto";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  ensureSeeded();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const affiliate = db.prepare(`SELECT * FROM affiliates WHERE user_id = ?`).get(user.id);
  return NextResponse.json({ affiliate: affiliate || null });
}

export async function POST() {
  ensureSeeded();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const existing = db.prepare(`SELECT * FROM affiliates WHERE user_id = ?`).get(user.id);
  if (existing) return NextResponse.json({ affiliate: existing });

  const code = `AF-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const res = db
    .prepare(`INSERT INTO affiliates (user_id, code, commission_pct, status) VALUES (?, ?, 5, 'approved')`)
    .run(user.id, code);
  const affiliate = db.prepare(`SELECT * FROM affiliates WHERE id = ?`).get(Number(res.lastInsertRowid));
  return NextResponse.json({ affiliate }, { status: 201 });
}
