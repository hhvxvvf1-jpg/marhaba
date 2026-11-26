import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { getCurrentUser } from "@/lib/auth";
import { confirmBookingPaymentTransactional } from "@/lib/booking-engine";
import { getPaymentProviderStatus } from "@/lib/config";

const PaySchema = z.object({
  provider: z.enum(["sandbox_card", "stripe", "paypal", "cmi", "pay_at_property"]).default("sandbox_card"),
  cardLast4: z.string().max(4).optional(),
  holderName: z.string().max(100).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  ensureSeeded();
  const user = await getCurrentUser();
  const { id } = await params;
  const bookingId = Number(id);
  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parsed = PaySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payment details" }, { status: 400 });
    }

    const db = getDb();
    const booking = db.prepare(`SELECT id, traveler_id, status FROM bookings WHERE id = ?`).get(bookingId) as
      | { id: number; traveler_id: number | null; status: string }
      | undefined;

    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    if (booking.traveler_id && user && booking.traveler_id !== user.id && user.role === "traveler") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const providerStatus = getPaymentProviderStatus();
    const methodSummary =
      parsed.data.provider === "pay_at_property"
        ? "Pay at property upon check-in"
        : `${parsed.data.provider} •••• ${parsed.data.cardLast4 || "4242"}`;

    const res = confirmBookingPaymentTransactional({
      bookingId,
      actorUserId: user?.id ?? null,
      provider: parsed.data.provider,
      methodSummary,
    });

    return NextResponse.json({
      ...res,
      providerMode: providerStatus[parsed.data.provider].mode,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
