import { findMoroccanCity, MOROCCO_CITIES } from "./morocco-cities";

export type CarrierType = "train_oncf" | "bus_ctm" | "supratours" | "taxi_transfer";
export type SeatClass = "standard" | "comfort" | "vip";

export interface RouteScheduleOption {
  id: string;
  carrierType: CarrierType;
  carrierBrand: string;
  lineName: string;
  officialUrl: string;
  depTime: string;
  arrTime: string;
  durationMins: number;
  distanceKm: number;
  baseFareMad: number;
  stops: number;
  amenities: string[];
  seatsLeft: number;
  co2SavedKg: number;
  isHighSpeed: boolean;
}

const RAIL_CORRIDORS = new Set([
  "tangier",
  "kenitra",
  "rabat",
  "salé",
  "casablanca",
  "mohammedia",
  "settat",
  "khouribga",
  "béni mellal",
  "marrakech",
  "safi",
  "el jadida",
  "meknes",
  "fès",
  "taza",
  "oujda",
  "nador",
]);

const AL_BORAQ_CORRIDOR = new Set(["tangier", "kenitra", "rabat", "salé", "casablanca"]);

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function addMinutes(timeStr: string, mins: number): string {
  const [h, m] = timeStr.split(":").map(Number);
  const total = (h * 60 + m + mins) % (24 * 60);
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}

export function classMultiplier(seatClass: SeatClass): number {
  if (seatClass === "comfort") return 1.35;
  if (seatClass === "vip") return 1.75;
  return 1;
}

export function computeRouteDistanceKm(originCity: string, destCity: string): number {
  const o = findMoroccanCity(originCity) || MOROCCO_CITIES[0];
  const d = findMoroccanCity(destCity) || MOROCCO_CITIES[1];
  const airKm = haversineKm(o.lat, o.lng, d.lat, d.lng);
  return Math.max(25, Math.round(airKm * 1.24));
}

export function generateMoroccoSchedules(
  originCity: string,
  destCity: string,
  mode: "intercity" | "intracity"
): RouteScheduleOption[] {
  if (mode === "intracity") {
    return [
      {
        id: "intra-airport-1",
        carrierType: "taxi_transfer",
        carrierBrand: "MARHABA Airport Express",
        lineName: "Airport / Station Private Sedan",
        officialUrl: "/services?tab=transport",
        depTime: "08:00",
        arrTime: "08:30",
        durationMins: 30,
        distanceKm: 22,
        baseFareMad: 120,
        stops: 0,
        amenities: ["A/C", "Wi-Fi", "Luggage 25kg", "Door-to-Door"],
        seatsLeft: 4,
        co2SavedKg: 0,
        isHighSpeed: false,
      },
      {
        id: "intra-shuttle-2",
        carrierType: "train_oncf",
        carrierBrand: "ONCF Navette / Tram",
        lineName: "City Center ↔ Airport / Gare",
        officialUrl: "https://www.oncf-voyages.ma",
        depTime: "09:15",
        arrTime: "09:42",
        durationMins: 27,
        distanceKm: 20,
        baseFareMad: 55,
        stops: 1,
        amenities: ["A/C", "Luggage 25kg"],
        seatsLeft: 18,
        co2SavedKg: 3.1,
        isHighSpeed: false,
      },
      {
        id: "intra-van-3",
        carrierType: "taxi_transfer",
        carrierBrand: "MARHABA VIP Van (up to 7)",
        lineName: "Private Group / Family Transfer",
        officialUrl: "/services?tab=transport",
        depTime: "12:00",
        arrTime: "12:35",
        durationMins: 35,
        distanceKm: 22,
        baseFareMad: 220,
        stops: 0,
        amenities: ["A/C", "Wi-Fi", "USB", "Door-to-Door"],
        seatsLeft: 7,
        co2SavedKg: 0,
        isHighSpeed: false,
      },
    ];
  }

  const distanceKm = computeRouteDistanceKm(originCity, destCity);
  const oKey = originCity.trim().toLowerCase();
  const dKey = destCity.trim().toLowerCase();
  const hasRail = RAIL_CORRIDORS.has(oKey) && RAIL_CORRIDORS.has(dKey);
  const hasAlBoraq = AL_BORAQ_CORRIDOR.has(oKey) && AL_BORAQ_CORRIDOR.has(dKey);

  const schedules: RouteScheduleOption[] = [];

  if (hasAlBoraq) {
    const pair = new Set([oKey, dKey]);
    let mins = Math.max(45, Math.round((distanceKm / 195) * 60));
    let fare = Math.max(89, Math.round(distanceKm * 0.55));
    // Official ONCF Al Boraq benchmarks (oncf.ma)
    if (pair.has("tangier") && pair.has("casablanca")) {
      mins = 130; // 2h 10min official
      fare = 149; // standard 2nd class (~99 MAD promo / ~149-229 MAD regular)
    } else if (pair.has("tangier") && (pair.has("rabat") || pair.has("salé"))) {
      mins = 80; // 1h 20min official
      fare = 115;
    } else if (pair.has("tangier") && pair.has("kenitra")) {
      mins = 50; // 50min official
      fare = 89;
    }
    for (const [idx, dep] of ["07:00", "11:00", "16:00", "20:00"].entries()) {
      schedules.push({
        id: `boraq-${idx}`,
        carrierType: "train_oncf",
        carrierBrand: "ONCF Al Boraq TGV",
        lineName: "High-Speed 320 km/h",
        officialUrl: "https://www.oncf-voyages.ma",
        depTime: dep,
        arrTime: addMinutes(dep, mins),
        durationMins: mins,
        distanceKm,
        baseFareMad: fare,
        stops: 1,
        amenities: ["Wi-Fi", "A/C", "USB", "Café Car"],
        seatsLeft: 6 + idx * 3,
        co2SavedKg: Math.round(distanceKm * 0.14 * 10) / 10,
        isHighSpeed: true,
      });
    }
  } else if (hasRail) {
    const mins = Math.max(60, Math.round((distanceKm / 92) * 60));
    const fare = Math.max(65, Math.round(distanceKm * 0.48));
    for (const [idx, dep] of ["06:45", "10:15", "14:45", "18:30"].entries()) {
      schedules.push({
        id: `oncf-${idx}`,
        carrierType: "train_oncf",
        carrierBrand: "ONCF Al Atlas",
        lineName: "Express Rail",
        officialUrl: "https://www.oncf-voyages.ma",
        depTime: dep,
        arrTime: addMinutes(dep, mins),
        durationMins: mins,
        distanceKm,
        baseFareMad: fare,
        stops: Math.min(4, Math.max(1, Math.floor(distanceKm / 80))),
        amenities: ["A/C", "USB", "Luggage 25kg"],
        seatsLeft: 9 + idx * 4,
        co2SavedKg: Math.round(distanceKm * 0.12 * 10) / 10,
        isHighSpeed: false,
      });
    }
  }

  // CTM Premium Coach (available nationwide across all 56 cities)
  const ctmMins = Math.max(65, Math.round((distanceKm / 76) * 60));
  const ctmFare = Math.max(55, Math.round(distanceKm * 0.4));
  for (const [idx, dep] of ["07:30", "13:00", "21:30"].entries()) {
    schedules.push({
      id: `ctm-${idx}`,
      carrierType: "bus_ctm",
      carrierBrand: "CTM Confort",
      lineName: idx === 2 && distanceKm > 380 ? "Confort Plus Night" : "Intercity Coach",
      officialUrl: "https://booking.ctm.ma",
      depTime: dep,
      arrTime: addMinutes(dep, ctmMins),
      durationMins: ctmMins,
      distanceKm,
      baseFareMad: ctmFare,
      stops: Math.min(5, Math.max(1, Math.floor(distanceKm / 110))),
      amenities: ["Wi-Fi", "A/C", "USB", "Luggage 25kg"],
      seatsLeft: 5 + idx * 5,
      co2SavedKg: Math.round(distanceKm * 0.09 * 10) / 10,
      isHighSpeed: false,
    });
  }

  // Supratours Coach (ONCF multimodal coach network, strong in South/Atlas/Sahara)
  const supMins = Math.max(70, Math.round((distanceKm / 74) * 60));
  const supFare = Math.max(50, Math.round(distanceKm * 0.37));
  for (const [idx, dep] of ["09:00", "15:30", "22:15"].entries()) {
    schedules.push({
      id: `supra-${idx}`,
      carrierType: "supratours",
      carrierBrand: "Supratours",
      lineName: "ONCF Multimodal Coach",
      officialUrl: "https://www.supratours.ma",
      depTime: dep,
      arrTime: addMinutes(dep, supMins),
      durationMins: supMins,
      distanceKm,
      baseFareMad: supFare,
      stops: Math.min(5, Math.max(1, Math.floor(distanceKm / 105))),
      amenities: ["A/C", "Luggage 25kg"],
      seatsLeft: 7 + idx * 3,
      co2SavedKg: Math.round(distanceKm * 0.09 * 10) / 10,
      isHighSpeed: false,
    });
  }

  // Door-to-door Private VIP Transfer (advantage over Markoub!)
  const carMins = Math.max(55, Math.round((distanceKm / 88) * 60));
  const carFare = Math.max(260, Math.round(distanceKm * 1.95));
  schedules.push({
    id: "vip-transfer-0",
    carrierType: "taxi_transfer",
    carrierBrand: "MARHABA Private VIP",
    lineName: "Door-to-Door Sedan / SUV",
    officialUrl: "/services?tab=transport",
    depTime: "08:30",
    arrTime: addMinutes("08:30", carMins),
    durationMins: carMins,
    distanceKm,
    baseFareMad: carFare,
    stops: 0,
    amenities: ["Wi-Fi", "A/C", "Door-to-Door", "Luggage 25kg"],
    seatsLeft: 4,
    co2SavedKg: 0,
    isHighSpeed: false,
  });

  return schedules;
}
