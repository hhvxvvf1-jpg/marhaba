import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";

const SubSchema = z.object({
  email: z.string().email(),
  language: z.enum(["en", "fr", "ar"]).optional().default("fr"),
});

export async function POST(req: Request) {
  ensureSeeded();
  const body = await req.json();
  const parsed = SubSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }
  const db = getDb();
  db.prepare(
    `INSERT INTO newsletter_subscribers (email, language, status)
     VALUES (?, ?, 'subscribed')
     ON CONFLICT(email) DO UPDATE SET language = excluded.language, status = 'subscribed'`
  ).run(parsed.data.email.trim().toLowerCase(), parsed.data.language);
  return NextResponse.json({ ok: true, message: "Subscribed to MARHABA travel updates." });
}
