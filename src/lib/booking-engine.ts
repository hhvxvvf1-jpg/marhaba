import crypto from "crypto";
import { getDb, runInTransaction } from "@/db";
import { PLATFORM_DEFAULTS, Currency, CURRENCY_RATES } from "./config";
import { logAudit } from "./auth";

export interface QuoteInput {
  propertyId: number;
  roomTypeId: number;
  checkIn: string;
  checkOut: string;
  adults?: number;
  children?: number;
  units?: number;
  promoCode?: string;
  currency?: Currency;
  travelerId?: number | null;
  guestEmail?: string;
  excludeBookingId?: number;
}

export interface DuplicateBookingConflict {
  bookingId: number;
  bookingRef: string;
  propertyId: number;
  propertyTitle: string;
  propertySlug: string;
  city: string;
  category: string;
  categoryLabel: string;
  checkIn: string;
  checkOut: string;
  status: string;
  sameProperty: boolean;
}

export interface NightlyBreakdown {
  date: string;
  baseRateMad: number;
  adjustedRateMad: number;
  appliedRules: string[];
  availableUnits: number;
  isBlackout: boolean;
}

export interface QuoteResult {
  available: boolean;
  unavailableReason?: string;
  duplicateConflict?: DuplicateBookingConflict;
  nights: number;
  units: number;
  minAvailableUnits: number;
  nightly: NightlyBreakdown[];
  subtotalMad: number;
  extraGuestMad: number;
  discountMad: number;
  promoApplied?: { code: string; name: string; discountMad: number };
  promoError?: string;
  touristTaxMad: number;
  vatMad: number;
  taxesMad: number;
  serviceFeeMad: number;
  totalMad: number;
  commissionPct: number;
  commissionMad: number;
  partnerNetMad: number;
  currency: Currency;
  fxRate: number;
  cancellationPolicy: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  stay: "Stay / Accommodation",
  car: "Car Rental",
  food: "Dining",
  exp: "Experience / Tour",
};

export function detectCategoryDuplicateBooking(params: {
  travelerId?: number | null;
  guestEmail?: string;
  propertyId: number;
  category: string;
  checkIn: string;
  checkOut: string;
  excludeBookingId?: number;
}): DuplicateBookingConflict | null {
  const email = (params.guestEmail || "").trim().toLowerCase();
  const hasTraveler = typeof params.travelerId === "number" && params.travelerId > 0;
  if (!hasTraveler && !email) return null;

  const db = getDb();
  const identityClauses: string[] = [];
  const queryParams: (string | number)[] = [params.category, params.checkOut, params.checkIn];

  if (hasTraveler) {
    identityClauses.push("b.traveler_id = ?");
    queryParams.push(params.travelerId as number);
  }
  if (email) {
    identityClauses.push("LOWER(b.guest_email) = ?");
    queryParams.push(email);
  }

  const excludeSql = params.excludeBookingId ? "AND b.id != ?" : "";
  if (params.excludeBookingId) {
    queryParams.push(params.excludeBookingId);
  }

  const row = db
    .prepare(
      `SELECT b.id AS booking_id, b.booking_ref, b.property_id, b.check_in, b.check_out, b.status,
              p.title AS property_title, p.slug AS property_slug, p.city, p.marketplace_type
       FROM bookings b
       JOIN properties p ON p.id = b.property_id
       WHERE p.marketplace_type = ?
         AND b.check_in < ?
         AND b.check_out > ?
         AND (
           b.status IN ('confirmed', 'pending', 'completed')
           OR (b.status = 'pending_payment' AND (b.hold_expires_at IS NULL OR datetime(b.hold_expires_at) > datetime('now')))
         )
         AND (${identityClauses.join(" OR ")})
         ${excludeSql}
       ORDER BY b.created_at DESC
       LIMIT 1`
    )
    .get(...queryParams) as
    | {
        booking_id: number;
        booking_ref: string;
        property_id: number;
        check_in: string;
        check_out: string;
        status: string;
        property_title: string;
        property_slug: string;
        city: string;
        marketplace_type: string;
      }
    | undefined;

  if (!row) return null;

  return {
    bookingId: row.booking_id,
    bookingRef: row.booking_ref,
    propertyId: row.property_id,
    propertyTitle: row.property_title,
    propertySlug: row.property_slug,
    city: row.city,
    category: row.marketplace_type,
    categoryLabel: CATEGORY_LABELS[row.marketplace_type] || row.marketplace_type,
    checkIn: row.check_in,
    checkOut: row.check_out,
    status: row.status,
    sameProperty: row.property_id === params.propertyId,
  };
}

export function enumerateNights(checkIn: string, checkOut: string): string[] {
  const start = new Date(`${checkIn}T00:00:00Z`);
  const end = new Date(`${checkOut}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return [];
  }
  const diffDays = Math.round((end.getTime() - start.getTime()) / 86400000);
  if (diffDays < 1 || diffDays > 60) return [];
  const dates: string[] = [];
  for (let i = 0; i < diffDays; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function getEffectiveCommissionPct(propertyCommission: number | null, partnerCommission: number | null): number {
  const db = getDb();
  if (typeof propertyCommission === "number") return propertyCommission;
  if (typeof partnerCommission === "number") return partnerCommission;
  const row = db.prepare(`SELECT value_json FROM system_settings WHERE key = 'default_commission_pct'`).get() as
    | { value_json: string }
    | undefined;
  if (row) {
    try {
      const val = Number(JSON.parse(row.value_json));
      if (!Number.isNaN(val) && val >= 0 && val <= 50) return val;
    } catch {
      // fallback
    }
  }
  return PLATFORM_DEFAULTS.defaultCommissionPct;
}

export function calculateQuote(input: QuoteInput): QuoteResult {
  const db = getDb();
  const currency: Currency = input.currency || "MAD";
  const fxRate = CURRENCY_RATES[currency] || 1;
  const units = Math.max(1, Math.min(10, Math.floor(input.units || 1)));
  const adults = Math.max(1, Math.floor(input.adults || 2));
  const children = Math.max(0, Math.floor(input.children || 0));

  const dates = enumerateNights(input.checkIn, input.checkOut);
  if (dates.length === 0) {
    throw new Error("Invalid check-in / check-out date range.");
  }

  const prop = db
    .prepare(
      `SELECT p.*, pa.commission_override_pct AS partner_commission_pct
       FROM properties p
       JOIN partners pa ON pa.id = p.partner_id
       WHERE p.id = ? AND p.status = 'active'`
    )
    .get(input.propertyId) as
    | {
        id: number;
        partner_id: number;
        marketplace_type: string;
        cancellation_policy: string;
        commission_override_pct: number | null;
        partner_commission_pct: number | null;
      }
    | undefined;

  if (!prop) throw new Error("Property not found or inactive.");

  const room = db
    .prepare(`SELECT * FROM room_types WHERE id = ? AND property_id = ? AND status = 'active'`)
    .get(input.roomTypeId, input.propertyId) as
    | {
        id: number;
        max_adults: number;
        max_children: number;
        extra_beds: number;
        extra_bed_price_mad: number;
        total_units: number;
        base_price_mad: number;
        weekend_price_mad: number | null;
      }
    | undefined;

  if (!room) throw new Error("Room or unit type not found.");

  // Capacity check per unit
  const maxGuestsPerUnit = room.max_adults + room.max_children + room.extra_beds;
  if (adults + children > maxGuestsPerUnit * units) {
    return {
      available: false,
      unavailableReason: `Occupancy exceeds capacity (max ${maxGuestsPerUnit * units} guests for ${units} unit(s)).`,
      nights: dates.length,
      units,
      minAvailableUnits: 0,
      nightly: [],
      subtotalMad: 0,
      extraGuestMad: 0,
      discountMad: 0,
      touristTaxMad: 0,
      vatMad: 0,
      taxesMad: 0,
      serviceFeeMad: 0,
      totalMad: 0,
      commissionPct: 15,
      commissionMad: 0,
      partnerNetMad: 0,
      currency,
      fxRate,
      cancellationPolicy: prop.cancellation_policy,
    };
  }

  const overrides = db
    .prepare(`SELECT * FROM availability_overrides WHERE room_type_id = ? AND date >= ? AND date <= ?`)
    .all(room.id, input.checkIn, input.checkOut) as Array<{
    date: string;
    available_units: number | null;
    price_override_mad: number | null;
    min_stay: number;
    max_stay: number;
    closed_to_arrival: number;
    closed_to_departure: number;
    is_blackout: number;
  }>;
  const overrideMap = new Map(overrides.map((o) => [o.date, o]));

  const rules = db
    .prepare(
      `SELECT * FROM pricing_rules
       WHERE is_active = 1 AND (property_id = ? OR (property_id IS NULL AND partner_id = ?) OR (property_id IS NULL AND partner_id IS NULL))`
    )
    .all(prop.id, prop.partner_id) as Array<{
    id: number;
    name: string;
    rule_type: string;
    adjustment_pct: number;
    adjustment_fixed_mad: number;
    start_date: string | null;
    end_date: string | null;
    min_nights: number | null;
    days_before_checkin: number | null;
  }>;

  const overlappingBookings = db
    .prepare(
      `SELECT check_in, check_out, units_booked
       FROM bookings
       WHERE room_type_id = ?
         AND check_in < ?
         AND check_out > ?
         AND (
           status IN ('confirmed', 'pending', 'completed')
           OR (status = 'pending_payment' AND (hold_expires_at IS NULL OR datetime(hold_expires_at) > datetime('now')))
         )`
    )
    .all(room.id, input.checkOut, input.checkIn) as Array<{
    check_in: string;
    check_out: string;
    units_booked: number;
  }>;

  const daysUntilCheckIn = Math.max(
    0,
    Math.round((new Date(`${input.checkIn}T00:00:00Z`).getTime() - Date.now()) / 86400000)
  );

  let available = true;
  let unavailableReason: string | undefined;
  let minAvailableUnits = Infinity;
  let nightlySumMad = 0;
  const nightly: NightlyBreakdown[] = [];

  // Check arrival / departure restrictions
  const arrivalOv = overrideMap.get(input.checkIn);
  if (arrivalOv?.closed_to_arrival) {
    available = false;
    unavailableReason = "Check-in is closed on the selected arrival date.";
  }
  const departureOv = overrideMap.get(input.checkOut);
  if (departureOv?.closed_to_departure) {
    available = false;
    unavailableReason = "Check-out is closed on the selected departure date.";
  }

  for (const date of dates) {
    const ov = overrideMap.get(date);
    if (ov) {
      if (ov.is_blackout) {
        available = false;
        unavailableReason = `Date ${date} is blacked out by the property.`;
      }
      if (dates.length < ov.min_stay) {
        available = false;
        unavailableReason = `Minimum stay on ${date} is ${ov.min_stay} night(s).`;
      }
      if (dates.length > ov.max_stay) {
        available = false;
        unavailableReason = `Maximum stay on ${date} is ${ov.max_stay} night(s).`;
      }
    }

    const totalForDate = ov && ov.available_units !== null ? ov.available_units : room.total_units;
    const bookedForDate = overlappingBookings
      .filter((b) => b.check_in <= date && b.check_out > date)
      .reduce((acc, b) => acc + b.units_booked, 0);
    const remaining = Math.max(0, totalForDate - bookedForDate);
    if (remaining < minAvailableUnits) minAvailableUnits = remaining;
    if (remaining < units) {
      available = false;
      unavailableReason = unavailableReason || `Only ${remaining} unit(s) available on ${date}.`;
    }

    const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay();
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Fri or Sat
    let baseRateMad = ov && ov.price_override_mad !== null ? ov.price_override_mad : isWeekend && room.weekend_price_mad ? room.weekend_price_mad : room.base_price_mad;
    let adjusted = baseRateMad;
    const appliedRules: string[] = [];

    if (isWeekend && room.weekend_price_mad && !(ov && ov.price_override_mad !== null)) {
      appliedRules.push("Weekend rate");
    }

    for (const rule of rules) {
      let matches = false;
      if (rule.rule_type === "seasonal" || rule.rule_type === "holiday") {
        if ((!rule.start_date || date >= rule.start_date) && (!rule.end_date || date <= rule.end_date)) {
          matches = true;
        }
      } else if (rule.rule_type === "weekend" && isWeekend) {
        matches = true;
      } else if (rule.rule_type === "long_stay" && rule.min_nights && dates.length >= rule.min_nights) {
        matches = true;
      } else if (rule.rule_type === "early_bird" && rule.days_before_checkin && daysUntilCheckIn >= rule.days_before_checkin) {
        matches = true;
      } else if (rule.rule_type === "last_minute" && rule.days_before_checkin && daysUntilCheckIn <= rule.days_before_checkin) {
        matches = true;
      }

      if (matches) {
        if (rule.adjustment_pct !== 0) {
          adjusted = adjusted * (1 + rule.adjustment_pct / 100);
        }
        if (rule.adjustment_fixed_mad !== 0) {
          adjusted = adjusted + rule.adjustment_fixed_mad;
        }
        appliedRules.push(rule.name);
      }
    }

    adjusted = Math.max(50, Math.round(adjusted));
    nightlySumMad += adjusted * units;
    nightly.push({
      date,
      baseRateMad,
      adjustedRateMad: adjusted,
      appliedRules,
      availableUnits: remaining,
      isBlackout: Boolean(ov?.is_blackout),
    });
  }

  // Extra guest charge if adults exceed base adult capacity
  const extraAdults = Math.max(0, adults - room.max_adults * units);
  const extraGuestMad = Math.round(extraAdults * room.extra_bed_price_mad * dates.length);
  const subtotalMad = Math.round(nightlySumMad + extraGuestMad);

  // Promo validation
  let discountMad = 0;
  let promoApplied: QuoteResult["promoApplied"];
  let promoError: string | undefined;

  if (input.promoCode && input.promoCode.trim()) {
    const code = input.promoCode.trim().toUpperCase();
    const today = new Date().toISOString().slice(0, 10);
    const promo = db
      .prepare(`SELECT * FROM promotions WHERE UPPER(code) = ? AND is_active = 1`)
      .get(code) as
      | {
          id: number;
          code: string;
          name: string;
          discount_pct: number;
          discount_fixed_mad: number;
          min_booking_mad: number;
          max_uses: number;
          used_count: number;
          valid_from: string;
          valid_to: string;
          category_filter: string;
        }
      | undefined;

    if (!promo) {
      promoError = "Invalid promo code.";
    } else if (today < promo.valid_from || today > promo.valid_to) {
      promoError = "Promo code has expired or is not active yet.";
    } else if (promo.used_count >= promo.max_uses) {
      promoError = "Promo code usage limit reached.";
    } else if (subtotalMad < promo.min_booking_mad) {
      promoError = `Minimum booking amount of ${promo.min_booking_mad} MAD required.`;
    } else if (promo.category_filter && promo.category_filter !== prop.marketplace_type) {
      promoError = `Promo code is valid only for ${promo.category_filter} bookings.`;
    } else {
      const pctDisc = promo.discount_pct > 0 ? Math.round((subtotalMad * promo.discount_pct) / 100) : 0;
      discountMad = Math.min(subtotalMad, pctDisc + Math.round(promo.discount_fixed_mad));
      promoApplied = { code: promo.code, name: promo.name, discountMad };
    }
  }

  const discountedSubtotal = Math.max(0, subtotalMad - discountMad);
  const touristTaxMad =
    prop.marketplace_type === "stay" ? PLATFORM_DEFAULTS.touristTaxPerNightMad * dates.length * units : 0;
  const vatMad = Math.round((discountedSubtotal * PLATFORM_DEFAULTS.vatPct) / 100);
  const taxesMad = touristTaxMad + vatMad;
  const serviceFeeMad = Math.round((discountedSubtotal * PLATFORM_DEFAULTS.serviceFeePct) / 100);
  const totalMad = discountedSubtotal + taxesMad + serviceFeeMad;

  const commissionPct = getEffectiveCommissionPct(prop.commission_override_pct, prop.partner_commission_pct);
  const commissionMad = Math.round((discountedSubtotal * commissionPct) / 100);
  const partnerNetMad = Math.max(0, discountedSubtotal - commissionMad);

  const duplicateConflict = detectCategoryDuplicateBooking({
    travelerId: input.travelerId,
    guestEmail: input.guestEmail,
    propertyId: prop.id,
    category: prop.marketplace_type,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    excludeBookingId: input.excludeBookingId,
  }) || undefined;

  return {
    available,
    unavailableReason,
    duplicateConflict,
    nights: dates.length,
    units,
    minAvailableUnits: minAvailableUnits === Infinity ? 0 : minAvailableUnits,
    nightly,
    subtotalMad,
    extraGuestMad,
    discountMad,
    promoApplied,
    promoError,
    touristTaxMad,
    vatMad,
    taxesMad,
    serviceFeeMad,
    totalMad,
    commissionPct,
    commissionMad,
    partnerNetMad,
    currency,
    fxRate,
    cancellationPolicy: prop.cancellation_policy,
  };
}

export interface CreateBookingInput extends QuoteInput {
  travelerId: number | null;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests?: string;
  affiliateCode?: string;
  referralCode?: string;
}

export function createBookingTransactional(input: CreateBookingInput) {
  return runInTransaction((db) => {
    const quote = calculateQuote(input);
    if (quote.duplicateConflict) {
      const c = quote.duplicateConflict;
      throw new Error(
        `Auto-detected existing ${c.categoryLabel} reservation (${c.bookingRef} at ${c.propertyTitle}, ${c.checkIn} → ${c.checkOut}). Manage or cancel it in Account to avoid duplicate reservations in this category.`
      );
    }
    if (!quote.available) {
      throw new Error(quote.unavailableReason || "Selected room is not available for these dates.");
    }

    const prop = db
      .prepare(`SELECT id, partner_id, title, instant_book FROM properties WHERE id = ?`)
      .get(input.propertyId) as { id: number; partner_id: number; title: string; instant_book: number } | undefined;
    if (!prop) throw new Error("Property not found.");

    const partner = db
      .prepare(`SELECT user_id FROM partners WHERE id = ?`)
      .get(prop.partner_id) as { user_id: number } | undefined;

    let affiliateId: number | null = null;
    if (input.affiliateCode) {
      const aff = db
        .prepare(`SELECT id FROM affiliates WHERE UPPER(code) = ? AND status = 'approved'`)
        .get(input.affiliateCode.trim().toUpperCase()) as { id: number } | undefined;
      if (aff) affiliateId = aff.id;
    }

    const bookingRef = `MRH-${new Date().getFullYear().toString().slice(-2)}${crypto
      .randomBytes(3)
      .toString("hex")
      .toUpperCase()}`;

    const holdExpiresAt = new Date(
      Date.now() + PLATFORM_DEFAULTS.holdExpirationMinutes * 60 * 1000
    ).toISOString();

    const res = db
      .prepare(
        `INSERT INTO bookings (
          booking_ref, traveler_id, property_id, room_type_id, partner_id,
          check_in, check_out, nights, adults, children, units_booked,
          status, currency, fx_rate, subtotal_mad, discount_mad, promo_code,
          taxes_mad, service_fee_mad, total_mad, commission_pct, commission_mad, partner_net_mad,
          guest_name, guest_email, guest_phone, special_requests, hold_expires_at,
          affiliate_id, referral_code
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_payment', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        bookingRef,
        input.travelerId,
        input.propertyId,
        input.roomTypeId,
        prop.partner_id,
        input.checkIn,
        input.checkOut,
        quote.nights,
        input.adults || 2,
        input.children || 0,
        quote.units,
        quote.currency,
        quote.fxRate,
        quote.subtotalMad,
        quote.discountMad,
        quote.promoApplied?.code || "",
        quote.taxesMad,
        quote.serviceFeeMad,
        quote.totalMad,
        quote.commissionPct,
        quote.commissionMad,
        quote.partnerNetMad,
        input.guestName,
        input.guestEmail,
        input.guestPhone,
        input.specialRequests || "",
        holdExpiresAt,
        affiliateId,
        input.referralCode || ""
      );

    const bookingId = Number(res.lastInsertRowid);

    db.prepare(
      `INSERT INTO booking_status_history (booking_id, from_status, to_status, changed_by_user_id, note)
       VALUES (?, NULL, 'pending_payment', ?, 'Booking hold created')`
    ).run(bookingId, input.travelerId);

    if (quote.promoApplied) {
      db.prepare(`UPDATE promotions SET used_count = used_count + 1 WHERE UPPER(code) = ?`).run(
        quote.promoApplied.code
      );
    }

    if (partner?.user_id) {
      db.prepare(
        `INSERT INTO notifications (user_id, type, title, body, link_url)
         VALUES (?, 'booking_hold', ?, ?, ?)`
      ).run(
        partner.user_id,
        `New reservation hold ${bookingRef}`,
        `${input.guestName} initiated a booking at ${prop.title} (${input.checkIn} → ${input.checkOut}).`,
        `/partner`
      );
    }

    logAudit(input.travelerId, "booking.created", "booking", bookingId, {
      bookingRef,
      totalMad: quote.totalMad,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
    });

    return {
      bookingId,
      bookingRef,
      holdExpiresAt,
      quote,
    };
  });
}

export function confirmBookingPaymentTransactional(params: {
  bookingId: number;
  actorUserId: number | null;
  provider: "sandbox_card" | "stripe" | "paypal" | "cmi" | "pay_at_property";
  methodSummary: string;
}) {
  return runInTransaction((db) => {
    const booking = db.prepare(`SELECT * FROM bookings WHERE id = ?`).get(params.bookingId) as
      | {
          id: number;
          booking_ref: string;
          traveler_id: number | null;
          property_id: number;
          partner_id: number;
          status: string;
          currency: string;
          subtotal_mad: number;
          discount_mad: number;
          taxes_mad: number;
          service_fee_mad: number;
          total_mad: number;
          commission_mad: number;
          partner_net_mad: number;
          hold_expires_at: string | null;
          affiliate_id: number | null;
          referral_code: string;
        }
      | undefined;

    if (!booking) throw new Error("Booking not found.");
    if (booking.status === "confirmed") {
      return { bookingRef: booking.booking_ref, status: "confirmed", alreadyConfirmed: true };
    }
    if (!["pending_payment", "pending", "draft"].includes(booking.status)) {
      throw new Error(`Cannot confirm booking in status '${booking.status}'.`);
    }

    const prop = db
      .prepare(`SELECT title, instant_book FROM properties WHERE id = ?`)
      .get(booking.property_id) as { title: string; instant_book: number };
    const partner = db
      .prepare(`SELECT user_id FROM partners WHERE id = ?`)
      .get(booking.partner_id) as { user_id: number };

    const txId = `TX-${params.provider.toUpperCase()}-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
    const paymentStatus = params.provider === "pay_at_property" ? "authorized" : "captured";
    const nextBookingStatus = prop.instant_book || params.provider !== "pay_at_property" ? "confirmed" : "pending";

    db.prepare(
      `INSERT INTO payments (booking_id, provider, provider_tx_id, amount_mad, currency, status, method_summary, raw_metadata_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      booking.id,
      params.provider,
      txId,
      booking.total_mad,
      booking.currency,
      paymentStatus,
      params.methodSummary,
      JSON.stringify({ mode: params.provider === "pay_at_property" ? "pay_at_property" : "sandbox_or_keyed" })
    );

    db.prepare(
      `UPDATE bookings SET status = ?, hold_expires_at = NULL, updated_at = datetime('now') WHERE id = ?`
    ).run(nextBookingStatus, booking.id);

    db.prepare(
      `INSERT INTO booking_status_history (booking_id, from_status, to_status, changed_by_user_id, note)
       VALUES (?, ?, ?, ?, ?)`
    ).run(
      booking.id,
      booking.status,
      nextBookingStatus,
      params.actorUserId,
      `Payment ${paymentStatus} via ${params.provider} (${txId})`
    );

    // Double-entry ledger records
    db.prepare(
      `INSERT INTO ledger_entries (booking_id, partner_id, entry_type, amount_mad, direction, description)
       VALUES (?, ?, 'booking_gross', ?, 'credit', ?)`
    ).run(booking.id, booking.partner_id, booking.total_mad, `Gross booking ${booking.booking_ref}`);

    db.prepare(
      `INSERT INTO ledger_entries (booking_id, partner_id, entry_type, amount_mad, direction, description)
       VALUES (?, ?, 'commission', ?, 'credit', ?)`
    ).run(booking.id, booking.partner_id, booking.commission_mad, `Marketplace commission ${booking.booking_ref}`);

    db.prepare(
      `INSERT INTO ledger_entries (booking_id, partner_id, entry_type, amount_mad, direction, description)
       VALUES (?, ?, 'tax', ?, 'credit', ?)`
    ).run(booking.id, booking.partner_id, booking.taxes_mad, `VAT & Tourist tax ${booking.booking_ref}`);

    db.prepare(
      `INSERT INTO ledger_entries (booking_id, partner_id, entry_type, amount_mad, direction, description)
       VALUES (?, ?, 'fee', ?, 'credit', ?)`
    ).run(booking.id, booking.partner_id, booking.service_fee_mad, `Service fee ${booking.booking_ref}`);

    db.prepare(
      `INSERT INTO ledger_entries (booking_id, partner_id, entry_type, amount_mad, direction, description)
       VALUES (?, ?, 'partner_payable', ?, 'credit', ?)`
    ).run(booking.id, booking.partner_id, booking.partner_net_mad, `Partner net payable ${booking.booking_ref}`);

    // Loyalty points (1 point per 10 MAD)
    if (booking.traveler_id) {
      const pts = Math.floor(booking.total_mad / 10);
      db.prepare(`UPDATE users SET loyalty_points = loyalty_points + ? WHERE id = ?`).run(pts, booking.traveler_id);
      db.prepare(
        `INSERT INTO notifications (user_id, type, title, body, link_url)
         VALUES (?, 'booking_confirmed', ?, ?, ?)`
      ).run(
        booking.traveler_id,
        `Booking ${booking.booking_ref} ${nextBookingStatus}`,
        `Your reservation at ${prop.title} is ${nextBookingStatus}. You earned ${pts} loyalty points.`,
        `/account`
      );
    }

    if (partner?.user_id) {
      db.prepare(
        `INSERT INTO notifications (user_id, type, title, body, link_url)
         VALUES (?, 'booking_confirmed', ?, ?, ?)`
      ).run(
        partner.user_id,
        `Confirmed booking ${booking.booking_ref}`,
        `Booking ${booking.booking_ref} at ${prop.title} is confirmed (Net: ${booking.partner_net_mad} MAD).`,
        `/partner`
      );
    }

    // Affiliate attribution
    if (booking.affiliate_id) {
      const aff = db.prepare(`SELECT commission_pct FROM affiliates WHERE id = ?`).get(booking.affiliate_id) as
        | { commission_pct: number }
        | undefined;
      if (aff) {
        const affEarn = Math.round(((booking.subtotal_mad - booking.discount_mad) * aff.commission_pct) / 100);
        db.prepare(
          `UPDATE affiliates SET total_bookings = total_bookings + 1, total_earned_mad = total_earned_mad + ? WHERE id = ?`
        ).run(affEarn, booking.affiliate_id);
      }
    }

    logAudit(params.actorUserId, "booking.payment_confirmed", "booking", booking.id, {
      bookingRef: booking.booking_ref,
      provider: params.provider,
      txId,
      nextBookingStatus,
    });

    return {
      bookingRef: booking.booking_ref,
      status: nextBookingStatus,
      paymentStatus,
      txId,
    };
  });
}

export function calculateRefundEligibility(
  cancellationPolicy: string,
  checkInDate: string,
  totalPaidMad: number
): { refundPct: number; refundAmountMad: number; ruleExplanation: string } {
  const hoursUntilCheckIn = (new Date(`${checkInDate}T15:00:00Z`).getTime() - Date.now()) / 3600000;
  if (cancellationPolicy === "flexible") {
    if (hoursUntilCheckIn >= 24) {
      return {
        refundPct: 100,
        refundAmountMad: totalPaidMad,
        ruleExplanation: "Flexible policy: 100% refund when cancelled at least 24 hours before check-in.",
      };
    }
    return {
      refundPct: 50,
      refundAmountMad: Math.round(totalPaidMad * 0.5),
      ruleExplanation: "Flexible policy: 50% refund within 24 hours of check-in.",
    };
  }
  if (cancellationPolicy === "moderate") {
    if (hoursUntilCheckIn >= 120) {
      return {
        refundPct: 100,
        refundAmountMad: totalPaidMad,
        ruleExplanation: "Moderate policy: 100% refund 5+ days before check-in.",
      };
    }
    if (hoursUntilCheckIn >= 24) {
      return {
        refundPct: 50,
        refundAmountMad: Math.round(totalPaidMad * 0.5),
        ruleExplanation: "Moderate policy: 50% refund between 1 and 5 days before check-in.",
      };
    }
    return { refundPct: 0, refundAmountMad: 0, ruleExplanation: "Moderate policy: non-refundable within 24 hours." };
  }
  // strict
  if (hoursUntilCheckIn >= 168) {
    return {
      refundPct: 50,
      refundAmountMad: Math.round(totalPaidMad * 0.5),
      ruleExplanation: "Strict policy: 50% refund 7+ days before check-in.",
    };
  }
  return { refundPct: 0, refundAmountMad: 0, ruleExplanation: "Strict policy: non-refundable within 7 days of check-in." };
}

export function cancelAndRefundBookingTransactional(params: {
  bookingId: number;
  actorUserId: number;
  reason: string;
  forceFullRefund?: boolean;
}) {
  return runInTransaction((db) => {
    const booking = db
      .prepare(
        `SELECT b.*, p.cancellation_policy, p.title
         FROM bookings b
         JOIN properties p ON p.id = b.property_id
         WHERE b.id = ?`
      )
      .get(params.bookingId) as
      | {
          id: number;
          booking_ref: string;
          traveler_id: number | null;
          partner_id: number;
          status: string;
          check_in: string;
          total_mad: number;
          partner_net_mad: number;
          commission_mad: number;
          cancellation_policy: string;
          title: string;
        }
      | undefined;

    if (!booking) throw new Error("Booking not found.");
    if (["cancelled", "refunded"].includes(booking.status)) {
      throw new Error("Booking is already cancelled.");
    }

    const capturedPayment = db
      .prepare(`SELECT * FROM payments WHERE booking_id = ? AND status = 'captured' ORDER BY id DESC LIMIT 1`)
      .get(booking.id) as { id: number; amount_mad: number } | undefined;

    let refundAmountMad = 0;
    let refundPct = 0;
    let explanation = "No payment captured; hold released.";

    if (capturedPayment) {
      if (params.forceFullRefund) {
        refundPct = 100;
        refundAmountMad = capturedPayment.amount_mad;
        explanation = "Admin override: 100% full refund.";
      } else {
        const elig = calculateRefundEligibility(booking.cancellation_policy, booking.check_in, capturedPayment.amount_mad);
        refundPct = elig.refundPct;
        refundAmountMad = elig.refundAmountMad;
        explanation = elig.ruleExplanation;
      }
    }

    const nextStatus =
      refundAmountMad === 0
        ? "cancelled"
        : refundAmountMad >= (capturedPayment?.amount_mad || 0)
        ? "refunded"
        : "partially_refunded";

    db.prepare(
      `UPDATE bookings
       SET status = ?, cancellation_reason = ?, cancelled_at = datetime('now'), updated_at = datetime('now')
       WHERE id = ?`
    ).run(nextStatus, params.reason, booking.id);

    db.prepare(
      `INSERT INTO booking_status_history (booking_id, from_status, to_status, changed_by_user_id, note)
       VALUES (?, ?, ?, ?, ?)`
    ).run(booking.id, booking.status, nextStatus, params.actorUserId, `${params.reason} — ${explanation}`);

    if (capturedPayment && refundAmountMad > 0) {
      db.prepare(
        `INSERT INTO refunds (booking_id, payment_id, amount_mad, reason, status, processed_by_user_id)
         VALUES (?, ?, ?, ?, 'processed', ?)`
      ).run(booking.id, capturedPayment.id, refundAmountMad, params.reason, params.actorUserId);

      db.prepare(`UPDATE payments SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(
        refundAmountMad >= capturedPayment.amount_mad ? "refunded" : "partially_refunded",
        capturedPayment.id
      );

      db.prepare(
        `INSERT INTO ledger_entries (booking_id, partner_id, entry_type, amount_mad, direction, description)
         VALUES (?, ?, 'refund', ?, 'debit', ?)`
      ).run(booking.id, booking.partner_id, refundAmountMad, `Refund processed for ${booking.booking_ref}`);

      const partnerDebit = Math.round((booking.partner_net_mad * refundPct) / 100);
      if (partnerDebit > 0) {
        db.prepare(
          `INSERT INTO ledger_entries (booking_id, partner_id, entry_type, amount_mad, direction, description)
           VALUES (?, ?, 'partner_payable', ?, 'debit', ?)`
        ).run(booking.id, booking.partner_id, partnerDebit, `Partner payable reversal ${booking.booking_ref}`);
      }
    }

    if (booking.traveler_id) {
      db.prepare(
        `INSERT INTO notifications (user_id, type, title, body, link_url)
         VALUES (?, 'booking_cancelled', ?, ?, ?)`
      ).run(
        booking.traveler_id,
        `Booking ${booking.booking_ref} ${nextStatus}`,
        `${booking.title}: ${explanation}`,
        `/account`
      );
    }

    logAudit(params.actorUserId, "booking.cancelled", "booking", booking.id, {
      bookingRef: booking.booking_ref,
      nextStatus,
      refundAmountMad,
      reason: params.reason,
    });

    return {
      bookingRef: booking.booking_ref,
      status: nextStatus,
      refundAmountMad,
      explanation,
    };
  });
}
