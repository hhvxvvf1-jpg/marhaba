import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  ensureSeeded();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ items: [] });

  const db = getDb();
  const items = db
    .prepare(
      `SELECT p.*
       FROM wishlists w
       JOIN properties p ON p.id = w.property_id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC`
    )
    .all(user.id);
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  ensureSeeded();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to save favorites." }, { status: 401 });

  const body = await req.json();
  const propertyId = Number(body.propertyId);
  if (!Number.isInteger(propertyId)) return NextResponse.json({ error: "Invalid propertyId" }, { status: 400 });

  const db = getDb();
  const existing = db.prepare(`SELECT 1 FROM wishlists WHERE user_id = ? AND property_id = ?`).get(user.id, propertyId);
  if (existing) {
    db.prepare(`DELETE FROM wishlists WHERE user_id = ? AND property_id = ?`).run(user.id, propertyId);
    return NextResponse.json({ saved: false });
  } else {
    db.prepare(`INSERT INTO wishlists (user_id, property_id) VALUES (?, ?)`).run(user.id, propertyId);
    return NextResponse.json({ saved: true });
  }
}
