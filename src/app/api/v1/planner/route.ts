import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { getCurrentUser, logAudit } from "@/lib/auth";
import { createBookingTransactional } from "@/lib/booking-engine";

const PlannerSchema = z.object({
  city: z.string().default("all"),
  days: z.number().int().min(1).max(14).default(3),
  travelers: z.number().int().min(1).max(12).default(2),
  budgetMad: z.number().min(300).max(200000).default(8000),
  includeCar: z.boolean().default(true),
  pace: z.enum(["relaxed", "balanced", "explorer"]).optional().default("balanced"),
  interests: z.string().max(250).optional().default(""),
  startDate: z.string().optional(),
  bookWholePlan: z.boolean().optional().default(false),
  selectedItemIds: z.array(z.number().int().positive()).optional(),
  guestName: z.string().optional(),
  guestEmail: z.string().optional(),
  guestPhone: z.string().optional(),
});

interface CatalogRow {
  id: number;
  slug: string;
  title: string;
  title_fr: string | null;
  title_ar: string | null;
  city: string;
  region: string | null;
  marketplace_type: string;
  category: string;
  base_price_mad: number;
  unit_type: string;
  rating_avg: number;
  review_count: number;
  cancellation_policy: string | null;
  images_json: string;
  partner_name: string;
}

function normalizeCityMatch(input: string, candidate: string): boolean {
  const norm = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  return norm(input) === norm(candidate);
}

function estimateCostMad(item: CatalogRow, days: number, travelers: number): number {
  const nights = Math.max(1, days - 1);
  const rooms = Math.max(1, Math.ceil(travelers / 2));
  if (item.unit_type === "night") return item.base_price_mad * nights * rooms;
  if (item.unit_type === "day") return item.base_price_mad * days;
  if (item.unit_type === "tente") return item.base_price_mad * Math.ceil(travelers / 2);
  return item.base_price_mad * travelers;
}

function buildCityGuide(city: string) {
  const norm = city.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (norm.includes("marrakech")) {
    return {
      bestDistrict: "Medina (Riads) · Gueliz · Palmeraie",
      gettingThere: "RAK Menara Airport (15 min) · ONCF Train from Casablanca/Rabat · CTM/Supratours",
      mustTryDish: "Tangia Marrakchia & Mint Tea on Jemaa el-Fna rooftop",
      bestHours: "Morning 08:30–11:30 for gardens & souks; sunset rooftops after 17:30",
    };
  }
  if (norm.includes("laayoune")) {
    return {
      bestDistrict: "Place Mechouar · Foum El Oued Coast · Saharan Oasis",
      gettingThere: "EUN Hassan I Airport · CTM / Supratours Express coaches · 4x4 desert transfer",
      mustTryDish: "Camel Tagine, Couscous Khoumassi & Sahrawi Atay (3-round tea)",
      bestHours: "08:00–11:00 dunes & coast; 16:30–20:00 desert sunset & oasis tea",
    };
  }
  if (norm.includes("dakhla")) {
    return {
      bestDistrict: "Dakhla Lagoon · PK25 Surf Point · White Dune",
      gettingThere: "VIL Dakhla Airport · Lagoon 4x4 shuttle · Supratours coastal line",
      mustTryDish: "Fresh Dakhla Oysters, Grilled Lobster & Atlantic Sea Bass",
      bestHours: "10:00–16:00 steady wind for kitesurf & lagoon boat; sunset at Dune Blanche",
    };
  }
  if (norm.includes("casablanca")) {
    return {
      bestDistrict: "Corniche Ain Diab · Habous Quarter · Gautier / Maarif",
      gettingThere: "CMN Mohammed V Airport (RER Train 35 min) · Al Boraq High-Speed Rail",
      mustTryDish: "Seafood Platter by the Atlantic & Traditional Pastilla",
      bestHours: "09:00 Hassan II Mosque; afternoon Habous artisan arcades; evening Corniche",
    };
  }
  if (norm.includes("fes")) {
    return {
      bestDistrict: "Fès el-Bali (Old Medina) · Ville Nouvelle · Jnan Sbil",
      gettingThere: "FEZ Saïss Airport · Direct ONCF Train · CTM Coach Hub",
      mustTryDish: "Fassi Chicken Pastilla, Rfissa & Artisan Clay-Baked Tagine",
      bestHours: "09:00–12:30 Chouara Tannery & Medersa; quiet riad evening dinner",
    };
  }
  if (norm.includes("tanger")) {
    return {
      bestDistrict: "Kasbah · Marshan · Malabata Bay",
      gettingThere: "TNG Ibn Battouta Airport · Al Boraq 2h10 from Casablanca · Tanger Med Port",
      mustTryDish: "Tangier Kalinti, Grilled Sardines & Cafe Hafa Mint Tea",
      bestHours: "Morning Cap Spartel & Hercules Caves; sunset overlooking the Strait",
    };
  }
  if (norm.includes("agadir")) {
    return {
      bestDistrict: "Agadir Beachfront · Marina · Taghazout Surf Coast",
      gettingThere: "AGA Al Massira Airport · CTM / Supratours · Coastal 4x4",
      mustTryDish: "Argan-drizzled Amlou Breakfast & Taghazout Tagine",
      bestHours: "Morning Souk El Had or Paradise Valley; afternoon Atlantic surf",
    };
  }
  return {
    bestDistrict: `Historic Center & Scenic Waterfront of ${city}`,
    gettingThere: "Connected via ONCF Rail / CTM / Supratours & MARHABA verified transfers",
    mustTryDish: "Regional Moroccan Tagine, Fresh Bread & Sahrawi/Atlas Mint Tea",
    bestHours: "Morning 09:00–12:00 cultural walks; 17:00+ golden-hour views & dinner",
  };
}

export async function GET() {
  ensureSeeded();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ itineraries: [] });
  const db = getDb();
  const itineraries = db
    .prepare(`SELECT * FROM itineraries WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`)
    .all(user.id);
  return NextResponse.json({ itineraries });
}

export async function POST(req: Request) {
  ensureSeeded();
  const user = await getCurrentUser();
  const body = await req.json();
  const parsed = PlannerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid trip planner parameters (minimum budget 300 MAD, 1-14 days)." }, { status: 400 });
  }

  const db = getDb();
  const allActive = db
    .prepare(
      `SELECT p.id, p.slug, p.title, p.title_fr, p.title_ar, p.city, p.region, p.marketplace_type, p.category,
              p.base_price_mad, p.unit_type, p.rating_avg, p.review_count, p.cancellation_policy, p.images_json,
              pa.business_name AS partner_name
       FROM properties p
       JOIN partners pa ON pa.id = p.partner_id
       WHERE p.status = 'active'
       ORDER BY p.featured DESC, p.rating_avg DESC`
    )
    .all() as CatalogRow[];

  let targetCity = parsed.data.city;
  if (!targetCity || targetCity === "all") {
    const cityCounts = new Map<string, Set<string>>();
    for (const r of allActive) {
      if (!cityCounts.has(r.city)) cityCounts.set(r.city, new Set());
      cityCounts.get(r.city)!.add(r.marketplace_type);
    }
    targetCity = [...cityCounts.entries()].sort((a, b) => b[1].size - a[1].size)[0]?.[0] || "Marrakech";
  } else {
    const matched = allActive.find((r) => normalizeCityMatch(targetCity, r.city));
    if (matched) targetCity = matched.city;
  }

  const cityPool = allActive.filter((r) => normalizeCityMatch(targetCity, r.city));
  const interestsTerms = parsed.data.interests
    .toLowerCase()
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 3);

  const scoreItem = (r: CatalogRow) => {
    let score = r.rating_avg || 4;
    const hay = `${r.title} ${r.category} ${r.marketplace_type}`.toLowerCase();
    for (const term of interestsTerms) {
      if (hay.includes(term)) score += 2.5;
    }
    return score;
  };

  const cityStays = cityPool.filter((r) => r.marketplace_type === "stay");
  const stays = (cityStays.length > 0 ? cityStays : allActive.filter((r) => r.marketplace_type === "stay")).sort(
    (a, b) => scoreItem(b) - scoreItem(a)
  );

  const cityCars = cityPool.filter((r) => r.marketplace_type === "car");
  const cars = parsed.data.includeCar
    ? (cityCars.length > 0 ? cityCars : allActive.filter((r) => r.marketplace_type === "car")).sort(
        (a, b) => a.base_price_mad - b.base_price_mad
      )
    : [];

  const cityFoods = cityPool.filter((r) => r.marketplace_type === "food");
  const foods = (cityFoods.length > 0 ? cityFoods : allActive.filter((r) => r.marketplace_type === "food")).sort(
    (a, b) => scoreItem(b) - scoreItem(a)
  );

  const cityExps = cityPool.filter((r) => r.marketplace_type === "exp");
  const exps = (cityExps.length > 0 ? cityExps : allActive.filter((r) => r.marketplace_type === "exp")).sort(
    (a, b) => scoreItem(b) - scoreItem(a)
  );

  const { days, travelers, budgetMad, pace } = parsed.data;
  const checkIn = parsed.data.startDate || new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10);
  const checkOutDate = new Date(new Date(`${checkIn}T00:00:00Z`).getTime() + Math.max(1, days - 1) * 86400_000);
  const checkOut = checkOutDate.toISOString().slice(0, 10);

  const stayShare = pace === "relaxed" ? 0.55 : pace === "explorer" ? 0.42 : 0.48;
  const chosenStay =
    stays.find((s) => estimateCostMad(s, days, travelers) <= budgetMad * stayShare) ||
    stays.slice().sort((a, b) => estimateCostMad(a, days, travelers) - estimateCostMad(b, days, travelers))[0] ||
    null;

  const chosenCar =
    cars.find((c) => estimateCostMad(c, days, travelers) <= budgetMad * 0.3) || cars[0] || null;

  let estimatedTotalMad = 0;
  let stayMad = 0;
  let carMad = 0;
  let expMad = 0;
  let diningMad = 0;
  const selectedServices: Array<{ item: CatalogRow; estimatedMad: number; role: string }> = [];

  if (chosenStay) {
    const est = estimateCostMad(chosenStay, days, travelers);
    stayMad += est;
    estimatedTotalMad += est;
    selectedServices.push({ item: chosenStay, estimatedMad: est, role: "accommodation" });
  }
  if (chosenCar) {
    const est = estimateCostMad(chosenCar, days, travelers);
    carMad += est;
    estimatedTotalMad += est;
    selectedServices.push({ item: chosenCar, estimatedMad: est, role: "vehicle" });
  }

  const dailyPlan = [];
  for (let d = 1; d <= days; d++) {
    const skipExpForRelaxed = pace === "relaxed" && d > 1 && d % 2 === 0;
    const dayExp = !skipExpForRelaxed && exps.length > 0 ? exps[(d - 1) % exps.length] : null;
    const dayFood = foods.length > 0 ? foods[(d - 1) % foods.length] : null;
    let dayCost = 0;
    if (dayExp) {
      const est = dayExp.base_price_mad * travelers;
      if (estimatedTotalMad + est <= budgetMad || d === 1) {
        dayCost += est;
        expMad += est;
        estimatedTotalMad += est;
        if (!selectedServices.some((s) => s.item.id === dayExp.id)) {
          selectedServices.push({ item: dayExp, estimatedMad: est, role: "experience" });
        }
      }
    }
    if (dayFood) {
      const est = dayFood.base_price_mad * travelers;
      dayCost += est;
      diningMad += est;
      estimatedTotalMad += est;
      if (!selectedServices.some((s) => s.item.id === dayFood.id)) {
        selectedServices.push({ item: dayFood, estimatedMad: est, role: "dining" });
      }
    }

    dailyPlan.push({
      day: d,
      city: targetCity,
      stay: chosenStay
        ? { id: chosenStay.id, slug: chosenStay.slug, title: chosenStay.title, title_fr: chosenStay.title_fr, title_ar: chosenStay.title_ar }
        : null,
      car: chosenCar
        ? { id: chosenCar.id, slug: chosenCar.slug, title: chosenCar.title, title_fr: chosenCar.title_fr, title_ar: chosenCar.title_ar }
        : null,
      experience: dayExp
        ? {
            id: dayExp.id,
            slug: dayExp.slug,
            title: dayExp.title,
            title_fr: dayExp.title_fr,
            title_ar: dayExp.title_ar,
            estimatedMad: dayExp.base_price_mad * travelers,
          }
        : null,
      dining: dayFood
        ? {
            id: dayFood.id,
            slug: dayFood.slug,
            title: dayFood.title,
            title_fr: dayFood.title_fr,
            title_ar: dayFood.title_ar,
            estimatedMad: dayFood.base_price_mad * travelers,
          }
        : null,
      dailyActivitiesMad: dayCost,
    });
  }

  const overBudget = estimatedTotalMad > budgetMad;
  const cheaperAlternative =
    overBudget && stays.length > 1 ? stays.slice().sort((a, b) => a.base_price_mad - b.base_price_mad)[0] : null;

  const alternatives = {
    stays: stays.slice(0, 4).map((item) => ({ ...item, estimatedMad: estimateCostMad(item, days, travelers) })),
    cars: cars.slice(0, 3).map((item) => ({ ...item, estimatedMad: estimateCostMad(item, days, travelers) })),
    experiences: exps.slice(0, 4).map((item) => ({ ...item, estimatedMad: item.base_price_mad * travelers })),
    dining: foods.slice(0, 4).map((item) => ({ ...item, estimatedMad: item.base_price_mad * travelers })),
  };

  const planRef = `PLN-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const planPayload = {
    city: targetCity,
    days,
    travelers,
    budgetMad,
    pace,
    dates: { startDate: checkIn, endDate: checkOut },
    estimatedTotalMad,
    breakdown: { stayMad, carMad, expMad, diningMad },
    overBudget,
    budgetDifferenceMad: budgetMad - estimatedTotalMad,
    cheaperAlternative: cheaperAlternative
      ? {
          id: cheaperAlternative.id,
          slug: cheaperAlternative.slug,
          title: cheaperAlternative.title,
          basePriceMad: cheaperAlternative.base_price_mad,
          estimatedMad: estimateCostMad(cheaperAlternative, days, travelers),
        }
      : null,
    selectedServices,
    alternatives,
    dailyPlan,
    cityGuide: buildCityGuide(targetCity),
  };

  const createdBookings: Array<{ bookingRef: string; title: string; status: string; totalMad: number }> = [];
  let planStatus: "draft" | "requested" = "draft";

  if (parsed.data.bookWholePlan) {
    if (!user) {
      return NextResponse.json({ error: "Please sign in before submitting a whole-trip booking request." }, { status: 401 });
    }
    const allowedIds = parsed.data.selectedItemIds && parsed.data.selectedItemIds.length > 0 ? new Set(parsed.data.selectedItemIds) : null;
    const toBook = allowedIds
      ? allActive.filter((item) => allowedIds.has(item.id)).map((item) => ({ item, role: item.marketplace_type === "stay" ? "accommodation" : item.marketplace_type }))
      : selectedServices;

    for (const svc of toBook) {
      const room = db
        .prepare(`SELECT id FROM room_types WHERE property_id = ? AND status = 'active' ORDER BY base_price_mad ASC LIMIT 1`)
        .get(svc.item.id) as { id: number } | undefined;
      if (!room) continue;
      try {
        const res = createBookingTransactional({
          travelerId: user.id,
          propertyId: svc.item.id,
          roomTypeId: room.id,
          checkIn,
          checkOut,
          adults: travelers,
          children: 0,
          units: svc.role === "accommodation" ? Math.max(1, Math.ceil(travelers / 2)) : 1,
          guestName: parsed.data.guestName || user.full_name,
          guestEmail: parsed.data.guestEmail || user.email,
          guestPhone: parsed.data.guestPhone || user.phone || "+212600000000",
          specialRequests: `Part of Multi-Service Trip Plan ${planRef}`,
          currency: "MAD",
        });
        createdBookings.push({
          bookingRef: res.bookingRef,
          title: svc.item.title,
          status: "pending_payment",
          totalMad: res.quote.totalMad,
        });
      } catch {
        // Skip item if unavailable for dates, keep partial list transparent
      }
    }
    planStatus = "requested";
  }

  db.prepare(
    `INSERT INTO itineraries (plan_ref, user_id, city, days_count, travelers, budget_mad, estimated_total_mad, include_car, interests, plan_json, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    planRef,
    user?.id ?? null,
    targetCity,
    days,
    travelers,
    budgetMad,
    estimatedTotalMad,
    parsed.data.includeCar ? 1 : 0,
    parsed.data.interests,
    JSON.stringify(planPayload),
    planStatus
  );

  logAudit(user?.id ?? null, "planner.created", "itinerary", planRef, { city: targetCity, days, estimatedTotalMad, bookedCount: createdBookings.length });

  return NextResponse.json({
    planRef,
    status: planStatus,
    pricingDisclaimer: "Estimates are calculated from live base rates in the MARHABA catalog. Final totals depend on exact dates, room availability, and individual provider confirmation.",
    ...planPayload,
    createdBookings,
  });
}
