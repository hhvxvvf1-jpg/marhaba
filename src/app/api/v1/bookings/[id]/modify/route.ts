import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb, runInTransaction } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { getCurrentUser, isAdminRole, logAudit } from "@/lib/auth";
import { calculateQuote } from "@/lib/booking-engine";

const ModifySchema = z.object({
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  adults: z.number().int().min(1).max(20).optional(),
  children: z.number().int().min(0).max(20).optional(),
  specialRequests: z.string().max(500).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  ensureSeeded();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const bookingId = Number(id);
  const body = await req.json();
  const parsed = ModifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid modification parameters" }, { status: 400 });
  }

  try {
    const result = runInTransaction((db) => {
      const booking = db.prepare(`SELECT * FROM bookings WHERE id = ?`).get(bookingId) as
        | {
            id: number;
            booking_ref: string;
            traveler_id: number | null;
            property_id: number;
            room_type_id: number;
            units_booked: number;
            adults: number;
            children: number;
            status: string;
            promo_code: string;
            currency: "MAD" | "EUR" | "USD";
          }
        | undefined;

      if (!booking) throw new Error("Booking not found");
      if (booking.traveler_id !== user.id && !isAdminRole(user.role)) {
        throw new Error("Forbidden");
      }
      if (!["confirmed", "pending", "pending_payment"].includes(booking.status)) {
        throw new Error("Only active bookings can be modified.");
      }

      // Temporarily mark current booking as 'draft' inside this immediate transaction to check new dates cleanly
      const oldStatus = booking.status;
      db.prepare(`UPDATE bookings SET status = 'draft' WHERE id = ?`).run(booking.id);

      const quote = calculateQuote({
        propertyId: booking.property_id,
        roomTypeId: booking.room_type_id,
        checkIn: parsed.data.checkIn,
        checkOut: parsed.data.checkOut,
        adults: parsed.data.adults ?? booking.adults,
        children: parsed.data.children ?? booking.children,
        units: booking.units_booked,
        promoCode: booking.promo_code || undefined,
        currency: booking.currency,
        travelerId: booking.traveler_id,
        excludeBookingId: booking.id,
      });

      if (quote.duplicateConflict) {
        db.prepare(`UPDATE bookings SET status = ? WHERE id = ?`).run(oldStatus, booking.id);
        throw new Error(
          `Conflict with existing ${quote.duplicateConflict.categoryLabel} reservation ${quote.duplicateConflict.bookingRef} (${quote.duplicateConflict.checkIn} → ${quote.duplicateConflict.checkOut}).`
        );
      }

      if (!quote.available) {
        db.prepare(`UPDATE bookings SET status = ? WHERE id = ?`).run(oldStatus, booking.id);
        throw new Error(quote.unavailableReason || "New dates are unavailable.");
      }

      db.prepare(
        `UPDATE bookings
         SET check_in = ?, check_out = ?, nights = ?, adults = ?, children = ?,
             subtotal_mad = ?, discount_mad = ?, taxes_mad = ?, service_fee_mad = ?,
             total_mad = ?, commission_mad = ?, partner_net_mad = ?,
             status = ?, special_requests = COALESCE(?, special_requests), updated_at = datetime('now')
         WHERE id = ?`
      ).run(
        parsed.data.checkIn,
        parsed.data.checkOut,
        quote.nights,
        parsed.data.adults ?? booking.adults,
        parsed.data.children ?? booking.children,
        quote.subtotalMad,
        quote.discountMad,
        quote.taxesMad,
        quote.serviceFeeMad,
        quote.totalMad,
        quote.commissionMad,
        quote.partnerNetMad,
        oldStatus,
        parsed.data.specialRequests ?? null,
        booking.id
      );

      db.prepare(
        `INSERT INTO booking_status_history (booking_id, from_status, to_status, changed_by_user_id, note)
         VALUES (?, ?, ?, ?, ?)`
      ).run(booking.id, oldStatus, oldStatus, user.id, `Dates modified to ${parsed.data.checkIn} → ${parsed.data.checkOut}`);

      logAudit(user.id, "booking.modified", "booking", booking.id, {
        checkIn: parsed.data.checkIn,
        checkOut: parsed.data.checkOut,
        newTotalMad: quote.totalMad,
      });

      return { bookingRef: booking.booking_ref, quote };
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
