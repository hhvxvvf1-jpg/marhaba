export interface MoroccanCity {
  slug: string;
  name: string;
  nameFr: string;
  nameAr: string;
  region: string;
  lat: number;
  lng: number;
  aliases: string[];
  popular?: boolean;
}

export const MOROCCO_CITIES: MoroccanCity[] = [
  // Casablanca-Settat
  {
    slug: "casablanca",
    name: "Casablanca",
    nameFr: "Casablanca",
    nameAr: "الدار البيضاء",
    region: "Casablanca-Settat",
    lat: 33.5731,
    lng: -7.5898,
    aliases: ["casa", "dar el beida", "الدار البيضاء", "كازا"],
    popular: true,
  },
  {
    slug: "mohammedia",
    name: "Mohammedia",
    nameFr: "Mohammédia",
    nameAr: "المحمدية",
    region: "Casablanca-Settat",
    lat: 33.6861,
    lng: -7.383,
    aliases: ["fedala", "المحمدية"],
  },
  {
    slug: "el-jadida",
    name: "El Jadida",
    nameFr: "El Jadida",
    nameAr: "الجديدة",
    region: "Casablanca-Settat",
    lat: 33.2316,
    lng: -8.5007,
    aliases: ["mazagan", "jadida", "الجديدة"],
  },
  {
    slug: "azemmour",
    name: "Azemmour",
    nameFr: "Azemmour",
    nameAr: "أزمور",
    region: "Casablanca-Settat",
    lat: 33.2878,
    lng: -8.3422,
    aliases: ["أزمور"],
  },
  {
    slug: "oualidia",
    name: "Oualidia",
    nameFr: "Oualidia",
    nameAr: "الوليدية",
    region: "Casablanca-Settat",
    lat: 32.7336,
    lng: -9.0358,
    aliases: ["walidia", "الوليدية"],
  },
  {
    slug: "settat",
    name: "Settat",
    nameFr: "Settat",
    nameAr: "سطات",
    region: "Casablanca-Settat",
    lat: 33.001,
    lng: -7.6166,
    aliases: ["سطات"],
  },
  {
    slug: "berrechid",
    name: "Berrechid",
    nameFr: "Berrechid",
    nameAr: "برشيد",
    region: "Casablanca-Settat",
    lat: 33.2655,
    lng: -7.5875,
    aliases: ["برشيد"],
  },

  // Marrakech-Safi
  {
    slug: "marrakech",
    name: "Marrakech",
    nameFr: "Marrakech",
    nameAr: "مراكش",
    region: "Marrakech-Safi",
    lat: 31.6295,
    lng: -7.9811,
    aliases: ["marrakesh", "kesh", "kech", "مراكش"],
    popular: true,
  },
  {
    slug: "essaouira",
    name: "Essaouira",
    nameFr: "Essaouira",
    nameAr: "الصويرة",
    region: "Marrakech-Safi",
    lat: 31.5085,
    lng: -9.7595,
    aliases: ["mogador", "الصويرة"],
    popular: true,
  },
  {
    slug: "safi",
    name: "Safi",
    nameFr: "Safi",
    nameAr: "آسفي",
    region: "Marrakech-Safi",
    lat: 32.2994,
    lng: -9.2372,
    aliases: ["asfi", "آسفي"],
  },
  {
    slug: "imlil",
    name: "Imlil",
    nameFr: "Imlil",
    nameAr: "إمليل",
    region: "Marrakech-Safi",
    lat: 31.1394,
    lng: -7.9197,
    aliases: ["toubkal", "إمليل"],
  },
  {
    slug: "agafay",
    name: "Agafay",
    nameFr: "Agafay",
    nameAr: "أكفاي",
    region: "Marrakech-Safi",
    lat: 31.4822,
    lng: -8.2508,
    aliases: ["أكفاي"],
  },
  {
    slug: "sidi-kaouki",
    name: "Sidi Kaouki",
    nameFr: "Sidi Kaouki",
    nameAr: "سيدي كاوكي",
    region: "Marrakech-Safi",
    lat: 31.3512,
    lng: -9.7963,
    aliases: ["سيدي كاوكي"],
  },
  {
    slug: "el-kelaa-des-sraghna",
    name: "El Kelâa des Sraghna",
    nameFr: "El Kelâa des Sraghna",
    nameAr: "قلعة السراغنة",
    region: "Marrakech-Safi",
    lat: 32.0481,
    lng: -7.4083,
    aliases: ["kelaat sraghna", "قلعة السراغنة"],
  },

  // Rabat-Salé-Kénitra
  {
    slug: "rabat",
    name: "Rabat",
    nameFr: "Rabat",
    nameAr: "الرباط",
    region: "Rabat-Salé-Kénitra",
    lat: 34.0209,
    lng: -6.8416,
    aliases: ["rbatt", "الرباط"],
    popular: true,
  },
  {
    slug: "sale",
    name: "Salé",
    nameFr: "Salé",
    nameAr: "سلا",
    region: "Rabat-Salé-Kénitra",
    lat: 34.0531,
    lng: -6.7985,
    aliases: ["sale", "سلا"],
  },
  {
    slug: "temara",
    name: "Témara",
    nameFr: "Témara",
    nameAr: "تمارة",
    region: "Rabat-Salé-Kénitra",
    lat: 33.9287,
    lng: -6.9066,
    aliases: ["temara", "تمارة"],
  },
  {
    slug: "skhirat",
    name: "Skhirat",
    nameFr: "Skhirat",
    nameAr: "الصخيرات",
    region: "Rabat-Salé-Kénitra",
    lat: 33.8528,
    lng: -7.0319,
    aliases: ["الصخيرات"],
  },
  {
    slug: "kenitra",
    name: "Kénitra",
    nameFr: "Kénitra",
    nameAr: "القنيطرة",
    region: "Rabat-Salé-Kénitra",
    lat: 34.261,
    lng: -6.5802,
    aliases: ["kenitra", "القنيطرة"],
  },

  // Tanger-Tétouan-Al Hoceïma
  {
    slug: "tangier",
    name: "Tangier",
    nameFr: "Tanger",
    nameAr: "طنجة",
    region: "Tanger-Tétouan-Al Hoceïma",
    lat: 35.7595,
    lng: -5.834,
    aliases: ["tanger", "tanja", "طنجة"],
    popular: true,
  },
  {
    slug: "chefchaouen",
    name: "Chefchaouen",
    nameFr: "Chefchaouen",
    nameAr: "شفشاون",
    region: "Tanger-Tétouan-Al Hoceïma",
    lat: 35.1688,
    lng: -5.2636,
    aliases: ["chaouen", "xauen", "شفشاون"],
    popular: true,
  },
  {
    slug: "tetouan",
    name: "Tétouan",
    nameFr: "Tétouan",
    nameAr: "تطوان",
    region: "Tanger-Tétouan-Al Hoceïma",
    lat: 35.5889,
    lng: -5.3626,
    aliases: ["tetouan", "تطوان"],
  },
  {
    slug: "al-hoceima",
    name: "Al Hoceïma",
    nameFr: "Al Hoceïma",
    nameAr: "الحسيمة",
    region: "Tanger-Tétouan-Al Hoceïma",
    lat: 35.2517,
    lng: -3.9372,
    aliases: ["alhoceima", "al hoceima", "hoceima", "الحسيمة"],
  },
  {
    slug: "asilah",
    name: "Asilah",
    nameFr: "Assilah",
    nameAr: "أصيلة",
    region: "Tanger-Tétouan-Al Hoceïma",
    lat: 35.465,
    lng: -6.0348,
    aliases: ["assilah", "azila", "أصيلة"],
  },
  {
    slug: "larache",
    name: "Larache",
    nameFr: "Larache",
    nameAr: "العرائش",
    region: "Tanger-Tétouan-Al Hoceïma",
    lat: 35.1932,
    lng: -6.1557,
    aliases: ["العرائش"],
  },
  {
    slug: "martil",
    name: "Martil",
    nameFr: "Martil",
    nameAr: "مرتيل",
    region: "Tanger-Tétouan-Al Hoceïma",
    lat: 35.6166,
    lng: -5.2752,
    aliases: ["مرتيل"],
  },
  {
    slug: "fnideq",
    name: "Fnideq",
    nameFr: "Fnideq",
    nameAr: "الفنيدق",
    region: "Tanger-Tétouan-Al Hoceïma",
    lat: 35.8495,
    lng: -5.357,
    aliases: ["castillejos", "الفنيدق"],
  },
  {
    slug: "mdiq",
    name: "M'diq",
    nameFr: "M'diq",
    nameAr: "المضيق",
    region: "Tanger-Tétouan-Al Hoceïma",
    lat: 35.6858,
    lng: -5.3253,
    aliases: ["mdiq", "tamuda bay", "المضيق"],
  },

  // Fès-Meknès
  {
    slug: "fes",
    name: "Fès",
    nameFr: "Fès",
    nameAr: "فاس",
    region: "Fès-Meknès",
    lat: 34.0181,
    lng: -5.0078,
    aliases: ["fes", "fez", "فاس"],
    popular: true,
  },
  {
    slug: "meknes",
    name: "Meknes",
    nameFr: "Meknès",
    nameAr: "مكناس",
    region: "Fès-Meknès",
    lat: 33.8935,
    lng: -5.5473,
    aliases: ["meknès", "مكناس"],
  },
  {
    slug: "ifrane",
    name: "Ifrane",
    nameFr: "Ifrane",
    nameAr: "إفران",
    region: "Fès-Meknès",
    lat: 33.5228,
    lng: -5.111,
    aliases: ["إفران", "افران"],
  },
  {
    slug: "azrou",
    name: "Azrou",
    nameFr: "Azrou",
    nameAr: "أزرو",
    region: "Fès-Meknès",
    lat: 33.4344,
    lng: -5.2213,
    aliases: ["أزرو"],
  },
  {
    slug: "taza",
    name: "Taza",
    nameFr: "Taza",
    nameAr: "تازة",
    region: "Fès-Meknès",
    lat: 34.2133,
    lng: -4.0103,
    aliases: ["تازة"],
  },
  {
    slug: "sefrou",
    name: "Sefrou",
    nameFr: "Séfrou",
    nameAr: "صفرو",
    region: "Fès-Meknès",
    lat: 33.8318,
    lng: -4.828,
    aliases: ["صفرو"],
  },

  // Oriental
  {
    slug: "oujda",
    name: "Oujda",
    nameFr: "Oujda",
    nameAr: "وجدة",
    region: "L'Oriental",
    lat: 34.6814,
    lng: -1.9086,
    aliases: ["وجدة"],
  },
  {
    slug: "nador",
    name: "Nador",
    nameFr: "Nador",
    nameAr: "الناظور",
    region: "L'Oriental",
    lat: 35.1681,
    lng: -2.9335,
    aliases: ["الناظور"],
  },
  {
    slug: "saidia",
    name: "Saïdia",
    nameFr: "Saïdia",
    nameAr: "السعيدية",
    region: "L'Oriental",
    lat: 35.0861,
    lng: -2.2286,
    aliases: ["saidia", "السعيدية"],
  },
  {
    slug: "berkane",
    name: "Berkane",
    nameFr: "Berkane",
    nameAr: "بركان",
    region: "L'Oriental",
    lat: 34.92,
    lng: -2.32,
    aliases: ["بركان"],
  },

  // Béni Mellal-Khénifra
  {
    slug: "beni-mellal",
    name: "Béni Mellal",
    nameFr: "Béni Mellal",
    nameAr: "بني ملال",
    region: "Béni Mellal-Khénifra",
    lat: 32.3373,
    lng: -6.3498,
    aliases: ["beni mellal", "بني ملال"],
  },
  {
    slug: "khouribga",
    name: "Khouribga",
    nameFr: "Khouribga",
    nameAr: "خريبكة",
    region: "Béni Mellal-Khénifra",
    lat: 32.8811,
    lng: -6.9063,
    aliases: ["خريبكة"],
  },
  {
    slug: "khenifra",
    name: "Khénifra",
    nameFr: "Khénifra",
    nameAr: "خنيفرة",
    region: "Béni Mellal-Khénifra",
    lat: 32.9358,
    lng: -5.6686,
    aliases: ["khenifra", "خنيفرة"],
  },
  {
    slug: "azilal",
    name: "Azilal",
    nameFr: "Azilal",
    nameAr: "أزيلال",
    region: "Béni Mellal-Khénifra",
    lat: 31.9616,
    lng: -6.5711,
    aliases: ["ouzoud", "أزيلال"],
  },

  // Souss-Massa
  {
    slug: "agadir",
    name: "Agadir",
    nameFr: "Agadir",
    nameAr: "أكادير",
    region: "Souss-Massa",
    lat: 30.4278,
    lng: -9.5981,
    aliases: ["أكادير", "اكادير"],
    popular: true,
  },
  {
    slug: "taghazout",
    name: "Taghazout",
    nameFr: "Taghazout",
    nameAr: "تاغازوت",
    region: "Souss-Massa",
    lat: 30.5453,
    lng: -9.7112,
    aliases: ["تاغازوت"],
  },
  {
    slug: "taroudant",
    name: "Taroudant",
    nameFr: "Taroudant",
    nameAr: "تارودانت",
    region: "Souss-Massa",
    lat: 30.4703,
    lng: -8.8769,
    aliases: ["تارودانت"],
  },
  {
    slug: "tiznit",
    name: "Tiznit",
    nameFr: "Tiznit",
    nameAr: "تيزنيت",
    region: "Souss-Massa",
    lat: 29.6974,
    lng: -9.7316,
    aliases: ["تيزنيت"],
  },
  {
    slug: "tata",
    name: "Tata",
    nameFr: "Tata",
    nameAr: "طاطا",
    region: "Souss-Massa",
    lat: 29.7428,
    lng: -7.9725,
    aliases: ["طاطا"],
  },

  // Drâa-Tafilalet
  {
    slug: "ouarzazate",
    name: "Ouarzazate",
    nameFr: "Ouarzazate",
    nameAr: "ورزازات",
    region: "Drâa-Tafilalet",
    lat: 30.9335,
    lng: -6.937,
    aliases: ["ورزازات"],
    popular: true,
  },
  {
    slug: "merzouga",
    name: "Merzouga",
    nameFr: "Merzouga",
    nameAr: "مرزوكة",
    region: "Drâa-Tafilalet",
    lat: 31.0802,
    lng: -4.0134,
    aliases: ["sahara", "erg chebbi", "مرزوكة"],
    popular: true,
  },
  {
    slug: "errachidia",
    name: "Errachidia",
    nameFr: "Errachidia",
    nameAr: "الرشيدية",
    region: "Drâa-Tafilalet",
    lat: 31.9314,
    lng: -4.4266,
    aliases: ["الرشيدية"],
  },
  {
    slug: "erfoud",
    name: "Erfoud",
    nameFr: "Erfoud",
    nameAr: "أرفود",
    region: "Drâa-Tafilalet",
    lat: 31.4314,
    lng: -4.2325,
    aliases: ["أرفود"],
  },
  {
    slug: "zagora",
    name: "Zagora",
    nameFr: "Zagora",
    nameAr: "زاكورة",
    region: "Drâa-Tafilalet",
    lat: 30.3324,
    lng: -5.8384,
    aliases: ["زاكورة"],
  },
  {
    slug: "tinghir",
    name: "Tinghir",
    nameFr: "Tinghir",
    nameAr: "تنغير",
    region: "Drâa-Tafilalet",
    lat: 31.5147,
    lng: -5.5328,
    aliases: ["todra", "tinerhir", "تنغير"],
  },
  {
    slug: "midelt",
    name: "Midelt",
    nameFr: "Midelt",
    nameAr: "ميدلت",
    region: "Drâa-Tafilalet",
    lat: 32.6852,
    lng: -4.7451,
    aliases: ["ميدلت"],
  },

  // Guelmim-Oued Noun
  {
    slug: "guelmim",
    name: "Guelmim",
    nameFr: "Guelmim",
    nameAr: "كلميم",
    region: "Guelmim-Oued Noun",
    lat: 28.987,
    lng: -10.0574,
    aliases: ["goulimine", "كلميم"],
  },
  {
    slug: "tan-tan",
    name: "Tan-Tan",
    nameFr: "Tan-Tan",
    nameAr: "طانطان",
    region: "Guelmim-Oued Noun",
    lat: 28.438,
    lng: -11.1032,
    aliases: ["tantan", "el ouatia", "طانطان"],
  },
  {
    slug: "sidi-ifni",
    name: "Sidi Ifni",
    nameFr: "Sidi Ifni",
    nameAr: "سيدي إفني",
    region: "Guelmim-Oued Noun",
    lat: 29.3797,
    lng: -10.1726,
    aliases: ["legzira", "سيدي إفني"],
  },
  {
    slug: "mirleft",
    name: "Mirleft",
    nameFr: "Mirleft",
    nameAr: "ميرلفت",
    region: "Guelmim-Oued Noun",
    lat: 29.5789,
    lng: -10.0361,
    aliases: ["ميرلفت"],
  },

  // Laâyoune-Sakia El Hamra
  {
    slug: "laayoune",
    name: "Laâyoune",
    nameFr: "Laâyoune",
    nameAr: "العيون",
    region: "Laâyoune-Sakia El Hamra",
    lat: 27.1536,
    lng: -13.2033,
    aliases: ["laayoune", "el aaiun", "العيون"],
    popular: true,
  },
  {
    slug: "boujdour",
    name: "Boujdour",
    nameFr: "Boujdour",
    nameAr: "بوجدور",
    region: "Laâyoune-Sakia El Hamra",
    lat: 26.1258,
    lng: -14.4842,
    aliases: ["بوجدور"],
  },
  {
    slug: "smara",
    name: "Es-Semara",
    nameFr: "Es-Semara",
    nameAr: "السمارة",
    region: "Laâyoune-Sakia El Hamra",
    lat: 26.7384,
    lng: -11.6719,
    aliases: ["smara", "semara", "السمارة"],
  },
  {
    slug: "tarfaya",
    name: "Tarfaya",
    nameFr: "Tarfaya",
    nameAr: "طرفاية",
    region: "Laâyoune-Sakia El Hamra",
    lat: 27.9392,
    lng: -12.9203,
    aliases: ["طرفاية"],
  },

  // Dakhla-Oued Ed-Dahab
  {
    slug: "dakhla",
    name: "Dakhla",
    nameFr: "Dakhla",
    nameAr: "الداخلة",
    region: "Dakhla-Oued Ed-Dahab",
    lat: 23.7145,
    lng: -15.9368,
    aliases: ["الداخلة"],
    popular: true,
  },
  {
    slug: "lagouira",
    name: "Lagouira",
    nameFr: "Lagouira",
    nameAr: "الكويرة",
    region: "Dakhla-Oued Ed-Dahab",
    lat: 20.8333,
    lng: -17.0917,
    aliases: ["guerguerat", "الكويرة"],
  },
];

export const MOROCCO_CITY_NAMES: string[] = MOROCCO_CITIES.map((c) => c.name);

export const MOROCCO_REGIONS: string[] = Array.from(new Set(MOROCCO_CITIES.map((c) => c.region)));

export const MOROCCO_CITY_SELECT_OPTIONS = MOROCCO_CITIES.map((c) => ({
  value: c.name,
  label: c.name,
  hint: `${c.region} · ${c.nameAr}`,
}));

const LOOKUP = new Map<string, MoroccanCity>();
for (const city of MOROCCO_CITIES) {
  LOOKUP.set(city.slug.toLowerCase(), city);
  LOOKUP.set(city.name.toLowerCase(), city);
  LOOKUP.set(city.nameFr.toLowerCase(), city);
  LOOKUP.set(city.nameAr.toLowerCase(), city);
  for (const a of city.aliases) {
    LOOKUP.set(a.toLowerCase(), city);
  }
}

export function findMoroccanCity(raw: string): MoroccanCity | undefined {
  const key = raw.trim().toLowerCase();
  return LOOKUP.get(key);
}

export function resolveMoroccanCity(raw: string): string {
  const found = findMoroccanCity(raw);
  return found ? found.name : raw.trim();
}

export function findNearestMoroccanCity(lat: number, lng: number): { city: MoroccanCity; distanceKm: number } {
  let bestCity = MOROCCO_CITIES[0];
  let bestDist = Number.POSITIVE_INFINITY;
  const toRad = (d: number) => (d * Math.PI) / 180;
  for (const city of MOROCCO_CITIES) {
    const dLat = toRad(city.lat - lat);
    const dLng = toRad(city.lng - lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat)) * Math.cos(toRad(city.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const dist = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    if (dist < bestDist) {
      bestDist = dist;
      bestCity = city;
    }
  }
  return { city: bestCity, distanceKm: Math.round(bestDist * 10) / 10 };
}
