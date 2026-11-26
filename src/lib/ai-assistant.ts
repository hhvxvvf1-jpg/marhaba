import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { calculateQuote } from "./booking-engine";
import { formatMoney, type Currency } from "./config";

export interface AssistantQuery {
  message: string;
  lang?: "en" | "fr" | "ar";
  currency?: Currency;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
}

export interface AssistantRecommendation {
  id: number;
  slug: string;
  title: string;
  city: string;
  category: string;
  rating: number;
  base_price_mad: number;
  formatted_price: string;
  quote_total_mad?: number;
  formatted_quote?: string;
  available: boolean;
  image_url: string;
  room_type_id?: number;
  room_name?: string;
}

const CITY_PATTERNS: Array<{ city: string; patterns: string[] }> = [
  { city: "Laâyoune", patterns: ["laayoune", "laâyoune", "el aaiun", "العيون"] },
  { city: "Marrakech", patterns: ["marrakech", "marrakesh", "مراكش", "kech"] },
  { city: "Casablanca", patterns: ["casablanca", "casa", "الدار البيضاء", "kaza"] },
  { city: "Rabat", patterns: ["rabat", "الرباط"] },
  { city: "Fès", patterns: ["fes", "fès", "fez", "فاس"] },
  { city: "Tangier", patterns: ["tangier", "tanger", "طنجة"] },
  { city: "Agadir", patterns: ["agadir", "أكادير"] },
  { city: "Chefchaouen", patterns: ["chefchaouen", "chaouen", "شفشاون", "blue city"] },
  { city: "Essaouira", patterns: ["essaouira", "mogador", "الصويرة"] },
  { city: "Merzouga", patterns: ["merzouga", "sahara", "desert", "erg chebbi", "مرزوكة", "صحراء"] },
  { city: "Ouarzazate", patterns: ["ouarzazate", "ورزازات"] },
  { city: "Dakhla", patterns: ["dakhla", "الداخلة"] },
  { city: "Meknes", patterns: ["meknes", "meknès", "مكناس"] },
];

const CATEGORY_PATTERNS: Array<{ type: string; patterns: string[] }> = [
  { type: "stay", patterns: ["hotel", "riad", "stay", "resort", "villa", "kasbah", "séjour", "hébergement", "فندق", "رياض", "إقامة"] },
  { type: "car", patterns: ["car", "auto", "voiture", "suv", "4x4", "rent", "location", "سيارة", "كراء", "tomobil"] },
  { type: "exp", patterns: ["tour", "experience", "activity", "excursion", "quad", "balloon", "cooking", "تجربة", "جولة", "نشاط"] },
  { type: "food", patterns: ["restaurant", "dining", "food", "dinner", "eat", "مطعم", "عشاء", "أكل"] },
];

function detectLang(msg: string, explicit?: "en" | "fr" | "ar"): "en" | "fr" | "ar" {
  if (/[\u0600-\u06FF]/.test(msg)) return "ar";
  if (/\b(bonjour|salut|hôtel|séjour|chambre|combien|voiture|réserver|merci|pas cher|itinéraire)\b/i.test(msg)) return "fr";
  if (explicit) return explicit;
  return "en";
}

function extractBudgetMad(msg: string): number | null {
  const m = msg.match(/(?:under|below|max|moins de|أقل من|budget|<=?)\s*(\d{3,5})\s*(?:mad|dh|dhs|eur|€|\$)?/i);
  if (m) {
    let val = Number(m[1]);
    if (/eur|€/i.test(m[0])) val *= 10.87;
    if (/\$|usd/i.test(m[0])) val *= 10;
    return Math.round(val);
  }
  return null;
}

function extractDays(msg: string): number {
  const m = msg.match(/(\d+)\s*(?:day|days|night|nights|jour|jours|nuit|nuits|أيام|ليال|ليلة)/i);
  return m ? Math.min(10, Math.max(1, Number(m[1]))) : 3;
}

function firstImage(imagesJson: string): string {
  try {
    const arr = JSON.parse(imagesJson);
    if (Array.isArray(arr) && arr[0]) return String(arr[0]);
  } catch {
    // ignore
  }
  return "/images/hero-morocco.jpg";
}

export function runAssistantQuery(input: AssistantQuery) {
  ensureSeeded();
  const db = getDb();
  const msg = (input.message || "").trim();
  const lower = msg.toLowerCase();
  const lang = detectLang(msg, input.lang);
  const currency: Currency = input.currency || "MAD";

  const matchedCities = CITY_PATTERNS.filter((c) => c.patterns.some((p) => lower.includes(p))).map((c) => c.city);
  const matchedTypes = CATEGORY_PATTERNS.filter((c) => c.patterns.some((p) => lower.includes(p))).map((c) => c.type);
  const maxBudget = extractBudgetMad(msg);

  const isItinerary = /\b(itinerary|plan|trip|schedule|programme|circuit|itinéraire|برنامج|رحلة)\b/i.test(msg);
  const isCompare = /\b(compare|versus|vs|difference|comparer|مقارنة|فرق)\b/i.test(msg);
  const isPromo = /\b(promo|coupon|discount|code|réduction|كود|تخفيض|خصم)\b/i.test(msg);
  const isCheap = /\b(cheap|budget|affordable|rkhiss|pas cher|économique|رخيص|اقتصادي)\b/i.test(msg);
  const isLuxury = /\b(luxury|palace|luxe|vip|5 star|فخم|فاخر)\b/i.test(msg);
  const isFlight = /\b(flight|flights|vol|vols|avion|airline|airport|طيران|رحلة جوية|مطار)\b/i.test(msg);
  const isTransport = /\b(train|oncf|tgv|boraq|bus|ctm|supratours|taxi|transfer|قطار|حافلة|طاكسي)\b/i.test(msg);
  const isEsim = /\b(esim|e-sim|sim|data|internet|roaming|شريحة|إنترنت|انترنت)\b/i.test(msg);
  const isEmergency = /\b(emergency|sos|police|ambulance|hospital|pharmacy|visa|currency|atm|طوارئ|شرطة|إسعاف|فيزا|صرف)\b/i.test(msg);

  let serviceActionUrl: string | undefined;
  let serviceNote = "";
  if (isFlight) {
    serviceActionUrl = "/services?tab=flights";
    serviceNote =
      lang === "ar"
        ? "لطلبات الطيران (أوروبا ↔ المغرب): يمكنك إرسال طلب عرض سعر عبر صفحة الخدمات (/services?tab=flights). لا نعرض مخزوناً حياً لشركات الطيران دون ربط نظام الحجز."
        : lang === "fr"
        ? "Pour les vols (Europe ↔ Maroc) : soumettez une demande de tarif sur /services?tab=flights (nous ne prétendons pas afficher de stock aérien en direct sans API GDS connectée)."
        : "For flights (Europe ↔ Morocco): submit a fare request at /services?tab=flights. Live airline seat inventory is not fabricated without a connected GDS API.";
  } else if (isTransport) {
    serviceActionUrl = "/services?tab=transport";
    serviceNote =
      lang === "ar"
        ? "للقِطارات (ONCF / البراق) والحافلات (CTM / Supratours) والتنقلات: اطلب الحجز عبر /services?tab=transport."
        : lang === "fr"
        ? "Pour les trains ONCF / Al Boraq, bus CTM / Supratours et transferts : faites une demande sur /services?tab=transport."
        : "For ONCF / Al Boraq trains, CTM / Supratours buses, and city transfers, submit a route request on /services?tab=transport.";
  } else if (isEsim) {
    serviceActionUrl = "/services?tab=esim";
    serviceNote =
      lang === "ar"
        ? "باقات eSIM المغرب (1 إلى 20 جيغابايت، 50–320 درهم، يتطلب هاتفاً غير مقفل) متاحة عبر /services?tab=esim."
        : lang === "fr"
        ? "Les forfaits eSIM Maroc (1 à 20 Go, 50–320 MAD, téléphone débloqué requis) sont disponibles sur /services?tab=esim."
        : "Morocco eSIM data plans (1–20 GB, 50–320 MAD, unlocked device required) can be requested at /services?tab=esim.";
  } else if (isEmergency) {
    serviceActionUrl = "/services?tab=guide";
    serviceNote =
      lang === "ar"
        ? "أرقام الطوارئ بالمغرب: الشرطة 19 · الدرك الملكي 177 · الإسعاف والوقاية المدنية 15. التفاصيل الكاملة في دليل السفر (/services?tab=guide)."
        : lang === "fr"
        ? "Numéros d'urgence au Maroc : Police 19 · Gendarmerie Royale 177 · Ambulance & Pompiers 15. Guide complet sur /services?tab=guide."
        : "Morocco Emergency Numbers: Police 19 · Royal Gendarmerie 177 · Ambulance & Fire 15. Full travel guide at /services?tab=guide.";
  }

  const checkIn = input.checkIn || new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10);
  const checkOut = input.checkOut || new Date(Date.now() + 10 * 86400_000).toISOString().slice(0, 10);
  const guests = Math.max(1, Number(input.guests || 2));

  const where: string[] = ["p.status = 'active'"];
  const params: (string | number)[] = [];

  if (matchedCities.length > 0) {
    where.push(`p.city IN (${matchedCities.map(() => "?").join(",")})`);
    params.push(...matchedCities);
  }
  if (matchedTypes.length > 0) {
    where.push(`p.marketplace_type IN (${matchedTypes.map(() => "?").join(",")})`);
    params.push(...matchedTypes);
  }
  if (maxBudget) {
    where.push(`p.base_price_mad <= ?`);
    params.push(maxBudget);
  }

  let orderBy = "p.featured DESC, p.rating_avg DESC, p.review_count DESC";
  if (isCheap) orderBy = "p.base_price_mad ASC, p.rating_avg DESC";
  if (isLuxury) orderBy = "p.base_price_mad DESC, p.rating_avg DESC";

  const rows = db
    .prepare(
      `SELECT p.id, p.slug, p.title, p.city, p.category, p.marketplace_type, p.rating_avg, p.review_count, p.base_price_mad, p.images_json
       FROM properties p
       WHERE ${where.join(" AND ")}
       ORDER BY ${orderBy}
       LIMIT 6`
    )
    .all(...params) as Array<{
    id: number;
    slug: string;
    title: string;
    city: string;
    category: string;
    marketplace_type: string;
    rating_avg: number;
    review_count: number;
    base_price_mad: number;
    images_json: string;
  }>;

  const recommendations: AssistantRecommendation[] = rows.map((row) => {
    const room = db
      .prepare(`SELECT id, name FROM room_types WHERE property_id = ? AND status = 'active' ORDER BY base_price_mad ASC LIMIT 1`)
      .get(row.id) as { id: number; name: string } | undefined;

    let quoteTotal: number | undefined;
    let available = true;
    if (room) {
      const q = calculateQuote({
        propertyId: row.id,
        roomTypeId: room.id,
        checkIn,
        checkOut,
        adults: guests,
        children: 0,
        units: 1,
      });
      available = q.available;
      if (q.available) quoteTotal = q.totalMad;
    }

    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      city: row.city,
      category: row.category,
      rating: row.rating_avg,
      base_price_mad: row.base_price_mad,
      formatted_price: formatMoney(row.base_price_mad, currency),
      quote_total_mad: quoteTotal,
      formatted_quote: quoteTotal ? formatMoney(quoteTotal, currency) : undefined,
      available,
      image_url: firstImage(row.images_json),
      room_type_id: room?.id,
      room_name: room?.name,
    };
  });

  const promos = isPromo
    ? (db
        .prepare(`SELECT code, name, discount_pct, discount_fixed_mad, min_booking_mad FROM promotions WHERE is_active = 1`)
        .all() as Array<{ code: string; name: string; discount_pct: number; discount_fixed_mad: number; min_booking_mad: number }>)
    : [];

  const itinerary: Array<{ day: number; city: string; activity: string; staySuggestion?: string }> = [];
  if (isItinerary) {
    const days = extractDays(msg);
    const targetCity = matchedCities[0] || "Marrakech";
    const cityItems = db
      .prepare(`SELECT title, marketplace_type, base_price_mad FROM properties WHERE status = 'active' AND city = ? ORDER BY rating_avg DESC LIMIT 8`)
      .all(targetCity) as Array<{ title: string; marketplace_type: string; base_price_mad: number }>;

    const stay = cityItems.find((i) => i.marketplace_type === "stay");
    const activities = cityItems.filter((i) => i.marketplace_type !== "stay");

    for (let d = 1; d <= days; d++) {
      const act = activities[(d - 1) % Math.max(1, activities.length)];
      itinerary.push({
        day: d,
        city: targetCity,
        activity: act ? `${act.title} (${formatMoney(act.base_price_mad, currency)})` : `Medina & heritage exploration in ${targetCity}`,
        staySuggestion: stay ? `${stay.title} (${formatMoney(stay.base_price_mad, currency)}/night)` : undefined,
      });
    }
  }

  let reply = "";
  if (lang === "ar") {
    if (isPromo && promos.length) {
      reply = `العروض النشطة حالياً على MARHABA: ${promos.map((p) => `${p.code} (${p.discount_pct ? `${p.discount_pct}%` : `${p.discount_fixed_mad} MAD`})`).join("، ")}.`;
    } else if (recommendations.length > 0) {
      reply = `مرحباً! وجدت لك ${recommendations.length} خيارات متوفرة من قاعدة بيانات MARHABA المباشرة${matchedCities.length ? ` في ${matchedCities.join(" و")}` : ""} للتواريخ ${checkIn} إلى ${checkOut}.`;
      if (isItinerary) reply += ` كما جهزت لك برنامجاً مقترحاً من ${itinerary.length} أيام.`;
      reply += " يمكنك مراجعة التفاصيل وتأكيد الحجز عندما تكون مستعداً (لن يتم إنشاء أي حجز دون موافقتك).";
    } else {
      reply = "لم أجد نتائج مطابقة تماماً لهذه المعايير في قاعدة البيانات الحالية. جرّب توسيع الميزانية أو اختيار مدينة مثل مراكش، الدار البيضاء، فاس أو طنجة.";
    }
  } else if (lang === "fr") {
    if (isPromo && promos.length) {
      reply = `Voici les codes promo actifs sur MARHABA : ${promos.map((p) => `${p.code} (${p.discount_pct ? `-${p.discount_pct}%` : `-${p.discount_fixed_mad} MAD`})`).join(", ")}.`;
    } else if (recommendations.length > 0) {
      reply = `Marhaba ! J'ai trouvé ${recommendations.length} options vérifiées dans le catalogue MARHABA${matchedCities.length ? ` à ${matchedCities.join(", ")}` : ""} du ${checkIn} au ${checkOut} pour ${guests} voyageurs.`;
      if (isCompare && recommendations.length >= 2) {
        reply += ` Comparaison rapide : ${recommendations[0].title} (${recommendations[0].formatted_price}/nuit, note ${recommendations[0].rating}) vs ${recommendations[1].title} (${recommendations[1].formatted_price}/nuit, note ${recommendations[1].rating}).`;
      }
      reply += " Aucune réservation n'est créée sans votre confirmation explicite.";
    } else {
      reply = "Je n'ai trouvé aucune offre correspondant exactement à ces critères. Essayez d'ajuster le budget ou la ville (Marrakech, Casablanca, Tanger, Fès, Essaouira).";
    }
  } else {
    if (isPromo && promos.length) {
      reply = `Active MARHABA promo codes in our live catalog: ${promos.map((p) => `${p.code} (${p.discount_pct ? `${p.discount_pct}% off` : `${p.discount_fixed_mad} MAD off`})`).join(", ")}.`;
    } else if (recommendations.length > 0) {
      reply = `Marhaba! Based on real-time MARHABA inventory and pricing for ${checkIn} → ${checkOut} (${guests} guests), I found ${recommendations.length} verified option(s)${matchedCities.length ? ` in ${matchedCities.join(", ")}` : ""}.`;
      if (isCompare && recommendations.length >= 2) {
        reply += ` Comparison: ${recommendations[0].title} (${recommendations[0].formatted_price}/night, ★${recommendations[0].rating}) vs ${recommendations[1].title} (${recommendations[1].formatted_price}/night, ★${recommendations[1].rating}).`;
      }
      if (isItinerary) {
        reply += ` I also drafted a ${itinerary.length}-day itinerary grounded in verified local listings.`;
      }
      reply += " Review any option below—no booking or payment is created until you confirm on checkout.";
    } else {
      reply = "I didn't find an exact match in our live database for those constraints. Try adjusting your budget or asking about Marrakech, Casablanca, Fes, Tangier, Chefchaouen, Essaouira, or Merzouga.";
    }
  }

  if (serviceNote) {
    reply = `${serviceNote}${recommendations.length > 0 ? `\n\n${reply}` : ""}`;
  }

  return {
    lang,
    currency,
    checkIn,
    checkOut,
    guests,
    reply,
    recommendations,
    itinerary,
    promos,
    serviceActionUrl,
    requiresConfirmationForActions: true,
    groundedInLiveDb: true,
  };
}
