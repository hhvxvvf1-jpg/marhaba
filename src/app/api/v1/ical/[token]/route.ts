import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  ensureSeeded();
  const { token } = await params;
  const db = getDb();

  const integration = db
    .prepare(
      `SELECT ci.*, p.title, p.city
       FROM channel_integrations ci
       JOIN properties p ON p.id = ci.property_id
       WHERE ci.ical_export_token = ?`
    )
    .get(token.replace(/\.ics$/, "")) as { property_id: number; title: string; city: string } | undefined;

  if (!integration) {
    return NextResponse.json({ error: "iCal feed not found" }, { status: 404 });
  }

  const bookings = db
    .prepare(
      `SELECT booking_ref, check_in, check_out, status
       FROM bookings
       WHERE property_id = ? AND status IN ('confirmed','pending')`
    )
    .all(integration.property_id) as Array<{ booking_ref: string; check_in: string; check_out: string; status: string }>;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MARHABA OTA//Channel Sync//EN",
    `X-WR-CALNAME:MARHABA - ${integration.title}`,
  ];

  for (const b of bookings) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${b.booking_ref}@marhaba.ma`,
      `DTSTART;VALUE=DATE:${b.check_in.replace(/-/g, "")}`,
      `DTEND;VALUE=DATE:${b.check_out.replace(/-/g, "")}`,
      `SUMMARY:MARHABA Reserved (${b.booking_ref})`,
      "STATUS:CONFIRMED",
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");

  return new NextResponse(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="marhaba-${integration.property_id}.ics"`,
    },
  });
}
