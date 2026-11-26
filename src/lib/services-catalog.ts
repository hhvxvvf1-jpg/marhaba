export type TelecomOperatorId = "iam" | "orange" | "inwi";

export interface EsimPackage {
  code: string;
  name: string;
  dataGb: number;
  dataLabel: string;
  durationDays: number;
  priceMad: number;
  coverage: string;
  networkSpeed: string;
  hotspotAllowed: boolean;
  recommendedForEn: string;
  recommendedForFr: string;
  recommendedForAr: string;
  badge?: string;
  popular?: boolean;
  operators: TelecomOperatorId[];
  bestOperator: TelecomOperatorId;
}

export interface TelecomOperatorInfo {
  id: TelecomOperatorId;
  name: string;
  shortName: string;
  logo: string;
  badgeEn: string;
  badgeFr: string;
  badgeAr: string;
  coverageScore: number;
  fiveGCities: string;
  saharaAtlasNoteEn: string;
  saharaAtlasNoteFr: string;
  saharaAtlasNoteAr: string;
  apn: string;
  portalUrl: string;
}

export interface MoroccoCoverageZone {
  id: string;
  zoneEn: string;
  zoneFr: string;
  zoneAr: string;
  speedLabel: string;
  iamSignal: number; // out of 5
  orangeSignal: number;
  inwiSignal: number;
  tipEn: string;
  tipFr: string;
  tipAr: string;
}

export interface CompatibleDeviceGroup {
  brand: string;
  models: string[];
  setupPath: string;
}

export const TELECOM_OPERATORS: TelecomOperatorInfo[] = [
  {
    id: "iam",
    name: "Maroc Telecom (IAM)",
    shortName: "Maroc Telecom",
    logo: "/logos/maroctelecom.png",
    badgeEn: "Widest Atlas & Sahara",
    badgeFr: "Meilleure couv. Atlas & Sahara",
    badgeAr: "أوسع تغطية بالأطلس والصحراء",
    coverageScore: 99,
    fiveGCities: "Casablanca, Rabat, Tangier, Marrakech, Agadir, Fès, Laâyoune, Dakhla",
    saharaAtlasNoteEn: "Unmatched signal in High Atlas passes, Merzouga dunes, and Southern Provinces.",
    saharaAtlasNoteFr: "Signal inégalé dans le Haut Atlas, Merzouga et les Provinces du Sud.",
    saharaAtlasNoteAr: "أفضل تغطية في ممرات الأطلس الكبير ومرزوكة والأقاليم الجنوبية.",
    apn: "internet.iam",
    portalUrl: "https://www.iam.ma",
  },
  {
    id: "orange",
    name: "Orange Maroc",
    shortName: "Orange Maroc",
    logo: "/logos/orange.png",
    badgeEn: "Fastest Urban 5G / 4G+",
    badgeFr: "5G / 4G+ Urbain Ultra-Rapide",
    badgeAr: "أسرع 5G / 4G+ بالمدن الكبرى",
    coverageScore: 96,
    fiveGCities: "Casablanca, Rabat, Marrakech, Tangier, Agadir, Fès, Oujda",
    saharaAtlasNoteEn: "Top download speeds in city centers, TGV Al Boraq corridor, and riads.",
    saharaAtlasNoteFr: "Débits records en centre-ville, sur la ligne Al Boraq et dans les riads.",
    saharaAtlasNoteAr: "أعلى سرعة إنترنت وسط المدن ومحور البراق والرياضات.",
    apn: "internet.orange.ma",
    portalUrl: "https://www.orange.ma",
  },
  {
    id: "inwi",
    name: "inwi Morocco",
    shortName: "inwi",
    logo: "/logos/inwi.png",
    badgeEn: "Instant eSIM QR",
    badgeFr: "Activation QR Instantanée",
    badgeAr: "تفعيل QR فوري وسريع",
    coverageScore: 94,
    fiveGCities: "Casablanca, Rabat, Tangier, Marrakech, Agadir, Meknès",
    saharaAtlasNoteEn: "Seamless dual-carrier handover in major cities, coastal resorts, and airports.",
    saharaAtlasNoteFr: "Connexion fluide dans les grandes villes, stations balnéaires et aéroports.",
    saharaAtlasNoteAr: "اتصال سلس ومستقر في المدن الكبرى والمنتجعات والمطارات.",
    apn: "www.inwi.ma",
    portalUrl: "https://www.inwi.ma",
  },
];

export const ESIM_PACKAGES: EsimPackage[] = [
  {
    code: "MA-1GB-7D",
    name: "Morocco Starter 1 GB",
    dataGb: 1,
    dataLabel: "1 GB",
    durationDays: 7,
    priceMad: 50,
    coverage: "Morocco 4G/5G (Maroc Telecom / Orange)",
    networkSpeed: "5G / 4G+ LTE",
    hotspotAllowed: true,
    recommendedForEn: "Weekend city break · Maps, Careem/inDrive & WhatsApp",
    recommendedForFr: "Week-end · Maps, VTC & messagerie WhatsApp",
    recommendedForAr: "عطلة نهاية الأسبوع · الخرائط والتنقل والواتساب",
    operators: ["orange", "inwi", "iam"],
    bestOperator: "orange",
  },
  {
    code: "MA-3GB-30D",
    name: "Morocco Essential 3 GB",
    dataGb: 3,
    dataLabel: "3 GB",
    durationDays: 30,
    priceMad: 100,
    coverage: "Morocco 4G/5G (Maroc Telecom / Orange)",
    networkSpeed: "5G / 4G+ LTE",
    hotspotAllowed: true,
    recommendedForEn: "3–7 day stay · Navigation, boarding passes & dining search",
    recommendedForFr: "Séjour 3–7 jours · GPS, billets & bonnes adresses",
    recommendedForAr: "إقامة 3–7 أيام · الملاحة وحجوزات السفر والمطاعم",
    operators: ["orange", "inwi", "iam"],
    bestOperator: "orange",
  },
  {
    code: "MA-5GB-30D",
    name: "Imperial Cities 5 GB",
    dataGb: 5,
    dataLabel: "5 GB",
    durationDays: 30,
    priceMad: 140,
    coverage: "Morocco 4G/5G (Maroc Telecom / Orange / inwi)",
    networkSpeed: "5G / 4G+ LTE",
    hotspotAllowed: true,
    recommendedForEn: "7–10 day trip · Imperial cities, social sharing & video calls",
    recommendedForFr: "Voyage 7–10 jours · Villes impériales, photos & appels vidéo",
    recommendedForAr: "رحلة 7–10 أيام · المدن العتيقة ومشاركة الصور والفيديو",
    badge: "Best Value",
    popular: true,
    operators: ["iam", "orange", "inwi"],
    bestOperator: "iam",
  },
  {
    code: "MA-10GB-30D",
    name: "Atlas & Sahara 10 GB",
    dataGb: 10,
    dataLabel: "10 GB",
    durationDays: 30,
    priceMad: 210,
    coverage: "Morocco 4G/5G Nationwide (IAM / Orange / inwi)",
    networkSpeed: "5G / 4G+ LTE",
    hotspotAllowed: true,
    recommendedForEn: "10–21 day roadtrip · Marrakech, Merzouga, Agadir & Dakhla",
    recommendedForFr: "Road-trip 10–21 jours · Marrakech, Merzouga, Agadir & Dakhla",
    recommendedForAr: "جولة 10–21 يوماً · مراكش ومرزوكة وأكادير والداخلة",
    badge: "Most Popular",
    popular: true,
    operators: ["iam", "orange", "inwi"],
    bestOperator: "iam",
  },
  {
    code: "MA-20GB-30D",
    name: "Nomad Pro 20 GB",
    dataGb: 20,
    dataLabel: "20 GB",
    durationDays: 30,
    priceMad: 320,
    coverage: "Morocco 5G/4G+ Priority (IAM / Orange / inwi)",
    networkSpeed: "5G Priority + Hotspot",
    hotspotAllowed: true,
    recommendedForEn: "Remote work, 4K Reels, laptop tethering & long stays",
    recommendedForFr: "Télétravail, partage Wi-Fi PC & longs séjours",
    recommendedForAr: "العمل عن بعد، البث المباشر، ومشاركة الإنترنت للكمبيوتر",
    badge: "Remote Work",
    operators: ["iam", "orange", "inwi"],
    bestOperator: "orange",
  },
  {
    code: "MA-UNL-15D",
    name: "Unlimited Explorer 15d",
    dataGb: 50,
    dataLabel: "Unlimited*",
    durationDays: 15,
    priceMad: 390,
    coverage: "Morocco Unlimited 5G/4G+ (50 GB Full-Speed FUP)",
    networkSpeed: "5G Unlimited* (50 GB Hi-Speed)",
    hotspotAllowed: true,
    recommendedForEn: "Zero data anxiety · Heavy streaming, maps & hotspot for 2 weeks",
    recommendedForFr: "Zéro limite · Streaming, GPS & partage intensif 15 jours",
    recommendedForAr: "بدون قلق الاستهلاك · تدفق عالي وبث ومشاركة طوال 15 يوماً",
    badge: "Unlimited*",
    operators: ["iam", "orange", "inwi"],
    bestOperator: "iam",
  },
];

export const MOROCCO_COVERAGE_ZONES: MoroccoCoverageZone[] = [
  {
    id: "casa-rabat",
    zoneEn: "Casablanca · Rabat · Kenitra",
    zoneFr: "Casablanca · Rabat · Kénitra",
    zoneAr: "الدار البيضاء · الرباط · القنيطرة",
    speedLabel: "5G Ultra · 180–420 Mbps",
    iamSignal: 5,
    orangeSignal: 5,
    inwiSignal: 5,
    tipEn: "Instant signal right upon landing at CMN Mohammed V Airport and along Al Boraq rail.",
    tipFr: "Réseau immédiat dès l’atterrissage à CMN et sur toute la ligne Al Boraq.",
    tipAr: "إشارة قوية فور الوصول لمطار محمد الخامس وعلى طول خط قطار البراق.",
  },
  {
    id: "marrakech-atlas",
    zoneEn: "Marrakech · Imlil · High Atlas",
    zoneFr: "Marrakech · Imlil · Haut Atlas",
    zoneAr: "مراكش · إمليل · الأطلس الكبير",
    speedLabel: "5G / 4G+ · 90–260 Mbps",
    iamSignal: 5,
    orangeSignal: 5,
    inwiSignal: 4,
    tipEn: "Strong inside Medina riads and reliable along Tizi n’Tichka & Ourika valleys via IAM.",
    tipFr: "Excellent dans les riads de la Médina et fiable dans les vallées de l’Atlas.",
    tipAr: "تغطية ممتازة داخل رياضات المدينة العتيقة ومستقرة في وديان الأطلس.",
  },
  {
    id: "tangier-north",
    zoneEn: "Tangier · Chefchaouen · Tétouan",
    zoneFr: "Tanger · Chefchaouen · Tétouan",
    zoneAr: "طنجة · شفشاون · تطوان",
    speedLabel: "5G / 4G+ · 110–280 Mbps",
    iamSignal: 5,
    orangeSignal: 4,
    inwiSignal: 4,
    tipEn: "Great coverage from Tanger Med port and airport all the way to the Blue Pearl Rif hills.",
    tipFr: "Très bonne couverture de Tanger Med jusqu’aux montagnes du Rif à Chefchaouen.",
    tipAr: "تغطية قوية من ميناء ومطار طنجة حتى جبال الريف وشفشاون.",
  },
  {
    id: "agadir-south",
    zoneEn: "Agadir · Taghazout · Essaouira",
    zoneFr: "Agadir · Taghazout · Essaouira",
    zoneAr: "أكادير · تاغازوت · الصويرة",
    speedLabel: "5G / 4G+ · 100–250 Mbps",
    iamSignal: 5,
    orangeSignal: 5,
    inwiSignal: 4,
    tipEn: "Fast coastal 4G+/5G ideal for remote surf camps and beach cafés.",
    tipFr: "Très haut débit sur la côte atlantique, idéal pour surf camps et télétravail.",
    tipAr: "إنترنت سريع على الساحل الأطلسي مثالي لمخيمات ركوب الأمواج والعمل عن بعد.",
  },
  {
    id: "sahara-desert",
    zoneEn: "Ouarzazate · Merzouga · Zagora",
    zoneFr: "Ouarzazate · Merzouga · Zagora",
    zoneAr: "ورزازات · مرزوكة · زاكورة",
    speedLabel: "4G LTE · 25–75 Mbps",
    iamSignal: 5,
    orangeSignal: 3,
    inwiSignal: 3,
    tipEn: "Maroc Telecom (IAM) reaches desert bivouac camps near Erg Chebbi dunes.",
    tipFr: "Maroc Telecom offre la couverture la plus stable près des dunes de Merzouga.",
    tipAr: "اتصالات المغرب توفر أفضل تغطية حتى مخيمات الكثبان الرملية بمرزوكة.",
  },
  {
    id: "southern-provinces",
    zoneEn: "Laâyoune · Dakhla Lagoon",
    zoneFr: "Laâyoune · Lagune de Dakhla",
    zoneAr: "العيون · بحيرة الداخلة",
    speedLabel: "4G+ / 5G · 60–190 Mbps",
    iamSignal: 5,
    orangeSignal: 4,
    inwiSignal: 4,
    tipEn: "Reliable high-speed connectivity across Dakhla kitesurf lagoon and Laâyoune city.",
    tipFr: "Connexion haut débit fiable à la lagune de Dakhla et à Laâyoune.",
    tipAr: "اتصال سريع وموثوق في بحيرة الداخلة ومدينة العيون.",
  },
];

export const COMPATIBLE_DEVICE_GROUPS: CompatibleDeviceGroup[] = [
  {
    brand: "Apple iPhone",
    models: [
      "iPhone 17 / 17 Pro / 17 Air",
      "iPhone 16 / 16 Plus / 16 Pro / 16 Pro Max",
      "iPhone 15 / 15 Plus / 15 Pro / 15 Pro Max",
      "iPhone 14 / 14 Plus / 14 Pro / 14 Pro Max",
      "iPhone 13 / 13 mini / 13 Pro / 13 Pro Max",
      "iPhone 12 / 11 / XS / XR / SE (2020 & 2022)",
    ],
    setupPath: "Settings → Mobile Service → Add eSIM → Use QR Code",
  },
  {
    brand: "Samsung Galaxy",
    models: [
      "Galaxy S26 / S25 / S24 / S23 / S22 / S21 / S20",
      "Galaxy Z Fold 3–7 & Z Flip 3–7",
      "Galaxy A55 / A54 / A35 5G (regional)",
      "Galaxy Note 20 / Note 20 Ultra",
    ],
    setupPath: "Settings → Connections → SIM Manager → Add eSIM",
  },
  {
    brand: "Google Pixel",
    models: [
      "Pixel 10 / 9 / 9 Pro / 9 Pro Fold",
      "Pixel 8 / 8a / 8 Pro",
      "Pixel 7 / 7a / 7 Pro",
      "Pixel 6 / 5 / 4 / 4a",
    ],
    setupPath: "Settings → Network & Internet → SIMs → Add SIM",
  },
  {
    brand: "Xiaomi · OPPO · Honor · Sony",
    models: [
      "Xiaomi 15 / 14 / 14T / 13 / 13T / 12T Pro",
      "Redmi Note 14 Pro / Note 13 Pro+",
      "OPPO Find X5 / X6 / X7 / Reno 11+",
      "Honor Magic 5 / 6 / 7 Pro · Sony Xperia 1 IV+",
    ],
    setupPath: "Settings → Mobile Networks → Manage eSIM → Add eSIM",
  },
];

export function searchCompatibleDevices(query: string): Array<{ brand: string; model: string; setupPath: string }> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results: Array<{ brand: string; model: string; setupPath: string }> = [];
  for (const grp of COMPATIBLE_DEVICE_GROUPS) {
    for (const model of grp.models) {
      if (model.toLowerCase().includes(q) || grp.brand.toLowerCase().includes(q)) {
        results.push({ brand: grp.brand, model, setupPath: grp.setupPath });
      }
    }
  }
  return results;
}
