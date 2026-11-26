import crypto from "crypto";
import { getDb } from "./index";
import { hashPassword } from "@/lib/auth";
import { seedTransportOffersIfEmpty } from "@/lib/transport-offers";

const CITY_META: Record<
  string,
  {
    slug: string;
    fr: string;
    ar: string;
    region: string;
    lat: number;
    lng: number;
    img: string;
    summary: string;
    summaryFr: string;
    summaryAr: string;
  }
> = {
  Marrakech: {
    slug: "marrakech",
    fr: "Marrakech",
    ar: "مراكش",
    region: "Marrakech-Safi",
    lat: 31.6295,
    lng: -7.9811,
    img: "/images/listings/3.jpg",
    summary: "Historic imperial city of lantern-lit riads, vibrant souks, and Atlas Mountain retreats.",
    summaryFr: "Ville impériale historique de riads authentiques, souks animés et retraites face à l'Atlas.",
    summaryAr: "المدينة الحمراء الساحرة برياضاتها التاريخية وأسواقها العريقة وإطلالاتها على جبال الأطلس.",
  },
  Casablanca: {
    slug: "casablanca",
    fr: "Casablanca",
    ar: "الدار البيضاء",
    region: "Casablanca-Settat",
    lat: 33.5731,
    lng: -7.5898,
    img: "/images/listings/6.jpg",
    summary: "Morocco's cosmopolitan Atlantic hub blending Art Deco boulevards, business hotels, and coastal dining.",
    summaryFr: "Métropole atlantique cosmopolite mêlant architecture Art Déco, hôtels d'affaires et corniche animée.",
    summaryAr: "القلب الاقتصادي النابض على المحيط الأطلسي بفنادقها العصرية وكورنيشها البحري.",
  },
  Dakhla: {
    slug: "dakhla",
    fr: "Dakhla",
    ar: "الداخلة",
    region: "Dakhla-Oued Ed-Dahab",
    lat: 23.6848,
    lng: -15.9579,
    img: "/images/listings/4.jpg",
    summary: "Turquoise Sahara lagoon paradise renowned worldwide for kitesurfing, eco-villas, and fresh oysters.",
    summaryFr: "Paradis lagunaire entre désert et océan, mondialement reconnu pour le kitesurf et ses villas côtières.",
    summaryAr: "جوهرة الجنوب المغربي حيث تلتقي الصحراء بالبحيرة الفيروزية والرياضات المائية.",
  },
  "Laâyoune": {
    slug: "laayoune",
    fr: "Laâyoune",
    ar: "العيون",
    region: "Laâyoune-Sakia El Hamra",
    lat: 27.1253,
    lng: -13.1625,
    img: "/images/listings/hotel-laayoune.jpg",
    summary: "Gateway to Morocco's Atlantic Sahara offering warm Sahrawi hospitality, dunes, and coastal escapes.",
    summaryFr: "Porte du Sahara atlantique offrant hospitalité sahraouie, dunes dorées et séjours urbains.",
    summaryAr: "بوابة الصحراء الأطلسية بكرم ضيافتها الأصيل وكثبانها الذهبية.",
  },
  Agadir: {
    slug: "agadir",
    fr: "Agadir",
    ar: "أكادير",
    region: "Souss-Massa",
    lat: 30.4278,
    lng: -9.5981,
    img: "/images/listings/resort-agadir.jpg",
    summary: "Sun-drenched Atlantic bay with 300 sunny days a year, resort promenades, and Taghazout surf beaches.",
    summaryFr: "Baie atlantique ensoleillée toute l'année, resorts balnéaires et plages de surf à Taghazout.",
    summaryAr: "خليج الشمس الدائم بشواطئه الممتدة ومنتجعاته البحرية ومنطقة تغازوت.",
  },
  Essaouira: {
    slug: "essaouira",
    fr: "Essaouira",
    ar: "الصويرة",
    region: "Marrakech-Safi",
    lat: 31.5085,
    lng: -9.7595,
    img: "/images/destinations/essaouira.jpg",
    summary: "UNESCO-listed 18th-century fortified port town famed for sea-view guest houses and Atlantic breezes.",
    summaryFr: "Cité portuaire classée UNESCO réputée pour ses remparts, ses maisons d'hôtes et son port de pêche.",
    summaryAr: "مدينة الرياح والأسوار التاريخية المطلة على المحيط الأطلسي.",
  },
  "Fès": {
    slug: "fes",
    fr: "Fès",
    ar: "فاس",
    region: "Fès-Meknès",
    lat: 34.0331,
    lng: -5.0003,
    img: "/images/listings/stay-riad-fes.jpg",
    summary: "Spiritual and artisanal capital home to the world's oldest university and palatial medina riads.",
    summaryFr: "Capitale spirituelle et artisanale abritant la plus ancienne université du monde et des riads palatiaux.",
    summaryAr: "العاصمة العلمية والروحية بمدينتها العتيقة ورياضاتها الأندلسية العريقة.",
  },
  Chefchaouen: {
    slug: "chefchaouen",
    fr: "Chefchaouen",
    ar: "شفشاون",
    region: "Tanger-Tétouan-Al Hoceïma",
    lat: 35.1688,
    lng: -5.2636,
    img: "/images/listings/21.jpg",
    summary: "The iconic Blue Pearl nestled in the Rif Mountains with serene rooftop riads and mountain trails.",
    summaryFr: "La Perle Bleue nichée dans le Rif, célèbre pour ses ruelles azur et ses terrasses panoramiques.",
    summaryAr: "الجوهرة الزرقاء في قلب جبال الريف بأزقتها الساحرة ورياضاتها الهادئة.",
  },
  Merzouga: {
    slug: "merzouga",
    fr: "Merzouga",
    ar: "مرزوكة",
    region: "Drâa-Tafilalet",
    lat: 31.0999,
    lng: -4.0127,
    img: "/images/listings/42.jpg",
    summary: "Towering golden dunes of Erg Chebbi with luxury desert bivouacs, stargazing, and kasbah stays.",
    summaryFr: "Dunes majestueuses de l'Erg Chebbi avec bivouacs de luxe, nuits étoilées et kasbahs authentiques.",
    summaryAr: "كثبان عرق الشبي الذهبية ومخيمات الصحراء الفاخرة تحت سماء مرصعة بالنجوم.",
  },
  Ouarzazate: {
    slug: "ouarzazate",
    fr: "Ouarzazate",
    ar: "ورزازات",
    region: "Drâa-Tafilalet",
    lat: 30.9189,
    lng: -6.8934,
    img: "/images/destinations/ouarzazate.jpg",
    summary: "Cinema capital and Valley of Kasbahs, gateway to Aït Ben Haddou and High Atlas passes.",
    summaryFr: "Capitale du cinéma et vallée des Kasbahs, porte d'Aït Ben Haddou et du Haut Atlas.",
    summaryAr: "هوليود إفريقيا وبوابة القصبات التاريخية ووادي درعة.",
  },
  Rabat: {
    slug: "rabat",
    fr: "Rabat",
    ar: "الرباط",
    region: "Rabat-Salé-Kénitra",
    lat: 34.0209,
    lng: -6.8416,
    img: "/images/destinations/rabat.jpg",
    summary: "Elegant royal capital blending Kasbah of the Udayas, oceanfront promenades, and refined riads.",
    summaryFr: "Capitale royale élégante mêlant Kasbah des Oudayas, jardins andalous et front de mer.",
    summaryAr: "العاصمة الأنيقة بقصبة الأوداية وحدائقها الملكية وإطلالتها المحيطية.",
  },
  Tanger: {
    slug: "tanger",
    fr: "Tanger",
    ar: "طنجة",
    region: "Tanger-Tétouan-Al Hoceïma",
    lat: 35.7595,
    lng: -5.834,
    img: "/images/destinations/tanger.jpg",
    summary: "Mediterranean and Atlantic crossroads overlooking the Strait of Gibraltar with historic medina charm.",
    summaryFr: "Carrefour entre Méditerranée et Atlantique face au détroit de Gibraltar.",
    summaryAr: "عروس الشمال المطلة على مضيق جبل طارق وملتقى البحرين.",
  },
};

const LEGACY_LISTINGS: Array<[number, "stay" | "car" | "food" | "exp", string, string, number, string, string]> = [
  [1, "stay", "Appartement familial marocain", "Laâyoune", 350, "night", "Wifi · Famille"],
  [2, "stay", "Résidence Al Mahaj – Studio", "Laâyoune", 500, "night", "Clim · Centre"],
  [3, "stay", "Riad Médina Jasmin", "Marrakech", 900, "night", "Piscine · Petit-déj"],
  [4, "stay", "Villa face à la mer", "Dakhla", 1200, "night", "Vue mer · Kitesurf"],
  [5, "stay", "Studio Marina", "Agadir", 450, "night", "Plage à 5 min"],
  [6, "stay", "Loft Maarif", "Casablanca", 600, "night", "Wifi · Moderne"],
  [7, "car", "Dacia Logan 2026", "Laâyoune", 250, "day", "Manuelle · Essence"],
  [8, "car", "Hyundai Accent 2026", "Laâyoune", 350, "day", "Automatique · Livraison"],
  [9, "car", "Citroën C4 2026", "Laâyoune", 450, "day", "Automatique · Essence"],
  [10, "car", "Volkswagen Touareg 2023", "Laâyoune", 1000, "day", "Automatique · Diesel"],
  [11, "car", "Dacia Sandero", "Marrakech", 300, "day", "Manuelle · Diesel"],
  [12, "car", "Renault Clio 5", "Agadir", 320, "day", "Manuelle · Essence"],
  [13, "food", "Grillades Bismillah", "Laâyoune", 25, "plat", "Grill · Poulet"],
  [14, "food", "Pâtisserie Al Jazeera", "Laâyoune", 35, "plat", "Pâtisserie · Petit-déj"],
  [15, "food", "Tajine chez Hajja", "Marrakech", 60, "plat", "Tajine · Traditionnel"],
  [16, "food", "Poisson frais Dakhla", "Dakhla", 70, "plat", "Fruits de mer"],
  [17, "exp", "Camping Hayam – tente désert", "Laâyoune", 300, "tente", "Désert · Nuit"],
  [18, "exp", "Aventure authentique au Sahara", "Laâyoune", 650, "pers", "11h · Guide"],
  [19, "exp", "Kitesurf à Dakhla", "Dakhla", 500, "pers", "Cours · Matériel"],
  [20, "exp", "Surf & yoga à Taghazout", "Agadir", 350, "pers", "Débutants OK"],
  [21, "stay", "Riad bleu face aux montagnes", "Chefchaouen", 550, "night", "Terrasse · Petit-déj"],
  [22, "stay", "Maison d’hôtes des remparts", "Essaouira", 480, "night", "Vue mer · Wifi"],
  [23, "stay", "Riad Fès el-Bali", "Fès", 700, "night", "Patio · Petit-déj"],
  [24, "car", "Dacia Duster 4x4", "Dakhla", 500, "day", "Manuelle · Diesel"],
  [25, "car", "Peugeot 208 2026", "Casablanca", 380, "day", "Automatique · Livraison"],
  [26, "car", "Kia Picanto", "Essaouira", 260, "day", "Manuelle · Essence"],
  [27, "food", "Pastilla chez Lalla", "Fès", 55, "plat", "Traditionnel · Pastilla"],
  [28, "food", "Poisson grillé du port", "Essaouira", 65, "plat", "Fruits de mer · Port"],
  [29, "food", "Brunch de la Corniche", "Casablanca", 85, "plat", "Brunch · Vue mer"],
  [30, "car", "Pick-up électrique noir mat", "Agadir", 2800, "day", "Automatique · Électrique"],
  [31, "car", "Mercedes Classe G noir mat", "Casablanca", 3500, "day", "Automatique · Essence"],
  [32, "car", "Lamborghini Urus", "Marrakech", 4500, "day", "Automatique · Livraison"],
  [33, "car", "Buggy Polaris RZR", "Dakhla", 1200, "day", "Désert · 2 places"],
  [34, "car", "Tesla Model 3 noir mat", "Casablanca", 900, "day", "Automatique · Électrique"],
  [35, "car", "Mercedes AMG C63", "Marrakech", 1600, "day", "Automatique · Essence"],
  [36, "car", "Range Rover noir mat", "Casablanca", 1800, "day", "Automatique · Diesel"],
  [37, "stay", "Hôtel Prestige Hivernage", "Marrakech", 1100, "night", "Petit-déj · Centre"],
  [38, "stay", "Hôtel Le Palace Casablanca", "Casablanca", 1400, "night", "Spa · Petit-déj"],
  [39, "stay", "Hôtel Sahara Centre-Ville", "Laâyoune", 650, "night", "Clim · Centre"],
  [40, "stay", "Resort Baie d'Agadir & Spa", "Agadir", 1300, "night", "Front de mer · Piscine"],
  [41, "stay", "Hôtel Business & Congrès", "Fès", 800, "night", "Parking · Wifi"],
  [42, "stay", "Kasbah du désert", "Merzouga", 750, "night", "Dunes · Petit-déj"],
  [43, "exp", "Nuit en bivouac & dromadaires", "Merzouga", 550, "pers", "Dunes · Dîner"],
  [44, "car", "Toyota Land Cruiser 4x4", "Ouarzazate", 900, "day", "Automatique · Diesel"],
  [45, "stay", "Riad Kasbah Aït Ben Haddou", "Ouarzazate", 600, "night", "Terrasse · Petit-déj"],
  [46, "exp", "Visite des studios & kasbahs", "Ouarzazate", 250, "pers", "Guide · 4h"],
  [47, "stay", "Riad des Oudayas", "Rabat", 650, "night", "Vue océan · Wifi"],
  [48, "food", "Café maure & thé à la menthe", "Rabat", 20, "plat", "Traditionnel · Terrasse"],
  [49, "car", "Renault Mégane 2026", "Rabat", 340, "day", "Automatique · Livraison"],
  [50, "stay", "Appartement vue détroit", "Tanger", 520, "night", "Vue mer · Wifi"],
  [51, "food", "Couscous du vendredi", "Tanger", 45, "plat", "Couscous · Traditionnel"],
  [52, "exp", "Cascades d’Ouzoud en journée", "Marrakech", 400, "pers", "Guide · Journée"],
  [53, "exp", "Cours de cuisine marocaine", "Marrakech", 380, "pers", "Atelier · Marché"],
  [54, "exp", "Hammam & massage traditionnel", "Fès", 300, "pers", "Détente · 2h"],
  [55, "food", "Tanjia marrakchie", "Marrakech", 70, "plat", "Traditionnel · Viande"],
  [56, "stay", "Villa Palmeraie Piscine Privée", "Marrakech", 2200, "night", "Piscine privée · Jardin"],
  [57, "stay", "Villa Cap Spartel Vue Océan", "Tanger", 1850, "night", "Vue océan · Terrasse"],
  [58, "stay", "Villa Arganier & Piscine Chauffée", "Essaouira", 1450, "night", "Piscine chauffée · Calme"],
  [59, "stay", "Resort Oasis de la Palmeraie", "Marrakech", 1950, "night", "Spa · Piscine · Jardin"],
  [60, "stay", "Taghazout Surf & Thalasso Resort", "Agadir", 1650, "night", "Front de mer · Thalasso"],
  [61, "stay", "Dakhla Lagoon Eco-Resort & Spa", "Dakhla", 1500, "night", "Lagune · Kitesurf · Spa"],
];

function slugify(input: string, id: number): string {
  const base = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${base}-${id}`;
}

function inferCategory(t: "stay" | "car" | "food" | "exp", name: string) {
  if (t === "car") return "car";
  if (t === "food") return "restaurant";
  if (t === "exp") return "experience";
  const lower = name.toLowerCase();
  if (lower.includes("resort")) return "resort";
  if (lower.includes("riad") || lower.includes("kasbah")) return "riad";
  if (lower.includes("villa")) return "villa";
  if (lower.includes("appartement") || lower.includes("studio") || lower.includes("loft") || lower.includes("résidence")) return "apartment";
  if (lower.includes("maison")) return "guesthouse";
  return "hotel";
}

const EXACT_LISTING_IMAGES: Record<number, string[]> = {
  1: ["/images/listings/apt-laayoune-family.jpg", "/images/listings/room-suite.jpg"],
  2: ["/images/listings/apt-laayoune-studio.jpg", "/images/listings/apt-laayoune-family.jpg"],
  3: ["/images/listings/3.jpg", "/images/listings/room-suite.jpg"],
  4: ["/images/listings/4.jpg", "/images/listings/stay-marina.jpg"],
  5: ["/images/listings/stay-marina.jpg", "/images/listings/apt-laayoune-studio.jpg"],
  6: ["/images/listings/6.jpg", "/images/listings/apt-tanger-strait.jpg"],
  7: ["/images/listings/car-sedan.jpg"],
  8: ["/images/listings/car-sedan.jpg"],
  9: ["/images/listings/car-hatchback.jpg"],
  10: ["/images/listings/car-4x4.jpg"],
  11: ["/images/listings/car-hatchback.jpg"],
  12: ["/images/listings/car-hatchback.jpg"],
  13: ["/images/listings/food-grill.jpg"],
  14: ["/images/listings/food-pastry.jpg"],
  15: ["/images/listings/food-tajine.jpg"],
  16: ["/images/listings/food-seafood.jpg"],
  17: ["/images/listings/43.jpg", "/images/listings/42.jpg"],
  18: ["/images/listings/42.jpg", "/images/listings/43.jpg"],
  19: ["/images/listings/exp-kitesurf.jpg", "/images/listings/4.jpg"],
  20: ["/images/listings/exp-surf-yoga.jpg"],
  21: ["/images/listings/21.jpg", "/images/listings/room-suite.jpg"],
  22: ["/images/listings/riad-essaouira.jpg", "/images/listings/room-suite.jpg"],
  23: ["/images/listings/stay-riad-fes.jpg", "/images/listings/room-suite.jpg"],
  24: ["/images/listings/car-4x4.jpg"],
  25: ["/images/listings/car-hatchback.jpg"],
  26: ["/images/listings/car-hatchback.jpg"],
  27: ["/images/listings/food-pastilla.jpg"],
  28: ["/images/listings/food-seafood.jpg"],
  29: ["/images/listings/food-tea-brunch.jpg"],
  30: ["/images/listings/30.jpg"],
  31: ["/images/listings/31.jpg"],
  32: ["/images/listings/32.jpg"],
  33: ["/images/listings/33.jpg"],
  34: ["/images/listings/34.jpg"],
  35: ["/images/listings/35.jpg"],
  36: ["/images/listings/36.jpg"],
  37: ["/images/listings/hotel-marrakech.jpg", "/images/listings/room-suite.jpg"],
  38: ["/images/listings/hotel-casablanca.jpg", "/images/listings/room-suite.jpg"],
  39: ["/images/listings/hotel-laayoune.jpg", "/images/listings/room-suite.jpg"],
  40: ["/images/listings/resort-agadir.jpg", "/images/listings/stay-marina.jpg"],
  41: ["/images/listings/hotel-fes.jpg", "/images/listings/room-suite.jpg"],
  42: ["/images/listings/42.jpg", "/images/listings/room-suite.jpg"],
  43: ["/images/listings/43.jpg", "/images/listings/42.jpg"],
  44: ["/images/listings/car-4x4.jpg"],
  45: ["/images/listings/riad-ouarzazate.jpg", "/images/listings/room-suite.jpg"],
  46: ["/images/listings/exp-kasbah-studios.jpg"],
  47: ["/images/listings/riad-rabat.jpg", "/images/listings/stay-riad-fes.jpg"],
  48: ["/images/listings/food-tea-brunch.jpg"],
  49: ["/images/listings/car-sedan.jpg"],
  50: ["/images/listings/apt-tanger-strait.jpg", "/images/listings/apt-laayoune-studio.jpg"],
  51: ["/images/listings/food-tajine.jpg"],
  52: ["/images/listings/exp-ouzoud.jpg"],
  53: ["/images/listings/exp-cooking.jpg"],
  54: ["/images/listings/exp-hammam.jpg"],
  55: ["/images/listings/food-tajine.jpg"],
  56: ["/images/listings/villa-marrakech.webp", "/images/listings/room-suite.jpg"],
  57: ["/images/listings/villa-tanger.jpg", "/images/listings/apt-tanger-strait.jpg"],
  58: ["/images/listings/villa-essaouira.jpg", "/images/listings/riad-essaouira.jpg"],
  59: ["/images/listings/resort-marrakech.jpg", "/images/listings/hotel-marrakech.jpg"],
  60: ["/images/listings/resort-taghazout.jpg", "/images/listings/exp-surf-yoga.jpg"],
  61: ["/images/listings/resort-dakhla.jpg", "/images/listings/4.jpg"],
};

const STAY_ARABIC_TITLES: Record<number, string> = {
  1: "شقة عائلية مغربية — العيون",
  2: "إقامة المحج – استوديو عصري — العيون",
  3: "رياض ياسمين المدينة — مراكش",
  4: "فيلا مطلة على البحر — الداخلة",
  5: "استوديو مارينا — أكادير",
  6: "لوفت المعاريف العصري — الدار البيضاء",
  21: "رياض أزرق مطل على الجبال — شفشاون",
  22: "دار ضيافة الأسوار المطلة على المحيط — الصويرة",
  23: "رياض فاس البالي التاريخي — فاس",
  37: "فندق بريستيج الحي الشتوي — مراكش",
  38: "فندق القصر 5 نجوم — الدار البيضاء",
  39: "فندق الصحراء وسط المدينة — العيون",
  40: "منتجع خليج أكادير والسبا — أكادير",
  41: "فندق الأعمال والمؤتمرات — فاس",
  42: "قصبة الصحراء الذهبية — مرزوكة",
  45: "رياض قصبة آيت بن حدو — ورزازات",
  47: "رياض الأوداية الساحلي — الرباط",
  50: "شقة مطلة على مضيق جبل طارق — طنجة",
  56: "فيلا النخيل بمسبح خاص — مراكش",
  57: "فيلا كاب سبارطيل بإطلالة محيطية — طنجة",
  58: "فيلا شجرة الأركان بمسبح مدفأ — الصويرة",
  59: "منتجع واحة النخيل والسبا — مراكش",
  60: "منتجع تغازوت للسورف والثلاسو — أكادير",
  61: "منتجع بحيرة الداخلة البيئي والسبا — الداخلة",
};

function getPropertyImages(id: number, t: string): string[] {
  if (EXACT_LISTING_IMAGES[id]) return EXACT_LISTING_IMAGES[id];
  if (t === "stay") return ["/images/listings/apt-laayoune-family.jpg", "/images/listings/room-suite.jpg"];
  if (t === "car") return ["/images/listings/car-sedan.jpg"];
  if (t === "exp") return ["/images/listings/exp-ouzoud.jpg"];
  return ["/images/listings/food-tajine.jpg"];
}

function syncStayCatalogAndImages(db: ReturnType<typeof getDb>) {
  const marker = db.prepare(`SELECT 1 FROM cms_blocks WHERE key = 'stay_catalog_v2_synced'`).get();
  if (marker) return;

  const partnerRows = db.prepare(`SELECT id FROM partners ORDER BY id ASC LIMIT 2`).all() as Array<{ id: number }>;
  const partner1Id = partnerRows[0]?.id;
  const partner2Id = partnerRows[1]?.id ?? partner1Id;
  if (!partner1Id) return;

  const updateProp = db.prepare(
    `UPDATE properties
     SET title = ?, title_fr = ?, title_ar = ?, category = ?, images_json = ?, featured = ?
     WHERE legacy_id = ?`
  );

  const insertProp = db.prepare(
    `INSERT INTO properties (
      legacy_id, partner_id, slug, title, title_fr, title_ar, category, marketplace_type,
      city, region, country, address, latitude, longitude, star_rating,
      description, description_fr, description_ar, amenities_json, images_json,
      cancellation_policy, base_price_mad, unit_type, verified, status, featured,
      instant_book, rating_avg, review_count, nearby_attractions_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'stay', ?, ?, 'Morocco', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'active', ?, 1, ?, ?, ?)`
  );

  const insertRoom = db.prepare(
    `INSERT INTO room_types (
      property_id, name, name_fr, name_ar, description,
      max_adults, max_children, extra_beds, extra_bed_price_mad,
      total_units, base_price_mad, weekend_price_mad, amenities_json, images_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const featuredIds = new Set([3, 4, 6, 21, 37, 38, 40, 42, 56, 59]);

  for (const [legacyId, mType, name, city, price, unit, tags] of LEGACY_LISTINGS) {
    if (mType !== "stay") continue;
    const cityInfo = CITY_META[city] || CITY_META.Marrakech;
    const category = inferCategory(mType, name);
    const images = getPropertyImages(legacyId, mType);
    const titleAr = STAY_ARABIC_TITLES[legacyId] || `${name} — ${cityInfo.ar}`;
    const isFeatured = featuredIds.has(legacyId) ? 1 : 0;

    const existing = db.prepare(`SELECT id FROM properties WHERE legacy_id = ?`).get(legacyId) as { id: number } | undefined;
    if (existing) {
      updateProp.run(name, name, titleAr, category, JSON.stringify(images), isFeatured, legacyId);
      // Also refresh default room_type cover image so gallery matches
      db.prepare(`UPDATE room_types SET images_json = ? WHERE property_id = ? AND name = 'Standard Deluxe Room'`).run(
        JSON.stringify([images[0], "/images/listings/room-suite.jpg"]),
        existing.id
      );
    } else {
      const partnerId = legacyId % 2 === 1 ? partner1Id : partner2Id;
      const slug = slugify(name, legacyId);
      const rawTags = tags.split("·").map((s) => s.trim()).filter(Boolean);
      const baseAmenities = [...new Set([...rawTags, "Wi-Fi", "Air conditioning", "24/7 Reception"])];
      const starRating = price >= 1100 ? 5 : price >= 550 ? 4 : 3;
      const cancellationPolicy = price >= 1200 ? "moderate" : "flexible";
      const jitterLat = cityInfo.lat + ((legacyId % 7) - 3) * 0.004;
      const jitterLng = cityInfo.lng + ((legacyId % 5) - 2) * 0.004;

      const propId = Number(
        insertProp.run(
          legacyId,
          partnerId,
          slug,
          name,
          name,
          titleAr,
          category,
          city,
          cityInfo.region,
          `${city} Center, ${cityInfo.region}`,
          jitterLat,
          jitterLng,
          starRating,
          `Verified ${category} in ${city}, ${cityInfo.region}. Curated Moroccan hospitality featuring ${baseAmenities.join(", ")}.`,
          `${category.toUpperCase()} vérifié à ${city} (${cityInfo.region}). Hospitalité marocaine authentique avec ${baseAmenities.join(", ")}.`,
          `عرض موثق في ${cityInfo.ar} مع خدمات عالية الجودة وتأكيد فوري عبر منصة مرحبا.`,
          JSON.stringify(baseAmenities),
          JSON.stringify(images),
          cancellationPolicy,
          price,
          unit,
          isFeatured,
          4.8,
          12 + (legacyId % 19),
          JSON.stringify([`${city} Historic Medina / Center`, `${city} Airport Transfer Zone`, "Local Culinary Quarter"])
        ).lastInsertRowid
      );

      insertRoom.run(
        propId,
        "Standard Deluxe Room",
        "Chambre Deluxe Standard",
        "غرفة ديلوكس قياسية",
        "Comfortable Moroccan-crafted room with private en-suite bathroom and high-speed Wi-Fi.",
        4,
        2,
        1,
        150,
        4,
        price,
        Math.round(price * 1.15),
        JSON.stringify(["Wi-Fi", "Air conditioning", "En-suite bath", "Safe"]),
        JSON.stringify([images[0], "/images/listings/room-suite.jpg"])
      );
      insertRoom.run(
        propId,
        "Royal Suite & Terrace",
        "Suite Royale avec Terrasse",
        "جناح ملكي مع شرفة",
        "Spacious signature suite with lounge seating, artisan zellige finish, and private terrace.",
        6,
        2,
        1,
        200,
        2,
        Math.round(price * 1.45),
        Math.round(price * 1.65),
        JSON.stringify(["Wi-Fi", "Air conditioning", "Private terrace", "Breakfast included"]),
        JSON.stringify(["/images/listings/room-suite.jpg", images[0]])
      );
    }
  }

  // Update Laâyoune & Agadir destination hero thumbnails to replace legacy stock photos
  db.prepare(`UPDATE destinations SET image_url = '/images/listings/hotel-laayoune.jpg' WHERE slug = 'laayoune'`).run();
  db.prepare(`UPDATE destinations SET image_url = '/images/listings/resort-agadir.jpg' WHERE slug = 'agadir'`).run();

  db.prepare(
    `INSERT OR REPLACE INTO cms_blocks (key, title, title_fr, title_ar, content_json, is_active)
     VALUES ('stay_catalog_v2_synced', 'Stay Catalog v2 Synced', 'Catalogue Séjours v2 Synchronisé', 'مزامنة تصنيفات الإقامات', '{"version":2}', 0)`
  ).run();
}

export function ensureSeeded() {
  const db = getDb();
  seedTransportOffersIfEmpty(db);
  const countRow = db.prepare(`SELECT COUNT(*) AS cnt FROM properties`).get() as { cnt: number };
  if (countRow.cnt > 0) {
    syncStayCatalogAndImages(db);
    return;
  }

  const insertUser = db.prepare(
    `INSERT INTO users (email, password_hash, full_name, phone, role, status, email_verified, preferred_lang, preferred_currency, loyalty_points, referral_code)
     VALUES (?, ?, ?, ?, ?, 'active', 1, ?, ?, ?, ?)`
  );

  const adminId = Number(
    insertUser.run(
      "admin@marhaba.ma",
      hashPassword("MarhabaAdmin2026!"),
      "Salma Bennani (Super Admin)",
      "+212 522 00 11 22",
      "super_admin",
      "fr",
      "MAD",
      2500,
      "MRH-ADMIN"
    ).lastInsertRowid
  );

  const partnerUserId = Number(
    insertUser.run(
      "partner@marhaba.ma",
      hashPassword("MarhabaPartner2026!"),
      "Youssef El Fassi",
      "+212 661 22 33 44",
      "partner_owner",
      "fr",
      "MAD",
      400,
      "MRH-PARTNER"
    ).lastInsertRowid
  );

  const partner2UserId = Number(
    insertUser.run(
      "atlas.hospitality@marhaba.ma",
      hashPassword("MarhabaPartner2026!"),
      "Nadia Chraibi",
      "+212 662 44 55 66",
      "partner_owner",
      "en",
      "MAD",
      150,
      "MRH-ATLAS"
    ).lastInsertRowid
  );

  const travelerId = Number(
    insertUser.run(
      "traveler@marhaba.ma",
      hashPassword("MarhabaTraveler2026!"),
      "Karim Tazi",
      "+212 663 77 88 99",
      "traveler",
      "en",
      "MAD",
      820,
      "KARIM2026"
    ).lastInsertRowid
  );

  const affiliateUserId = Number(
    insertUser.run(
      "affiliate@marhaba.ma",
      hashPassword("MarhabaAffiliate2026!"),
      "Amine Kettani",
      "+212 664 11 22 33",
      "affiliate",
      "fr",
      "EUR",
      300,
      "AMINE-AF"
    ).lastInsertRowid
  );

  // Partners
  const insertPartner = db.prepare(
    `INSERT INTO partners (user_id, business_name, legal_type, tax_id, ice_number, contact_email, contact_phone, city, address, bank_name, rib_iban, payout_schedule, verification_status, documents_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'monthly', 'verified', ?)`
  );

  const partner1Id = Number(
    insertPartner.run(
      partnerUserId,
      "Marhaba Riads & Collections SARL",
      "SARL",
      "IF-44901234",
      "002918273000045",
      "partner@marhaba.ma",
      "+212 661 22 33 44",
      "Marrakech",
      "18 Derb Sidi Ahmed Soussi, Médina, Marrakech",
      "Attijariwafa Bank",
      "MA64 0078 1000 0456 7890 1234 56",
      JSON.stringify([
        { name: "Registre de Commerce", status: "verified" },
        { name: "Autorisation Touristique", status: "verified" },
      ])
    ).lastInsertRowid
  );

  const partner2Id = Number(
    insertPartner.run(
      partner2UserId,
      "Atlantic & Sahara Mobility Group",
      "SA",
      "IF-88201944",
      "001829304000012",
      "atlas.hospitality@marhaba.ma",
      "+212 662 44 55 66",
      "Casablanca",
      "Boulevard d'Anfa 142, Casablanca",
      "Bank of Africa",
      "MA64 0117 8000 0123 4567 8901 22",
      JSON.stringify([{ name: "Licence Agence & Flotte", status: "verified" }])
    ).lastInsertRowid
  );

  // Destinations
  const insertDest = db.prepare(
    `INSERT INTO destinations (slug, name, name_fr, name_ar, region, country, summary, summary_fr, summary_ar, seo_title, seo_description, image_url, latitude, longitude, trending, featured_order)
     VALUES (?, ?, ?, ?, ?, 'Morocco', ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
  );

  let order = 1;
  for (const [name, meta] of Object.entries(CITY_META)) {
    insertDest.run(
      meta.slug,
      name,
      meta.fr,
      meta.ar,
      meta.region,
      meta.summary,
      meta.summaryFr,
      meta.summaryAr,
      `Hotels, Riads & Stays in ${name} | MARHABA`,
      meta.summary,
      meta.img,
      meta.lat,
      meta.lng,
      order++
    );
  }

  // Properties & Room Types
  const insertProp = db.prepare(
    `INSERT INTO properties (
      legacy_id, partner_id, slug, title, title_fr, title_ar, category, marketplace_type,
      city, region, country, address, latitude, longitude, star_rating,
      description, description_fr, description_ar, amenities_json, images_json,
      cancellation_policy, base_price_mad, unit_type, verified, status, featured,
      instant_book, rating_avg, review_count, nearby_attractions_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Morocco', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'active', ?, 1, ?, ?, ?)`
  );

  const insertRoom = db.prepare(
    `INSERT INTO room_types (
      property_id, name, name_fr, name_ar, description,
      max_adults, max_children, extra_beds, extra_bed_price_mad,
      total_units, base_price_mad, weekend_price_mad, amenities_json, images_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const propertyIdByLegacy = new Map<number, number>();
  const roomIdByLegacy = new Map<number, number>();

  for (const [legacyId, mType, name, city, price, unit, tags] of LEGACY_LISTINGS) {
    const cityInfo = CITY_META[city] || CITY_META.Marrakech;
    const category = inferCategory(mType, name);
    const partnerId = legacyId % 2 === 1 ? partner1Id : partner2Id;
    const slug = slugify(name, legacyId);
    const rawTags = tags.split("·").map((s) => s.trim()).filter(Boolean);
    const baseAmenities =
      mType === "stay"
        ? [...rawTags, "Wi-Fi", "Air conditioning", "24/7 Reception"]
        : rawTags;
    const images = getPropertyImages(legacyId, mType);
    const featured = [3, 4, 6, 21, 37, 38, 40, 42, 43, 32, 34, 56, 59].includes(legacyId) ? 1 : 0;
    const starRating = price >= 1100 ? 5 : price >= 550 ? 4 : 3;
    const cancellationPolicy = price >= 1200 ? "moderate" : "flexible";
    const jitterLat = cityInfo.lat + ((legacyId % 7) - 3) * 0.004;
    const jitterLng = cityInfo.lng + ((legacyId % 5) - 2) * 0.004;

    const descEn =
      mType === "stay"
        ? `Verified ${category} in ${city}, ${cityInfo.region}. Curated Moroccan hospitality featuring ${baseAmenities.join(", ")}.`
        : mType === "car"
        ? `Well-maintained ${name} available in ${city} with transparent mileage, insurance options, and airport/city handover.`
        : mType === "exp"
        ? `Authentic ${city} experience led by certified local guides. Includes ${baseAmenities.join(", ")}.`
        : `Signature ${city} culinary venue known for ${baseAmenities.join(", ")}.`;

    const descFr =
      mType === "stay"
        ? `${category.toUpperCase()} vérifié à ${city} (${cityInfo.region}). Hospitalité marocaine authentique avec ${baseAmenities.join(", ")}.`
        : mType === "car"
        ? `${name} entretenu à ${city} avec kilométrage clair, assurance et livraison possible.`
        : mType === "exp"
        ? `Expérience authentique à ${city} encadrée par des guides locaux certifiés (${baseAmenities.join(", ")}).`
        : `Adresse gastronomique à ${city} reconnue pour : ${baseAmenities.join(", ")}.`;

    const descAr = `عرض موثق في ${cityInfo.ar} مع خدمات عالية الجودة وتأكيد فوري عبر منصة مرحبا.`;
    const titleAr = mType === "stay" && STAY_ARABIC_TITLES[legacyId] ? STAY_ARABIC_TITLES[legacyId] : `${name} — ${cityInfo.ar}`;

    const res = insertProp.run(
      legacyId,
      partnerId,
      slug,
      name,
      name,
      titleAr,
      category,
      mType,
      city,
      cityInfo.region,
      `${city} Center, ${cityInfo.region}`,
      jitterLat,
      jitterLng,
      starRating,
      descEn,
      descFr,
      descAr,
      JSON.stringify([...new Set(baseAmenities)]),
      JSON.stringify(images),
      cancellationPolicy,
      price,
      unit,
      featured,
      4.8,
      1,
      JSON.stringify([
        `${city} Historic Medina / Center`,
        `${city} Airport Transfer Zone`,
        "Local Culinary Quarter",
      ])
    );

    const propId = Number(res.lastInsertRowid);
    propertyIdByLegacy.set(legacyId, propId);

    if (mType === "stay") {
      const r1 = Number(
        insertRoom.run(
          propId,
          "Standard Deluxe Room",
          "Chambre Deluxe Standard",
          "غرفة ديلوكس قياسية",
          "Comfortable Moroccan-crafted room with private en-suite bathroom and high-speed Wi-Fi.",
          2,
          1,
          1,
          150,
          4,
          price,
          Math.round(price * 1.15),
          JSON.stringify(["Wi-Fi", "Air conditioning", "En-suite bath", "Safe"]),
          JSON.stringify([images[0], "/images/listings/room-suite.jpg"])
        ).lastInsertRowid
      );
      roomIdByLegacy.set(legacyId, r1);

      insertRoom.run(
        propId,
        "Royal Suite & Terrace",
        "Suite Royale avec Terrasse",
        "جناح ملكي مع شرفة",
        "Spacious signature suite with lounge seating, artisan zellige finish, and private terrace.",
        4,
        2,
        1,
        200,
        2,
        Math.round(price * 1.55),
        Math.round(price * 1.75),
        JSON.stringify(["Wi-Fi", "Air conditioning", "Private terrace", "Breakfast included"]),
        JSON.stringify(["/images/listings/room-suite.jpg", images[0]])
      );
    } else {
      const r1 = Number(
        insertRoom.run(
          propId,
          mType === "car" ? "Vehicle Rental Unit" : mType === "exp" ? "Standard Booking Slot" : "Table Reservation / Tasting",
          mType === "car" ? "Unité de location" : mType === "exp" ? "Place standard" : "Réservation table / menu",
          "وحدة الحجز القياسية",
          descFr,
          mType === "car" ? 5 : 8,
          2,
          0,
          0,
          mType === "car" ? 3 : 10,
          price,
          price,
          JSON.stringify(baseAmenities),
          JSON.stringify(images)
        ).lastInsertRowid
      );
      roomIdByLegacy.set(legacyId, r1);
    }
  }

  // Promotions
  const insertPromo = db.prepare(
    `INSERT INTO promotions (code, name, discount_pct, discount_fixed_mad, min_booking_mad, max_uses, valid_from, valid_to, category_filter, is_active)
     VALUES (?, ?, ?, ?, ?, 500, '2026-01-01', '2027-12-31', ?, 1)`
  );
  insertPromo.run("MARHABA10", "Welcome to Morocco 10% Off", 10, 0, 300, "");
  insertPromo.run("SAHARA15", "Desert & Southern Escape 15% Off", 15, 0, 800, "stay");
  insertPromo.run("FIRST200", "200 MAD Off First Luxury Stay", 0, 200, 1500, "");

  // Pricing rules
  const riadPropId = propertyIdByLegacy.get(3)!;
  db.prepare(
    `INSERT INTO pricing_rules (property_id, partner_id, name, rule_type, adjustment_pct, adjustment_fixed_mad, start_date, end_date, min_nights, is_active)
     VALUES (?, ?, 'Long Stay 5+ Nights Discount', 'long_stay', -10, 0, NULL, NULL, 5, 1)`
  ).run(riadPropId, partner1Id);

  db.prepare(
    `INSERT INTO pricing_rules (property_id, partner_id, name, rule_type, adjustment_pct, adjustment_fixed_mad, start_date, end_date, is_active)
     VALUES (NULL, NULL, 'Peak Spring & Autumn Season', 'seasonal', 12, 0, '2026-03-15', '2026-05-15', 1)`
  ).run();

  // Seed one completed booking + verified review for traveler@marhaba.ma
  const riadRoomId = roomIdByLegacy.get(3)!;
  const completedBookingId = Number(
    db
      .prepare(
        `INSERT INTO bookings (
          booking_ref, traveler_id, property_id, room_type_id, partner_id,
          check_in, check_out, nights, adults, children, units_booked,
          status, currency, fx_rate, subtotal_mad, discount_mad, taxes_mad, service_fee_mad,
          total_mad, commission_pct, commission_mad, partner_net_mad,
          guest_name, guest_email, guest_phone, special_requests
        ) VALUES ('MRH-26SEED01', ?, ?, ?, ?, '2026-10-10', '2026-10-13', 3, 2, 0, 1, 'completed', 'MAD', 1, 2700, 0, 345, 108, 3153, 15, 405, 2295, 'Karim Tazi', 'traveler@marhaba.ma', '+212 663 77 88 99', 'Late arrival at 19:00')`
      )
      .run(travelerId, riadPropId, riadRoomId, partner1Id).lastInsertRowid
  );

  db.prepare(
    `INSERT INTO payments (booking_id, provider, provider_tx_id, amount_mad, currency, status, method_summary)
     VALUES (?, 'sandbox_card', 'TX-SANDBOX-SEED01', 3153, 'MAD', 'captured', 'Visa •••• 4242')`
  ).run(completedBookingId);

  db.prepare(
    `INSERT INTO ledger_entries (booking_id, partner_id, entry_type, amount_mad, direction, description) VALUES
     (?, ?, 'booking_gross', 3153, 'credit', 'Gross booking MRH-26SEED01'),
     (?, ?, 'commission', 405, 'credit', 'Marketplace commission MRH-26SEED01'),
     (?, ?, 'partner_payable', 2295, 'credit', 'Partner net payable MRH-26SEED01')`
  ).run(completedBookingId, partner1Id, completedBookingId, partner1Id, completedBookingId, partner1Id);

  db.prepare(
    `INSERT INTO reviews (property_id, booking_id, user_id, overall_rating, cleanliness_rating, location_rating, value_rating, service_rating, comment, partner_reply, partner_replied_at, status)
     VALUES (?, ?, ?, 5, 5, 5, 5, 5, 'Exceptional courtyard serenity right inside the Medina. Mint tea on arrival and spotless zellige pool.', 'Thank you Karim! We look forward to welcoming you back to Marrakech.', datetime('now'), 'published')`
  ).run(riadPropId, completedBookingId, travelerId);

  // Sample upcoming booking
  const villaPropId = propertyIdByLegacy.get(4)!;
  const villaRoomId = roomIdByLegacy.get(4)!;
  const upcomingId = Number(
    db
      .prepare(
        `INSERT INTO bookings (
          booking_ref, traveler_id, property_id, room_type_id, partner_id,
          check_in, check_out, nights, adults, children, units_booked,
          status, currency, fx_rate, subtotal_mad, discount_mad, taxes_mad, service_fee_mad,
          total_mad, commission_pct, commission_mad, partner_net_mad,
          guest_name, guest_email, guest_phone
        ) VALUES ('MRH-26DAKH02', ?, ?, ?, ?, '2026-12-15', '2026-12-18', 3, 2, 0, 1, 'confirmed', 'MAD', 1, 3600, 0, 435, 144, 4179, 15, 540, 3060, 'Karim Tazi', 'traveler@marhaba.ma', '+212 663 77 88 99')`
      )
      .run(travelerId, villaPropId, villaRoomId, partner2Id).lastInsertRowid
  );

  db.prepare(
    `INSERT INTO payments (booking_id, provider, provider_tx_id, amount_mad, currency, status, method_summary)
     VALUES (?, 'sandbox_card', 'TX-SANDBOX-DAKH02', 4179, 'MAD', 'captured', 'Mastercard •••• 8810')`
  ).run(upcomingId);

  db.prepare(
    `INSERT INTO ledger_entries (booking_id, partner_id, entry_type, amount_mad, direction, description) VALUES
     (?, ?, 'booking_gross', 4179, 'credit', 'Gross booking MRH-26DAKH02'),
     (?, ?, 'commission', 540, 'credit', 'Marketplace commission MRH-26DAKH02'),
     (?, ?, 'partner_payable', 3060, 'credit', 'Partner net payable MRH-26DAKH02')`
  ).run(upcomingId, partner2Id, upcomingId, partner2Id, upcomingId, partner2Id);

  // Affiliate
  db.prepare(
    `INSERT INTO affiliates (user_id, code, commission_pct, status, total_clicks, total_bookings, total_earned_mad)
     VALUES (?, 'AMINE-AF', 5, 'approved', 124, 3, 450)`
  ).run(affiliateUserId);

  // Channel Manager Integrations (ready architecture + iCal export token)
  const insertChannel = db.prepare(
    `INSERT INTO channel_integrations (property_id, provider, external_property_id, ical_export_token, status, last_sync_message)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const chan1Id = Number(
    insertChannel.run(
      riadPropId,
      "ical",
      "",
      crypto.randomBytes(12).toString("hex"),
      "active",
      "iCal feed active for bi-directional calendar export"
    ).lastInsertRowid
  );
  insertChannel.run(
    riadPropId,
    "siteminder",
    "",
    crypto.randomBytes(12).toString("hex"),
    "needs_credentials",
    "Configure SiteMinder API Client ID & Hotel Code to activate real-time ARI push/pull."
  );
  db.prepare(
    `INSERT INTO sync_logs (integration_id, direction, sync_type, status, summary)
     VALUES (?, 'outbound', 'availability', 'success', 'Published 90-day iCal feed for Riad Médina Jasmin')`
  ).run(chan1Id);

  // Conversation & Support ticket
  const convId = Number(
    db
      .prepare(
        `INSERT INTO conversations (booking_id, property_id, traveler_id, partner_id, subject)
         VALUES (?, ?, ?, ?, 'Airport pickup inquiry for Dakhla stay')`
      )
      .run(upcomingId, villaPropId, travelerId, partner2Id).lastInsertRowid
  );
  db.prepare(
    `INSERT INTO messages (conversation_id, sender_user_id, sender_role, body)
     VALUES (?, ?, 'traveler', 'Salam! Can we arrange a transfer from Dakhla Airport on Dec 15?')`
  ).run(convId, travelerId);

  db.prepare(
    `INSERT INTO support_tickets (user_id, booking_id, category, subject, description, priority, status)
     VALUES (?, ?, 'booking', 'Invoice PDF request', 'Please confirm VAT invoice formatting for corporate travel reimbursement.', 'normal', 'open')`
  ).run(travelerId, completedBookingId);

  // System Settings & CMS Blocks
  const setSetting = db.prepare(`INSERT OR REPLACE INTO system_settings (key, value_json) VALUES (?, ?)`);
  setSetting.run("default_commission_pct", JSON.stringify(15));
  setSetting.run("tourist_tax_mad", JSON.stringify(25));
  setSetting.run("vat_pct", JSON.stringify(10));
  setSetting.run("maintenance_mode", JSON.stringify(false));
  setSetting.run("supported_currencies", JSON.stringify(["MAD", "EUR", "USD"]));
  setSetting.run("supported_languages", JSON.stringify(["en", "fr", "ar"]));

  const insertCms = db.prepare(
    `INSERT INTO cms_blocks (key, title, title_fr, title_ar, content_json) VALUES (?, ?, ?, ?, ?)`
  );
  insertCms.run(
    "hero_campaign",
    "Discover Authentic Morocco — Direct Verified Stays & Experiences",
    "Découvrez le Maroc Authentique — Séjours & Expériences Vérifiés",
    "اكتشف المغرب الأصيل — إقامات وتجارب موثوقة",
    JSON.stringify({
      badge: "Winter & Spring 2026 Collection",
      ctaText: "Explore Verified Stays",
      promoCode: "MARHABA10",
    })
  );
  insertCms.run(
    "trust_pillars",
    "Verified Moroccan Hospitality Standard",
    "Standard d'Hospitalité Marocaine Vérifiée",
    "معايير الضيافة المغربية الموثوقة",
    JSON.stringify({
      pillars: [
        "Transactional inventory holds prevent double bookings",
        "Transparent MAD/EUR/USD pricing with full tax breakdown",
        "Verified guest reviews tied strictly to completed stays",
      ],
    })
  );
}

if (require.main === module) {
  ensureSeeded();
  console.log("MARHABA database seeded successfully.");
}
