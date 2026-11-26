import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { getCurrentUser } from "@/lib/auth";
import { sanitizeString } from "@/lib/security";

const TicketSchema = z.object({
  bookingId: z.number().int().positive().optional(),
  category: z.string().max(40).default("general"),
  subject: z.string().min(4).max(150),
  description: z.string().min(10).max(2000),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional().default("normal"),
});

export async function GET() {
  ensureSeeded();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const tickets = db
    .prepare(`SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC`)
    .all(user.id);
  return NextResponse.json({ tickets });
}

export async function POST(req: Request) {
  ensureSeeded();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = TicketSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid ticket details" }, { status: 400 });

  const db = getDb();
  const res = db
    .prepare(
      `INSERT INTO support_tickets (user_id, booking_id, category, subject, description, priority, status)
       VALUES (?, ?, ?, ?, ?, ?, 'open')`
    )
    .run(
      user.id,
      parsed.data.bookingId || null,
      sanitizeString(parsed.data.category, 40),
      sanitizeString(parsed.data.subject, 150),
      sanitizeString(parsed.data.description, 2000),
      parsed.data.priority
    );
  return NextResponse.json({ id: Number(res.lastInsertRowid), ok: true }, { status: 201 });
}
