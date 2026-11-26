export type StayCategoryId = "hotel" | "apartment" | "riad" | "villa" | "resort";

export interface StayCategoryMeta {
  id: StayCategoryId;
  labelKey: "catHotels" | "catApartments" | "catRiads" | "catVillas" | "catResorts";
  singularKey: "catHotel" | "catApartment" | "catRiad" | "catVilla" | "catResort";
  taglineKey:
    | "stayCatHotelDesc"
    | "stayCatApartmentDesc"
    | "stayCatRiadDesc"
    | "stayCatVillaDesc"
    | "stayCatResortDesc";
  accentHex: string;
  softBg: string;
  softBorder: string;
  badgeText: string;
  coverImage: string;
}

export const STAY_CATEGORIES: StayCategoryMeta[] = [
  {
    id: "hotel",
    labelKey: "catHotels",
    singularKey: "catHotel",
    taglineKey: "stayCatHotelDesc",
    accentHex: "#1F40C5",
    softBg: "rgba(31, 64, 197, 0.09)",
    softBorder: "rgba(31, 64, 197, 0.28)",
    badgeText: "#1631A0",
    coverImage: "/images/listings/hotel-marrakech.jpg",
  },
  {
    id: "apartment",
    labelKey: "catApartments",
    singularKey: "catApartment",
    taglineKey: "stayCatApartmentDesc",
    accentHex: "#0F766E",
    softBg: "rgba(15, 118, 110, 0.09)",
    softBorder: "rgba(15, 118, 110, 0.28)",
    badgeText: "#0B5B55",
    coverImage: "/images/listings/apt-tanger-strait.jpg",
  },
  {
    id: "riad",
    labelKey: "catRiads",
    singularKey: "catRiad",
    taglineKey: "stayCatRiadDesc",
    accentHex: "#B45309",
    softBg: "rgba(180, 83, 9, 0.1)",
    softBorder: "rgba(180, 83, 9, 0.3)",
    badgeText: "#92400E",
    coverImage: "/images/listings/3.jpg",
  },
  {
    id: "villa",
    labelKey: "catVillas",
    singularKey: "catVilla",
    taglineKey: "stayCatVillaDesc",
    accentHex: "#9A6700",
    softBg: "rgba(242, 183, 5, 0.14)",
    softBorder: "rgba(180, 128, 0, 0.34)",
    badgeText: "#7C5200",
    coverImage: "/images/listings/villa-marrakech.webp",
  },
  {
    id: "resort",
    labelKey: "catResorts",
    singularKey: "catResort",
    taglineKey: "stayCatResortDesc",
    accentHex: "#047857",
    softBg: "rgba(4, 120, 87, 0.1)",
    softBorder: "rgba(4, 120, 87, 0.28)",
    badgeText: "#065F46",
    coverImage: "/images/listings/resort-agadir.jpg",
  },
];

export function getStayCategoryMeta(category?: string): StayCategoryMeta | undefined {
  const c = (category || "").toLowerCase();
  if (c === "guesthouse") return STAY_CATEGORIES.find((s) => s.id === "riad");
  return STAY_CATEGORIES.find((s) => s.id === c);
}
