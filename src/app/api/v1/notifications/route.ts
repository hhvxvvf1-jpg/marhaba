import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  ensureSeeded();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ notifications: [] });
  const db = getDb();
  const notifications = db
    .prepare(`SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30`)
    .all(user.id);
  return NextResponse.json({ notifications });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const db = getDb();
  if (body.id) {
    db.prepare(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`).run(Number(body.id), user.id);
  } else {
    db.prepare(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`).run(user.id);
  }
  return NextResponse.json({ ok: true });
}
