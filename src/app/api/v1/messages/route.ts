import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { getCurrentUser, isAdminRole } from "@/lib/auth";
import { sanitizeString } from "@/lib/security";

export async function GET() {
  ensureSeeded();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const partner = db.prepare(`SELECT id FROM partners WHERE user_id = ?`).get(user.id) as { id: number } | undefined;

  let conversations;
  if (isAdminRole(user.role)) {
    conversations = db
      .prepare(
        `SELECT c.*, p.title AS property_title, u.full_name AS traveler_name, pa.business_name AS partner_name
         FROM conversations c
         LEFT JOIN properties p ON p.id = c.property_id
         JOIN users u ON u.id = c.traveler_id
         LEFT JOIN partners pa ON pa.id = c.partner_id
         ORDER BY c.last_message_at DESC`
      )
      .all();
  } else if (partner) {
    conversations = db
      .prepare(
        `SELECT c.*, p.title AS property_title, u.full_name AS traveler_name, pa.business_name AS partner_name
         FROM conversations c
         LEFT JOIN properties p ON p.id = c.property_id
         JOIN users u ON u.id = c.traveler_id
         LEFT JOIN partners pa ON pa.id = c.partner_id
         WHERE c.partner_id = ? OR c.traveler_id = ?
         ORDER BY c.last_message_at DESC`
      )
      .all(partner.id, user.id);
  } else {
    conversations = db
      .prepare(
        `SELECT c.*, p.title AS property_title, u.full_name AS traveler_name, pa.business_name AS partner_name
         FROM conversations c
         LEFT JOIN properties p ON p.id = c.property_id
         JOIN users u ON u.id = c.traveler_id
         LEFT JOIN partners pa ON pa.id = c.partner_id
         WHERE c.traveler_id = ?
         ORDER BY c.last_message_at DESC`
      )
      .all(user.id);
  }

  const enriched = (conversations as Array<Record<string, unknown>>).map((conv) => {
    const msgs = db
      .prepare(
        `SELECT m.*, u.full_name AS sender_name
         FROM messages m
         JOIN users u ON u.id = m.sender_user_id
         WHERE m.conversation_id = ?
         ORDER BY m.created_at ASC`
      )
      .all(conv.id as number);
    return { ...conv, messages: msgs };
  });

  return NextResponse.json({ conversations: enriched });
}

export async function POST(req: Request) {
  ensureSeeded();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const db = getDb();
  const text = sanitizeString(body.body, 2000);
  if (!text) return NextResponse.json({ error: "Message body is required" }, { status: 400 });

  if (body.conversationId) {
    const conv = db.prepare(`SELECT * FROM conversations WHERE id = ?`).get(Number(body.conversationId)) as
      | { id: number; traveler_id: number; partner_id: number | null; subject: string }
      | undefined;
    if (!conv) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

    db.prepare(
      `INSERT INTO messages (conversation_id, sender_user_id, sender_role, body)
       VALUES (?, ?, ?, ?)`
    ).run(conv.id, user.id, user.role, text);

    db.prepare(`UPDATE conversations SET last_message_at = datetime('now') WHERE id = ?`).run(conv.id);

    // Notify recipient
    if (conv.traveler_id !== user.id) {
      db.prepare(`INSERT INTO notifications (user_id, type, title, body, link_url) VALUES (?, 'message', ?, ?, '/account')`).run(
        conv.traveler_id,
        `New message: ${conv.subject}`,
        text.slice(0, 120)
      );
    } else if (conv.partner_id) {
      const pa = db.prepare(`SELECT user_id FROM partners WHERE id = ?`).get(conv.partner_id) as { user_id: number } | undefined;
      if (pa) {
        db.prepare(`INSERT INTO notifications (user_id, type, title, body, link_url) VALUES (?, 'message', ?, ?, '/partner')`).run(
          pa.user_id,
          `Guest message: ${conv.subject}`,
          text.slice(0, 120)
        );
      }
    }

    return NextResponse.json({ ok: true, conversationId: conv.id }, { status: 201 });
  }

  // Create new conversation tied to property or booking
  const propertyId = body.propertyId ? Number(body.propertyId) : null;
  const bookingId = body.bookingId ? Number(body.bookingId) : null;
  let partnerId: number | null = null;
  if (propertyId) {
    const prop = db.prepare(`SELECT partner_id FROM properties WHERE id = ?`).get(propertyId) as { partner_id: number } | undefined;
    if (prop) partnerId = prop.partner_id;
  }

  const subject = sanitizeString(body.subject || "Property Inquiry", 160);
  const res = db
    .prepare(
      `INSERT INTO conversations (booking_id, property_id, traveler_id, partner_id, subject)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(bookingId, propertyId, user.id, partnerId, subject);

  const convId = Number(res.lastInsertRowid);
  db.prepare(
    `INSERT INTO messages (conversation_id, sender_user_id, sender_role, body) VALUES (?, ?, ?, ?)`
  ).run(convId, user.id, user.role, text);

  if (partnerId) {
    const pa = db.prepare(`SELECT user_id FROM partners WHERE id = ?`).get(partnerId) as { user_id: number } | undefined;
    if (pa) {
      db.prepare(`INSERT INTO notifications (user_id, type, title, body, link_url) VALUES (?, 'message', ?, ?, '/partner')`).run(
        pa.user_id,
        `New inquiry: ${subject}`,
        text.slice(0, 120)
      );
    }
  }

  return NextResponse.json({ ok: true, conversationId: convId }, { status: 201 });
}
