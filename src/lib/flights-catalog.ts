export type AirlineCode = "AT" | "3O" | "TO" | "FR" | "IB" | "VY" | "U2" | "TB" | "AF" | "LH" | "TK" | "QR" | "NT";

export interface AirlineInfo {
  code: AirlineCode;
  name: string;
  shortName: string;
  hub: string;
  accentHex: string;
  baggageNote: string;
  aircraftFleet: string[];
}

export interface AirportInfo {
  code: string;
  city: string;
  name: string;
  country: string;
  terminal: string;
  transferNote: string;
  image: string;
}

export interface FlightOffer {
  offerCode: string;
  airlineCode: AirlineCode;
  flightNumber: string;
  aircraft: string;
  originCode: string;
  originCity: string;
  originAirport: string;
  originTerminal: string;
  destinationCode: string;
  destinationCity: string;
  destinationAirport: string;
  destinationTerminal: string;
  depTime: string;
  arrTime: string;
  durationMins: number;
  stops: 0 | 1;
  viaCode?: string;
  viaCity?: string;
  layoverMins?: number;
  baseFareMad: number;
  seatsLeft: number;
  baggageIncluded: string;
  amenities: string[];
  co2Kg: number;
  image: string;
}

export const AIRLINES: Record<AirlineCode, AirlineInfo> = {
  AT: {
    code: "AT",
    name: "Royal Air Maroc",
    shortName: "RAM",
    hub: "Casablanca (CMN)",
    accentHex: "#c20e1a",
    baggageNote: "10 kg cabin + 23 kg checked included on Classic fares",
    aircraftFleet: ["Boeing 737-800", "Boeing 737 MAX 8", "Boeing 787-9", "ATR 72-600"],
  },
  "3O": {
    code: "3O",
    name: "Air Arabia Maroc",
    shortName: "Air Arabia",
    hub: "Casablanca / Tangier / Fès",
    accentHex: "#e11d48",
    baggageNote: "10 kg cabin included · 20 kg checked optional",
    aircraftFleet: ["Airbus A320-200"],
  },
  TO: {
    code: "TO",
    name: "Transavia",
    shortName: "Transavia",
    hub: "Paris Orly / Amsterdam",
    accentHex: "#00a86b",
    baggageNote: "10 kg cabin included · 20–23 kg hold add-on",
    aircraftFleet: ["Boeing 737-800", "Airbus A320neo"],
  },
  FR: {
    code: "FR",
    name: "Ryanair",
    shortName: "Ryanair",
    hub: "Marrakech / Agadir / Fès",
    accentHex: "#073590",
    baggageNote: "Priority cabin bag · 20 kg checked optional",
    aircraftFleet: ["Boeing 737-800", "Boeing 737-8200"],
  },
  IB: {
    code: "IB",
    name: "Iberia",
    shortName: "Iberia",
    hub: "Madrid (MAD)",
    accentHex: "#d9272e",
    baggageNote: "10 kg cabin + 23 kg checked on Optima/Classic",
    aircraftFleet: ["Airbus A320", "Airbus A321", "CRJ-1000"],
  },
  VY: {
    code: "VY",
    name: "Vueling",
    shortName: "Vueling",
    hub: "Barcelona (BCN)",
    accentHex: "#ffcc00",
    baggageNote: "Underseat bag included · Overhead cabin & 25 kg optional",
    aircraftFleet: ["Airbus A320", "Airbus A320neo", "Airbus A321"],
  },
  U2: {
    code: "U2",
    name: "easyJet",
    shortName: "easyJet",
    hub: "London Gatwick / Geneva / Paris CDG",
    accentHex: "#ff6600",
    baggageNote: "Small cabin bag included · 15–23 kg hold optional",
    aircraftFleet: ["Airbus A320", "Airbus A320neo", "Airbus A321neo"],
  },
  TB: {
    code: "TB",
    name: "TUI fly",
    shortName: "TUI fly",
    hub: "Brussels / Paris Orly / Casablanca",
    accentHex: "#d40e14",
    baggageNote: "10 kg cabin included · Sun charter & 20 kg add-on",
    aircraftFleet: ["Boeing 737-800", "Boeing 737 MAX 8"],
  },
  AF: {
    code: "AF",
    name: "Air France",
    shortName: "Air France",
    hub: "Paris CDG",
    accentHex: "#002157",
    baggageNote: "12 kg cabin + 23 kg checked on Standard",
    aircraftFleet: ["Airbus A320", "Airbus A220-300"],
  },
  LH: {
    code: "LH",
    name: "Lufthansa",
    shortName: "Lufthansa",
    hub: "Frankfurt (FRA)",
    accentHex: "#05164d",
    baggageNote: "8 kg cabin + 23 kg checked on Economy Classic",
    aircraftFleet: ["Airbus A320neo", "Airbus A321"],
  },
  TK: {
    code: "TK",
    name: "Turkish Airlines",
    shortName: "Turkish",
    hub: "Istanbul (IST)",
    accentHex: "#c8102e",
    baggageNote: "8 kg cabin + 30 kg checked + Hot meal included",
    aircraftFleet: ["Boeing 737 MAX 8", "Airbus A321neo", "Boeing 787-9"],
  },
  QR: {
    code: "QR",
    name: "Qatar Airways",
    shortName: "Qatar",
    hub: "Doha (DOH)",
    accentHex: "#5c0632",
    baggageNote: "7 kg cabin + 25–30 kg checked + Award-winning dining",
    aircraftFleet: ["Boeing 787-8 Dreamliner", "Boeing 787-9"],
  },
  NT: {
    code: "NT",
    name: "Binter Canarias",
    shortName: "Binter",
    hub: "Gran Canaria / Atlantic Sahara",
    accentHex: "#0284c7",
    baggageNote: "Complimentary snack & 23 kg checked bag",
    aircraftFleet: ["ATR 72-600", "Embraer E195-E2"],
  },
};

export const AIRPORTS_CATALOG: AirportInfo[] = [
  {
    code: "CMN",
    city: "Casablanca",
    name: "Mohammed V Int'l",
    country: "Morocco",
    terminal: "T1 / T2",
    transferNote: "ONCF Al Bidaoui Train every 1h · 30 min (50 MAD)",
    image: "/images/services/flights.jpg",
  },
  {
    code: "RAK",
    city: "Marrakech",
    name: "Menara Int'l",
    country: "Morocco",
    terminal: "T1",
    transferNote: "ALSA Bus L19 every 20m (30 MAD) · Taxi 15 min",
    image: "/images/services/flights-onda-terminal.jpg",
  },
  {
    code: "RBA",
    city: "Rabat",
    name: "Rabat-Salé Int'l",
    country: "Morocco",
    terminal: "T1",
    transferNote: "Airport Express Shuttle & Tramway · 20 min",
    image: "/images/destinations/rabat.jpg",
  },
  {
    code: "TNG",
    city: "Tangier",
    name: "Ibn Battouta Int'l",
    country: "Morocco",
    terminal: "T1",
    transferNote: "Airport Shuttle / Grand Taxi · 20 min to Al Boraq",
    image: "/images/destinations/tanger.jpg",
  },
  {
    code: "AGA",
    city: "Agadir",
    name: "Al Massira Int'l",
    country: "Morocco",
    terminal: "T1",
    transferNote: "ALSA Bus L37 / Private Transfer · 30 min",
    image: "/images/listings/exp-surf-yoga.jpg",
  },
  {
    code: "FEZ",
    city: "Fès",
    name: "Fès-Saïss Int'l",
    country: "Morocco",
    terminal: "T1",
    transferNote: "City Bus L16 · 20 min to ONCF Fès-Ville",
    image: "/images/services/flights-onda-terminal.jpg",
  },
  {
    code: "EUN",
    city: "Laâyoune",
    name: "Hassan I Airport",
    country: "Morocco",
    terminal: "Main",
    transferNote: "Royal Air Maroc Hub · City Taxi 10 min",
    image: "/images/services/flights-ram-wing.jpg",
  },
  {
    code: "VIL",
    city: "Dakhla",
    name: "Dakhla Int'l",
    country: "Morocco",
    terminal: "Main",
    transferNote: "Direct CMN/ORY flights · Lagoon Transfer 10 min",
    image: "/images/listings/exp-kitesurf.jpg",
  },
  {
    code: "OZZ",
    city: "Ouarzazate",
    name: "Ouarzazate Airport",
    country: "Morocco",
    terminal: "Main",
    transferNote: "5 min to Medina & Atlas Studios",
    image: "/images/destinations/ouarzazate.jpg",
  },
  {
    code: "ESU",
    city: "Essaouira",
    name: "Mogador Airport",
    country: "Morocco",
    terminal: "Main",
    transferNote: "Airport Shuttle & Taxi · 18 min to Medina",
    image: "/images/destinations/essaouira.jpg",
  },
  {
    code: "OUD",
    city: "Oujda",
    name: "Oujda Angads",
    country: "Morocco",
    terminal: "Main",
    transferNote: "Taxi / Shuttle · 15 min to Oujda Center",
    image: "/images/services/flights-onda-terminal.jpg",
  },
  {
    code: "NDR",
    city: "Nador",
    name: "Nador El Aroui",
    country: "Morocco",
    terminal: "Main",
    transferNote: "CTM / Grand Taxi · 25 min to Marchica Lagoon",
    image: "/images/services/flights-onda-terminal.jpg",
  },
  {
    code: "ORY",
    city: "Paris",
    name: "Paris Orly",
    country: "France",
    terminal: "Orly 3 / 4",
    transferNote: "Metro Line 14 direct to Paris center (25 min)",
    image: "/images/services/flights-ram-wing.jpg",
  },
  {
    code: "CDG",
    city: "Paris",
    name: "Paris Charles de Gaulle",
    country: "France",
    terminal: "T2E / T2B",
    transferNote: "RER B & TGV Station inside Terminal 2",
    image: "/images/services/flights-ram-wing.jpg",
  },
  {
    code: "MAD",
    city: "Madrid",
    name: "Adolfo Suárez Barajas",
    country: "Spain",
    terminal: "T4 / T1",
    transferNote: "Metro Line 8 & Cercanías C1",
    image: "/images/services/flights-ram-wing.jpg",
  },
  {
    code: "BCN",
    city: "Barcelona",
    name: "El Prat",
    country: "Spain",
    terminal: "T1 / T2",
    transferNote: "Aerobús & Metro L9 Sud",
    image: "/images/services/flights-ram-wing.jpg",
  },
  {
    code: "LGW",
    city: "London",
    name: "London Gatwick",
    country: "United Kingdom",
    terminal: "South / North",
    transferNote: "Gatwick Express 30 min to London Victoria",
    image: "/images/services/flights-ram-wing.jpg",
  },
  {
    code: "BRU",
    city: "Brussels",
    name: "Brussels Zaventem",
    country: "Belgium",
    terminal: "Main",
    transferNote: "SNCB Airport Express 17 min to Brussels Central",
    image: "/images/services/flights-ram-wing.jpg",
  },
  {
    code: "AMS",
    city: "Amsterdam",
    name: "Amsterdam Schiphol",
    country: "Netherlands",
    terminal: "Hall 3",
    transferNote: "NS Direct Train 15 min to Amsterdam Centraal",
    image: "/images/services/flights-ram-wing.jpg",
  },
  {
    code: "LIS",
    city: "Lisbon",
    name: "Humberto Delgado",
    country: "Portugal",
    terminal: "T1",
    transferNote: "Metro Red Line direct to city center",
    image: "/images/services/flights-ram-wing.jpg",
  },
  {
    code: "LPA",
    city: "Gran Canaria",
    name: "Gran Canaria Airport",
    country: "Spain",
    terminal: "Main",
    transferNote: "Direct Atlantic flights to Laâyoune & Dakhla",
    image: "/images/services/flights-ram-wing.jpg",
  },
  {
    code: "GVA",
    city: "Geneva",
    name: "Geneva Airport",
    country: "Switzerland",
    terminal: "Main",
    transferNote: "SBB Direct Train 7 min to Geneva Cornavin",
    image: "/images/services/flights-ram-wing.jpg",
  },
  {
    code: "FRA",
    city: "Frankfurt",
    name: "Frankfurt Airport",
    country: "Germany",
    terminal: "T1 / T2",
    transferNote: "S-Bahn & ICE Rail Station inside Terminal 1",
    image: "/images/services/flights-ram-wing.jpg",
  },
  {
    code: "IST",
    city: "Istanbul",
    name: "Istanbul Airport",
    country: "Turkey",
    terminal: "Main",
    transferNote: "Metro M11 & Havaist direct airport express",
    image: "/images/services/flights-ram-wing.jpg",
  },
  {
    code: "DOH",
    city: "Doha",
    name: "Hamad Int'l Airport",
    country: "Qatar",
    terminal: "Main",
    transferNote: "Doha Metro Red Line direct to city center",
    image: "/images/services/flights-ram-wing.jpg",
  },
];

function findAirport(code: string): AirportInfo {
  return AIRPORTS_CATALOG.find((a) => a.code === code) || AIRPORTS_CATALOG[0];
}

function addMins(hhmm: string, add: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const tot = ((h * 60 + m + add) % 1440 + 1440) % 1440;
  return `${String(Math.floor(tot / 60)).padStart(2, "0")}:${String(tot % 60).padStart(2, "0")}`;
}

interface RouteSeed {
  origin: string;
  dest: string;
  airline: AirlineCode;
  flightNo: string;
  aircraft: string;
  dep: string;
  mins: number;
  fareMad: number;
  seats: number;
  baggage: string;
  amenities: string[];
  co2: number;
}

const DIRECT_FLIGHT_SEEDS: RouteSeed[] = [
  // Domestic Morocco — Casablanca CMN Trunk & Saharan Air Bridge
  { origin: "CMN", dest: "EUN", airline: "AT", flightNo: "AT 431", aircraft: "Boeing 737-800", dep: "07:45", mins: 105, fareMad: 840, seats: 9, baggage: "23 kg + 10 kg", amenities: ["23kg Bag", "Snack & Mint Tea", "Priority Gate"], co2: 96 },
  { origin: "CMN", dest: "EUN", airline: "AT", flightNo: "AT 435", aircraft: "Boeing 737 MAX 8", dep: "15:20", mins: 105, fareMad: 920, seats: 5, baggage: "23 kg + 10 kg", amenities: ["23kg Bag", "USB Power", "Refreshments"], co2: 92 },
  { origin: "CMN", dest: "EUN", airline: "AT", flightNo: "AT 439", aircraft: "ATR 72-600", dep: "21:10", mins: 115, fareMad: 790, seats: 12, baggage: "23 kg + 10 kg", amenities: ["23kg Bag", "Evening Hop", "Hot Beverage"], co2: 78 },
  { origin: "EUN", dest: "CMN", airline: "AT", flightNo: "AT 432", aircraft: "Boeing 737-800", dep: "10:15", mins: 105, fareMad: 840, seats: 8, baggage: "23 kg + 10 kg", amenities: ["23kg Bag", "Snack & Mint Tea"], co2: 96 },
  { origin: "EUN", dest: "CMN", airline: "AT", flightNo: "AT 436", aircraft: "Boeing 737 MAX 8", dep: "17:50", mins: 105, fareMad: 910, seats: 6, baggage: "23 kg + 10 kg", amenities: ["23kg Bag", "USB Power"], co2: 92 },

  { origin: "CMN", dest: "VIL", airline: "AT", flightNo: "AT 461", aircraft: "Boeing 737-800", dep: "08:15", mins: 135, fareMad: 980, seats: 7, baggage: "23 kg + 10 kg", amenities: ["23kg Bag", "Kitesurf Gear Ready", "Meal"], co2: 124 },
  { origin: "CMN", dest: "VIL", airline: "AT", flightNo: "AT 465", aircraft: "Boeing 737 MAX 8", dep: "16:40", mins: 130, fareMad: 1120, seats: 4, baggage: "23 kg + 10 kg", amenities: ["23kg Bag", "USB Power", "Meal"], co2: 118 },
  { origin: "VIL", dest: "CMN", airline: "AT", flightNo: "AT 462", aircraft: "Boeing 737-800", dep: "11:25", mins: 135, fareMad: 980, seats: 11, baggage: "23 kg + 10 kg", amenities: ["23kg Bag", "Kitesurf Gear Ready"], co2: 124 },

  { origin: "AGA", dest: "EUN", airline: "AT", flightNo: "AT 1435", aircraft: "ATR 72-600", dep: "11:40", mins: 70, fareMad: 680, seats: 8, baggage: "23 kg + 10 kg", amenities: ["23kg Bag", "Scenic Coast", "Direct"], co2: 58 },
  { origin: "EUN", dest: "AGA", airline: "AT", flightNo: "AT 1436", aircraft: "ATR 72-600", dep: "13:20", mins: 70, fareMad: 680, seats: 9, baggage: "23 kg + 10 kg", amenities: ["23kg Bag", "Direct"], co2: 58 },
  { origin: "AGA", dest: "VIL", airline: "AT", flightNo: "AT 1463", aircraft: "Boeing 737-800", dep: "13:05", mins: 100, fareMad: 850, seats: 6, baggage: "23 kg + 10 kg", amenities: ["23kg Bag", "Surfboard Add-on"], co2: 90 },
  { origin: "EUN", dest: "VIL", airline: "AT", flightNo: "AT 431B", aircraft: "ATR 72-600", dep: "10:15", mins: 60, fareMad: 590, seats: 10, baggage: "23 kg + 10 kg", amenities: ["23kg Bag", "Saharan Hop"], co2: 49 },
  { origin: "RAK", dest: "VIL", airline: "AT", flightNo: "AT 1465", aircraft: "Boeing 737-800", dep: "10:50", mins: 115, fareMad: 920, seats: 6, baggage: "23 kg + 10 kg", amenities: ["23kg Bag", "Direct Lagoon"], co2: 105 },

  { origin: "CMN", dest: "RAK", airline: "AT", flightNo: "AT 411", aircraft: "ATR 72-600", dep: "09:10", mins: 50, fareMad: 540, seats: 14, baggage: "23 kg + 10 kg", amenities: ["23kg Bag", "Fast Hop"], co2: 44 },
  { origin: "CMN", dest: "RAK", airline: "AT", flightNo: "AT 415", aircraft: "Boeing 737-800", dep: "18:30", mins: 45, fareMad: 610, seats: 10, baggage: "23 kg + 10 kg", amenities: ["23kg Bag", "Evening"], co2: 48 },
  { origin: "RAK", dest: "CMN", airline: "AT", flightNo: "AT 412", aircraft: "ATR 72-600", dep: "10:35", mins: 50, fareMad: 540, seats: 12, baggage: "23 kg + 10 kg", amenities: ["23kg Bag"], co2: 44 },

  { origin: "CMN", dest: "AGA", airline: "AT", flightNo: "AT 451", aircraft: "Boeing 737-800", dep: "08:50", mins: 65, fareMad: 620, seats: 11, baggage: "23 kg + 10 kg", amenities: ["23kg Bag", "Refreshments"], co2: 66 },
  { origin: "CMN", dest: "AGA", airline: "3O", flightNo: "3O 315", aircraft: "Airbus A320", dep: "14:25", mins: 65, fareMad: 490, seats: 9, baggage: "10 kg Cabin", amenities: ["10kg Cabin", "Low Fare"], co2: 64 },
  { origin: "AGA", dest: "CMN", airline: "AT", flightNo: "AT 452", aircraft: "Boeing 737-800", dep: "10:40", mins: 65, fareMad: 620, seats: 10, baggage: "23 kg + 10 kg", amenities: ["23kg Bag"], co2: 66 },

  { origin: "CMN", dest: "TNG", airline: "AT", flightNo: "AT 491", aircraft: "ATR 72-600", dep: "08:05", mins: 60, fareMad: 560, seats: 12, baggage: "23 kg + 10 kg", amenities: ["23kg Bag"], co2: 52 },
  { origin: "CMN", dest: "TNG", airline: "3O", flightNo: "3O 301", aircraft: "Airbus A320", dep: "19:15", mins: 55, fareMad: 450, seats: 7, baggage: "10 kg Cabin", amenities: ["10kg Cabin", "Value Fare"], co2: 54 },
  { origin: "TNG", dest: "CMN", airline: "AT", flightNo: "AT 492", aircraft: "ATR 72-600", dep: "09:40", mins: 60, fareMad: 560, seats: 10, baggage: "23 kg + 10 kg", amenities: ["23kg Bag"], co2: 52 },

  { origin: "CMN", dest: "FEZ", airline: "AT", flightNo: "AT 481", aircraft: "ATR 72-600", dep: "12:15", mins: 55, fareMad: 530, seats: 11, baggage: "23 kg + 10 kg", amenities: ["23kg Bag"], co2: 46 },
  { origin: "CMN", dest: "OZZ", airline: "AT", flightNo: "AT 405", aircraft: "ATR 72-600", dep: "13:45", mins: 65, fareMad: 640, seats: 8, baggage: "23 kg + 10 kg", amenities: ["23kg Bag", "Atlas View"], co2: 56 },

  // International <-> Morocco Authentic Corridors
  { origin: "ORY", dest: "RAK", airline: "AT", flightNo: "AT 765", aircraft: "Boeing 737 MAX 8", dep: "07:55", mins: 205, fareMad: 1490, seats: 8, baggage: "23 kg + 10 kg", amenities: ["23kg Bag", "Hot Meal", "In-flight USB"], co2: 192 },
  { origin: "ORY", dest: "RAK", airline: "TO", flightNo: "TO 3014", aircraft: "Airbus A320neo", dep: "11:20", mins: 210, fareMad: 1140, seats: 5, baggage: "10 kg Cabin", amenities: ["10kg Cabin", "Direct Orly", "Low Emissions"], co2: 175 },
  { origin: "ORY", dest: "RAK", airline: "TO", flightNo: "TO 3018", aircraft: "Boeing 737-800", dep: "17:45", mins: 210, fareMad: 1290, seats: 9, baggage: "10 kg Cabin", amenities: ["10kg Cabin", "Evening Flight"], co2: 188 },
  { origin: "CDG", dest: "RAK", airline: "AF", flightNo: "AF 1076", aircraft: "Airbus A220-300", dep: "09:40", mins: 205, fareMad: 1750, seats: 6, baggage: "23 kg + 12 kg", amenities: ["23kg Bag", "Wi-Fi", "French Bistro"], co2: 170 },
  { origin: "RAK", dest: "ORY", airline: "AT", flightNo: "AT 764", aircraft: "Boeing 737 MAX 8", dep: "12:15", mins: 200, fareMad: 1460, seats: 10, baggage: "23 kg + 10 kg", amenities: ["23kg Bag", "Hot Meal"], co2: 190 },

  { origin: "ORY", dest: "CMN", airline: "AT", flightNo: "AT 761", aircraft: "Boeing 787-9 Dreamliner", dep: "08:30", mins: 185, fareMad: 1580, seats: 12, baggage: "23 kg + 10 kg", amenities: ["23kg Bag", "Dreamliner IFE", "Hot Meal"], co2: 178 },
  { origin: "ORY", dest: "CMN", airline: "TO", flightNo: "TO 3002", aircraft: "Airbus A320neo", dep: "14:15", mins: 190, fareMad: 1190, seats: 7, baggage: "10 kg Cabin", amenities: ["10kg Cabin", "A320neo"], co2: 162 },
  { origin: "CDG", dest: "CMN", airline: "AF", flightNo: "AF 1496", aircraft: "Airbus A320", dep: "16:20", mins: 190, fareMad: 1840, seats: 6, baggage: "23 kg + 12 kg", amenities: ["23kg Bag", "Wi-Fi", "Meal"], co2: 176 },
  { origin: "CMN", dest: "ORY", airline: "AT", flightNo: "AT 760", aircraft: "Boeing 787-9 Dreamliner", dep: "13:05", mins: 185, fareMad: 1550, seats: 14, baggage: "23 kg + 10 kg", amenities: ["23kg Bag", "Dreamliner"], co2: 178 },

  { origin: "ORY", dest: "AGA", airline: "AT", flightNo: "AT 745", aircraft: "Boeing 737-800", dep: "09:15", mins: 220, fareMad: 1420, seats: 7, baggage: "23 kg + 10 kg", amenities: ["23kg Bag", "Meal"], co2: 204 },
  { origin: "ORY", dest: "AGA", airline: "TO", flightNo: "TO 3044", aircraft: "Airbus A320neo", dep: "13:40", mins: 220, fareMad: 1120, seats: 5, baggage: "10 kg Cabin", amenities: ["10kg Cabin", "Direct Sun"], co2: 185 },

  { origin: "ORY", dest: "VIL", airline: "AT", flightNo: "AT 769", aircraft: "Boeing 737 MAX 8", dep: "08:55", mins: 270, fareMad: 2190, seats: 4, baggage: "23 kg + 10 kg", amenities: ["23kg Bag", "Kitesurf Ready", "Meal"], co2: 245 },
  { origin: "ORY", dest: "VIL", airline: "TO", flightNo: "TO 3090", aircraft: "Airbus A320neo", dep: "10:15", mins: 275, fareMad: 1890, seats: 6, baggage: "10 kg Cabin", amenities: ["10kg Cabin", "Direct Lagoon"], co2: 230 },

  { origin: "ORY", dest: "FEZ", airline: "3O", flightNo: "3O 322", aircraft: "Airbus A320", dep: "10:30", mins: 180, fareMad: 990, seats: 8, baggage: "10 kg Cabin", amenities: ["10kg Cabin", "Direct Fès"], co2: 168 },
  { origin: "ORY", dest: "FEZ", airline: "TO", flightNo: "TO 3070", aircraft: "Boeing 737-800", dep: "15:50", mins: 180, fareMad: 1150, seats: 9, baggage: "10 kg Cabin", amenities: ["10kg Cabin"], co2: 172 },

  { origin: "ORY", dest: "ESU", airline: "TO", flightNo: "TO 3062", aircraft: "Airbus A320neo", dep: "11:45", mins: 215, fareMad: 1180, seats: 7, baggage: "10 kg Cabin", amenities: ["10kg Cabin", "Direct Coast"], co2: 182 },

  { origin: "MAD", dest: "CMN", airline: "AT", flightNo: "AT 971", aircraft: "Boeing 737-800", dep: "10:05", mins: 105, fareMad: 980, seats: 11, baggage: "23 kg + 10 kg", amenities: ["23kg Bag", "Snack"], co2: 98 },
  { origin: "MAD", dest: "CMN", airline: "IB", flightNo: "IB 3340", aircraft: "Airbus A320", dep: "16:35", mins: 105, fareMad: 1090, seats: 9, baggage: "23 kg + 10 kg", amenities: ["23kg Bag", "T4 Direct"], co2: 96 },
  { origin: "MAD", dest: "RAK", airline: "IB", flightNo: "IB 3344", aircraft: "CRJ-1000", dep: "11:50", mins: 125, fareMad: 940, seats: 8, baggage: "23 kg + 10 kg", amenities: ["23kg Bag"], co2: 112 },
  { origin: "MAD", dest: "RAK", airline: "FR", flightNo: "FR 2812", aircraft: "Boeing 737-8200", dep: "19:10", mins: 125, fareMad: 690, seats: 6, baggage: "Small Personal Bag", amenities: ["Ultra Low Fare", "Direct"], co2: 106 },
  { origin: "MAD", dest: "TNG", airline: "FR", flightNo: "FR 2104", aircraft: "Boeing 737-800", dep: "08:20", mins: 85, fareMad: 580, seats: 10, baggage: "Small Personal Bag", amenities: ["Short Hop", "Direct"], co2: 76 },
  { origin: "MAD", dest: "TNG", airline: "AT", flightNo: "AT 975", aircraft: "ATR 72-600", dep: "15:10", mins: 90, fareMad: 820, seats: 9, baggage: "23 kg + 10 kg", amenities: ["23kg Bag"], co2: 68 },

  { origin: "BCN", dest: "RAK", airline: "VY", flightNo: "VY 7332", aircraft: "Airbus A320neo", dep: "09:25", mins: 150, fareMad: 890, seats: 9, baggage: "10 kg Cabin", amenities: ["Vueling Direct", "USB"], co2: 132 },
  { origin: "BCN", dest: "RAK", airline: "FR", flightNo: "FR 6341", aircraft: "Boeing 737-800", dep: "17:30", mins: 150, fareMad: 720, seats: 5, baggage: "Small Personal Bag", amenities: ["Value Fare"], co2: 130 },
  { origin: "RAK", dest: "BCN", airline: "VY", flightNo: "VY 7333", aircraft: "Airbus A320neo", dep: "13:10", mins: 150, fareMad: 870, seats: 11, baggage: "10 kg Cabin", amenities: ["Vueling Direct"], co2: 132 },
  { origin: "BCN", dest: "CMN", airline: "VY", flightNo: "VY 7310", aircraft: "Airbus A320", dep: "11:15", mins: 130, fareMad: 860, seats: 8, baggage: "10 kg Cabin", amenities: ["Vueling Direct"], co2: 120 },
  { origin: "BCN", dest: "TNG", airline: "3O", flightNo: "3O 378", aircraft: "Airbus A320", dep: "12:40", mins: 115, fareMad: 640, seats: 8, baggage: "10 kg Cabin", amenities: ["10kg Cabin"], co2: 102 },
  { origin: "BCN", dest: "TNG", airline: "VY", flightNo: "VY 7352", aircraft: "Airbus A320", dep: "16:20", mins: 115, fareMad: 740, seats: 9, baggage: "10 kg Cabin", amenities: ["Vueling Direct"], co2: 104 },

  { origin: "LGW", dest: "RAK", airline: "AT", flightNo: "AT 801", aircraft: "Boeing 737 MAX 8", dep: "08:40", mins: 215, fareMad: 1540, seats: 9, baggage: "23 kg + 10 kg", amenities: ["23kg Bag", "Hot Meal"], co2: 205 },
  { origin: "LGW", dest: "RAK", airline: "U2", flightNo: "U2 8027", aircraft: "Airbus A320neo", dep: "10:15", mins: 210, fareMad: 1050, seats: 7, baggage: "Cabin Bag", amenities: ["easyJet Direct", "Allocated Seat"], co2: 186 },
  { origin: "LGW", dest: "RAK", airline: "FR", flightNo: "FR 3512", aircraft: "Boeing 737-8200", dep: "14:55", mins: 215, fareMad: 980, seats: 4, baggage: "Small Personal Bag", amenities: ["Direct Gatwick"], co2: 192 },
  { origin: "RAK", dest: "LGW", airline: "U2", flightNo: "U2 8028", aircraft: "Airbus A320neo", dep: "15:25", mins: 215, fareMad: 1040, seats: 10, baggage: "Cabin Bag", amenities: ["easyJet Direct"], co2: 186 },
  { origin: "LGW", dest: "AGA", airline: "U2", flightNo: "U2 8073", aircraft: "Airbus A320neo", dep: "09:20", mins: 225, fareMad: 1090, seats: 8, baggage: "Cabin Bag", amenities: ["easyJet Sun", "Direct Agadir"], co2: 198 },
  { origin: "LGW", dest: "ESU", airline: "U2", flightNo: "U2 8091", aircraft: "Airbus A320", dep: "11:30", mins: 220, fareMad: 1120, seats: 6, baggage: "Cabin Bag", amenities: ["Direct Coast"], co2: 194 },
  { origin: "CDG", dest: "RAK", airline: "U2", flightNo: "U2 4561", aircraft: "Airbus A320neo", dep: "13:15", mins: 205, fareMad: 1080, seats: 9, baggage: "Cabin Bag", amenities: ["easyJet Direct"], co2: 174 },
  { origin: "GVA", dest: "RAK", airline: "U2", flightNo: "U2 1353", aircraft: "Airbus A320neo", dep: "10:45", mins: 195, fareMad: 1240, seats: 7, baggage: "Cabin Bag", amenities: ["easyJet Swiss Direct"], co2: 168 },
  { origin: "LGW", dest: "CMN", airline: "AT", flightNo: "AT 803", aircraft: "Boeing 737-800", dep: "13:15", mins: 195, fareMad: 1480, seats: 11, baggage: "23 kg + 10 kg", amenities: ["23kg Bag", "Hot Meal"], co2: 190 },

  { origin: "BRU", dest: "CMN", airline: "AT", flightNo: "AT 833", aircraft: "Boeing 737 MAX 8", dep: "11:05", mins: 205, fareMad: 1390, seats: 10, baggage: "23 kg + 10 kg", amenities: ["23kg Bag", "Meal"], co2: 194 },
  { origin: "BRU", dest: "CMN", airline: "TB", flightNo: "TB 2411", aircraft: "Boeing 737 MAX 8", dep: "14:40", mins: 205, fareMad: 1140, seats: 8, baggage: "10 kg Cabin", amenities: ["TUI fly Direct"], co2: 184 },
  { origin: "BRU", dest: "CMN", airline: "3O", flightNo: "3O 344", aircraft: "Airbus A320", dep: "18:20", mins: 205, fareMad: 1060, seats: 6, baggage: "10 kg Cabin", amenities: ["10kg Cabin"], co2: 188 },
  { origin: "BRU", dest: "RAK", airline: "TB", flightNo: "TB 2403", aircraft: "Boeing 737-800", dep: "08:50", mins: 220, fareMad: 1190, seats: 7, baggage: "10 kg Cabin", amenities: ["TUI fly Sun", "Direct"], co2: 196 },
  { origin: "BRU", dest: "AGA", airline: "TB", flightNo: "TB 2425", aircraft: "Boeing 737 MAX 8", dep: "12:15", mins: 230, fareMad: 1220, seats: 9, baggage: "10 kg Cabin", amenities: ["TUI fly Sun"], co2: 202 },
  { origin: "BRU", dest: "TNG", airline: "3O", flightNo: "3O 348", aircraft: "Airbus A320", dep: "14:10", mins: 185, fareMad: 920, seats: 7, baggage: "10 kg Cabin", amenities: ["10kg Cabin", "Direct Strait"], co2: 172 },
  { origin: "ORY", dest: "RAK", airline: "TB", flightNo: "TB 7211", aircraft: "Boeing 737-800", dep: "14:25", mins: 210, fareMad: 1180, seats: 8, baggage: "10 kg Cabin", amenities: ["TUI fly France"], co2: 188 },

  { origin: "FRA", dest: "CMN", airline: "LH", flightNo: "LH 1330", aircraft: "Airbus A321", dep: "10:15", mins: 215, fareMad: 1940, seats: 9, baggage: "23 kg + 8 kg", amenities: ["23kg Bag", "Lufthansa Service"], co2: 198 },
  { origin: "FRA", dest: "CMN", airline: "AT", flightNo: "AT 811", aircraft: "Boeing 737 MAX 8", dep: "16:30", mins: 215, fareMad: 1620, seats: 10, baggage: "23 kg + 10 kg", amenities: ["23kg Bag", "Meal"], co2: 195 },
  { origin: "CMN", dest: "FRA", airline: "LH", flightNo: "LH 1331", aircraft: "Airbus A321", dep: "15:10", mins: 215, fareMad: 1910, seats: 11, baggage: "23 kg + 8 kg", amenities: ["23kg Bag", "Direct"], co2: 198 },
  { origin: "FRA", dest: "RAK", airline: "LH", flightNo: "LH 1338", aircraft: "Airbus A320neo", dep: "11:20", mins: 230, fareMad: 1880, seats: 6, baggage: "23 kg + 8 kg", amenities: ["23kg Bag", "Direct"], co2: 202 },

  { origin: "IST", dest: "CMN", airline: "TK", flightNo: "TK 617", aircraft: "Airbus A321neo", dep: "10:55", mins: 295, fareMad: 2290, seats: 8, baggage: "30 kg + 8 kg", amenities: ["30kg Bag", "Hot Dining", "IFE Screen"], co2: 265 },
  { origin: "IST", dest: "CMN", airline: "AT", flightNo: "AT 911", aircraft: "Boeing 737 MAX 8", dep: "16:15", mins: 290, fareMad: 2050, seats: 9, baggage: "23 kg + 10 kg", amenities: ["23kg Bag", "Hot Meal"], co2: 268 },
  { origin: "CMN", dest: "IST", airline: "TK", flightNo: "TK 618", aircraft: "Airbus A321neo", dep: "16:10", mins: 280, fareMad: 2250, seats: 12, baggage: "30 kg + 8 kg", amenities: ["30kg Bag", "Hot Dining"], co2: 262 },
  { origin: "IST", dest: "RAK", airline: "TK", flightNo: "TK 619", aircraft: "Boeing 737 MAX 8", dep: "11:55", mins: 310, fareMad: 2340, seats: 7, baggage: "30 kg + 8 kg", amenities: ["30kg Bag", "Hot Dining"], co2: 274 },

  { origin: "DOH", dest: "CMN", airline: "QR", flightNo: "QR 1397", aircraft: "Boeing 787-9 Dreamliner", dep: "08:15", mins: 465, fareMad: 3890, seats: 6, baggage: "30 kg + 7 kg", amenities: ["30kg Bag", "Oryx IFE", "Dreamliner"], co2: 410 },
  { origin: "CMN", dest: "DOH", airline: "QR", flightNo: "QR 1398", aircraft: "Boeing 787-9 Dreamliner", dep: "15:25", mins: 440, fareMad: 3850, seats: 9, baggage: "30 kg + 7 kg", amenities: ["30kg Bag", "Oryx IFE", "Dreamliner"], co2: 405 },
  { origin: "DOH", dest: "RAK", airline: "QR", flightNo: "QR 1463", aircraft: "Boeing 787-8 Dreamliner", dep: "08:50", mins: 475, fareMad: 3990, seats: 5, baggage: "30 kg + 7 kg", amenities: ["30kg Bag", "Oryx IFE"], co2: 418 },

  { origin: "AMS", dest: "CMN", airline: "AT", flightNo: "AT 851", aircraft: "Boeing 737-800", dep: "10:35", mins: 215, fareMad: 1480, seats: 9, baggage: "23 kg + 10 kg", amenities: ["23kg Bag", "Meal"], co2: 202 },
  { origin: "AMS", dest: "NDR", airline: "3O", flightNo: "3O 386", aircraft: "Airbus A320", dep: "15:15", mins: 195, fareMad: 1080, seats: 8, baggage: "10 kg Cabin", amenities: ["10kg Cabin", "Direct Rif"], co2: 184 },

  { origin: "LIS", dest: "RAK", airline: "AT", flightNo: "AT 983", aircraft: "ATR 72-600", dep: "12:25", mins: 100, fareMad: 890, seats: 8, baggage: "23 kg + 10 kg", amenities: ["23kg Bag", "Atlantic Hop"], co2: 76 },
  { origin: "LIS", dest: "RAK", airline: "FR", flightNo: "FR 1842", aircraft: "Boeing 737-800", dep: "19:05", mins: 95, fareMad: 650, seats: 6, baggage: "Small Personal Bag", amenities: ["Direct Lisbon"], co2: 82 },

  // Atlantic Canary Islands <-> Saharan Coast
  { origin: "LPA", dest: "EUN", airline: "NT", flightNo: "NT 621", aircraft: "ATR 72-600", dep: "11:15", mins: 45, fareMad: 780, seats: 7, baggage: "23 kg + 8 kg", amenities: ["23kg Bag", "Canary-Sahara Bridge", "Snack"], co2: 38 },
  { origin: "LPA", dest: "VIL", airline: "NT", flightNo: "NT 625", aircraft: "ATR 72-600", dep: "13:30", mins: 75, fareMad: 940, seats: 6, baggage: "23 kg + 8 kg", amenities: ["23kg Bag", "Lagoon Hop"], co2: 59 },
  { origin: "LPA", dest: "AGA", airline: "NT", flightNo: "NT 611", aircraft: "Embraer E195-E2", dep: "16:10", mins: 75, fareMad: 860, seats: 9, baggage: "23 kg + 8 kg", amenities: ["23kg Bag", "E195-E2 Comfort"], co2: 64 },
];

export function extractAirportCode(input: string): string {
  const match = input.match(/\(([A-Z]{3})\)/);
  if (match) return match[1];
  const lower = input.toLowerCase();
  const found = AIRPORTS_CATALOG.find(
    (a) => a.code.toLowerCase() === lower.trim() || a.city.toLowerCase() === lower.trim() || lower.includes(a.city.toLowerCase())
  );
  return found ? found.code : "CMN";
}

export function computeFlightOfferTotal(
  offer: FlightOffer,
  tripType: "one_way" | "round_trip",
  adults: number,
  children: number
): number {
  const tripMult = tripType === "round_trip" ? 1.85 : 1;
  const safeAdults = Math.max(1, adults);
  const safeChildren = Math.max(0, children);
  const adultCost = offer.baseFareMad * tripMult * safeAdults;
  const childCost = offer.baseFareMad * tripMult * 0.78 * safeChildren;
  return Math.round(adultCost + childCost);
}

function deterministicSeedHash(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function getDateDemandMultiplier(dateIso: string): number {
  const parts = dateIso.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return 1;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  const dow = d.getDay(); // 0=Sun..6=Sat
  const dayMults: Record<number, number> = {
    0: 1.09, // Sun
    1: 0.98, // Mon
    2: 0.90, // Tue (lowest midweek)
    3: 0.92, // Wed
    4: 1.01, // Thu
    5: 1.12, // Fri (peak)
    6: 1.05, // Sat
  };
  return dayMults[dow] ?? 1;
}

export interface FlightDateAvailabilityResult {
  dateIso: string;
  offers: FlightOffer[];
  soldOutOffersCount: number;
  totalSeatsLeft: number;
  minBaseFareMad: number | null;
}

export function queryFlightsForDate(
  originInput: string,
  destInput: string,
  cabin: "economy" | "business",
  dateIso: string,
  minSeatsNeeded = 1
): FlightDateAvailabilityResult {
  const baseOffers = queryFlightsForCorridor(originInput, destInput, cabin);
  if (baseOffers.length === 0) {
    return {
      dateIso,
      offers: [],
      soldOutOffersCount: 0,
      totalSeatsLeft: 0,
      minBaseFareMad: null,
    };
  }

  const parts = dateIso.split("-").map(Number);
  const parsedDate =
    parts.length === 3 && !parts.some(Number.isNaN)
      ? new Date(parts[0], parts[1] - 1, parts[2])
      : new Date();
  const dow = parsedDate.getDay();
  const dayDemand = getDateDemandMultiplier(dateIso);

  const available: FlightOffer[] = [];
  let soldOutOffersCount = 0;

  for (let idx = 0; idx < baseOffers.length; idx++) {
    const offer = baseOffers[idx];
    const h = deterministicSeedHash(`${offer.flightNumber}::${dateIso}::${cabin}`);

    // When a corridor has multiple flights, allow realistic weekday rotation on secondary flights
    // while keeping at least the primary carrier operating most days; occasional no-op or sold-out days
    const freqMod = baseOffers.length >= 3 ? h % 7 : h % 9;
    const operatesToday =
      baseOffers.length === 1
        ? !((dow === 2 || dow === 4) && h % 5 === 0)
        : freqMod !== 0;

    if (!operatesToday) continue;

    // Seat allocation (0 = sold out on occasional peak days)
    const peakPenalty = dow === 5 || dow === 0 ? 3 : 0;
    const rawSeats = Math.max(0, offer.seatsLeft - peakPenalty + ((h % 7) - 3));
    const seatsLeft = h % 13 === 0 ? 0 : Math.min(18, rawSeats);

    if (seatsLeft < minSeatsNeeded) {
      soldOutOffersCount++;
      continue;
    }

    const microVar = 0.96 + ((h % 9) * 0.01); // 0.96..1.04 deterministic variance
    const adjustedFare = Math.max(
      290,
      Math.round((offer.baseFareMad * dayDemand * microVar) / 5) * 5
    );

    available.push({
      ...offer,
      baseFareMad: adjustedFare,
      seatsLeft,
    });
  }

  const totalSeatsLeft = available.reduce((sum, o) => sum + o.seatsLeft, 0);
  const minBaseFareMad =
    available.length > 0 ? Math.min(...available.map((o) => o.baseFareMad)) : null;

  return {
    dateIso,
    offers: available,
    soldOutOffersCount,
    totalSeatsLeft,
    minBaseFareMad,
  };
}

export function queryFlightsForCorridor(originInput: string, destInput: string, cabin: "economy" | "business"): FlightOffer[] {
  const oCode = extractAirportCode(originInput);
  const dCode = extractAirportCode(destInput);
  if (oCode === dCode) return [];

  const oInfo = findAirport(oCode);
  const dInfo = findAirport(dCode);
  const cabinMult = cabin === "business" ? 2.25 : 1;

  const direct = DIRECT_FLIGHT_SEEDS.filter((s) => s.origin === oCode && s.dest === dCode).map((s, idx) => ({
    offerCode: `${s.flightNo.replace(/\s+/g, "")}-${oCode}${dCode}-${idx}`,
    airlineCode: s.airline,
    flightNumber: s.flightNo,
    aircraft: s.aircraft,
    originCode: oCode,
    originCity: oInfo.city,
    originAirport: oInfo.name,
    originTerminal: oInfo.terminal,
    destinationCode: dCode,
    destinationCity: dInfo.city,
    destinationAirport: dInfo.name,
    destinationTerminal: dInfo.terminal,
    depTime: s.dep,
    arrTime: addMins(s.dep, s.mins),
    durationMins: s.mins,
    stops: 0 as const,
    baseFareMad: Math.round(s.fareMad * cabinMult),
    seatsLeft: s.seats,
    baggageIncluded: cabin === "business" ? "2×32 kg + Lounge" : s.baggage,
    amenities: cabin === "business" ? ["Priority Lounge", "2×32kg Bag", "Gourmet Meal"] : s.amenities,
    co2Kg: s.co2,
    image: dInfo.image,
  }));

  if (direct.length > 0) return direct;

  // Synthesize smart 1-stop Royal Air Maroc connection via Casablanca CMN Hub
  const leg1 = DIRECT_FLIGHT_SEEDS.filter((s) => s.origin === oCode && s.dest === "CMN");
  const leg2 = DIRECT_FLIGHT_SEEDS.filter((s) => s.origin === "CMN" && s.dest === dCode);

  if (leg1.length > 0 && leg2.length > 0) {
    const combos: FlightOffer[] = [];
    for (let i = 0; i < Math.min(2, leg1.length); i++) {
      const l1 = leg1[i];
      const l2 = leg2[i % leg2.length];
      const layoverMins = 75;
      const totalMins = l1.mins + layoverMins + l2.mins;
      combos.push({
        offerCode: `CMNHUB-${l1.flightNo.replace(/\s+/g, "")}-${l2.flightNo.replace(/\s+/g, "")}`,
        airlineCode: "AT",
        flightNumber: `${l1.flightNo} · ${l2.flightNo}`,
        aircraft: `${l1.aircraft} / ${l2.aircraft}`,
        originCode: oCode,
        originCity: oInfo.city,
        originAirport: oInfo.name,
        originTerminal: oInfo.terminal,
        destinationCode: dCode,
        destinationCity: dInfo.city,
        destinationAirport: dInfo.name,
        destinationTerminal: dInfo.terminal,
        depTime: l1.dep,
        arrTime: addMins(l1.dep, totalMins),
        durationMins: totalMins,
        stops: 1,
        viaCode: "CMN",
        viaCity: "Casablanca",
        layoverMins,
        baseFareMad: Math.round((l1.fareMad + l2.fareMad * 0.78) * cabinMult),
        seatsLeft: Math.min(l1.seats, l2.seats),
        baggageIncluded: cabin === "business" ? "2×32 kg + Lounge" : "23 kg + 10 kg (Thru-checked)",
        amenities: ["Thru-Checked Bag", "CMN Hub Connect", "23kg Bag"],
        co2Kg: l1.co2 + l2.co2,
        image: dInfo.image,
      });
    }
    return combos;
  }

  return [];
}
