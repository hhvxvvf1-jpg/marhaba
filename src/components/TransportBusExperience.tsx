"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowLeftRight,
  Bell,
  BellRing,
  Building2,
  Bus,
  Calendar,
  CarFront,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  Info,
  Leaf,
  Lock,
  Luggage,
  Map as MapIcon,
  MapPin,
  Minus,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tag,
  Train,
  TramFront,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { useApp } from "./AppProvider";
import { BrandLogo } from "./BrandLogo";
import { BrandSelect } from "./BrandSelect";
import { BrandDateRangePicker } from "./BrandDateRangePicker";
import { MoroccanPaymentBadges } from "./MoroccanPaymentBadges";
import { TransportOfficialLogo } from "./CarrierOfficialLogo";
import { MOROCCO_CITIES } from "@/lib/morocco-cities";
import { getDateLocale, tCity, tRegion } from "@/lib/i18n";
import { classMultiplier, formatDuration, type SeatClass } from "@/lib/transport-engine";
import type { CorridorQueryResult, HydratedTransportOffer, OfferCarrierType } from "@/lib/transport-offers";

const POPULAR_BUS_CORRIDORS: Array<[string, string]> = [
  ["Casablanca", "Marrakech"],
  ["Casablanca", "Agadir"],
  ["Marrakech", "Agadir"],
  ["Tangier", "Casablanca"],
  ["Tangier", "Fès"],
  ["Agadir", "Laâyoune"],
  ["Marrakech", "Essaouira"],
];

const POPULAR_TRAIN_CORRIDORS: Array<[string, string]> = [
  ["Tangier", "Casablanca"],
  ["Casablanca", "Marrakech"],
  ["Casablanca", "Rabat"],
  ["Casablanca", "Fès"],
  ["Casablanca", "Tangier"],
];

const TRAM_NETWORK_CITIES: Array<{ city: string; network: string; logoBrand: string }> = [
  { city: "Casablanca", network: "Tramway T1–T4 · Busway · Casabus", logoBrand: "Casa Tramway" },
  { city: "Rabat", network: "Tramway Rabat-Salé L1–L2", logoBrand: "Tramway Rabat-Salé" },
  { city: "Salé", network: "Tramway Rabat-Salé", logoBrand: "Tramway Rabat-Salé" },
  { city: "Tangier", network: "ALSA Tanger L1 / Airport", logoBrand: "ALSA" },
  { city: "Agadir", network: "ALSA Amalway L98", logoBrand: "ALSA" },
  { city: "Marrakech", network: "ALSA Urban L19", logoBrand: "ALSA" },
];

const ALL_MOROCCO_COMPANIES: Array<{
  vehicleType: "bus" | "train" | "tram";
  brand: string;
  brandFilter: string;
  region: string;
  origin: string;
  dest: string;
}> = [
  // Coaches (Lkiran - 15 operators)
  { vehicleType: "bus", brand: "CTM", brandFilter: "CTM", region: "National · 65+ cities", origin: "Casablanca", dest: "Marrakech" },
  { vehicleType: "bus", brand: "Supratours", brandFilter: "Supratours", region: "ONCF Coach Network", origin: "Casablanca", dest: "Marrakech" },
  { vehicleType: "bus", brand: "SATAS", brandFilter: "SATAS", region: "Souss & Grand Sud", origin: "Casablanca", dest: "Agadir" },
  { vehicleType: "bus", brand: "Trans Ghazala", brandFilter: "Ghazala", region: "Casablanca · Marrakech · Agadir", origin: "Casablanca", dest: "Marrakech" },
  { vehicleType: "bus", brand: "Nejme Chamal", brandFilter: "Nejme Chamal", region: "Tangier · Rif · Fès · Casa", origin: "Tangier", dest: "Casablanca" },
  { vehicleType: "bus", brand: "Bab Salama", brandFilter: "Bab Salama", region: "Casa · Marrakech · Fès · Nord", origin: "Casablanca", dest: "Marrakech" },
  { vehicleType: "bus", brand: "Globus Trans", brandFilter: "Globus", region: "National & Sahara Express", origin: "Casablanca", dest: "Marrakech" },
  { vehicleType: "bus", brand: "Al Wissam Addahabi", brandFilter: "Wissam", region: "Casa · Marrakech · Orient", origin: "Casablanca", dest: "Marrakech" },
  { vehicleType: "bus", brand: "Sahara Prestige", brandFilter: "Sahara Prestige", region: "Agadir · Laâyoune · Dakhla", origin: "Casablanca", dest: "Agadir" },
  { vehicleType: "bus", brand: "SAT First", brandFilter: "SAT First", region: "Central & South Morocco", origin: "Casablanca", dest: "Marrakech" },
  { vehicleType: "bus", brand: "Sotram", brandFilter: "Sotram", region: "Marrakech · Agadir · Atlas", origin: "Marrakech", dest: "Agadir" },
  { vehicleType: "bus", brand: "Jaouharat Agadir", brandFilter: "Jaouharat", region: "Agadir · Souss · Casa", origin: "Casablanca", dest: "Agadir" },
  { vehicleType: "bus", brand: "Star Bus STT", brandFilter: "Star Bus", region: "Night & Intercity Express", origin: "Casablanca", dest: "Marrakech" },
  { vehicleType: "bus", brand: "Itrane Voyage", brandFilter: "Itrane", region: "Souss · Atlas · Marrakech", origin: "Marrakech", dest: "Agadir" },
  { vehicleType: "bus", brand: "Trans Al Yamama", brandFilter: "Yamama", region: "Marrakech · Agadir · South", origin: "Marrakech", dest: "Agadir" },
  // Trains (ONCF - 2 brands)
  { vehicleType: "train", brand: "ONCF Al Boraq TGV", brandFilter: "Boraq", region: "Tangier · Kenitra · Rabat · Casa (320 km/h)", origin: "Tangier", dest: "Casablanca" },
  { vehicleType: "train", brand: "ONCF Al Atlas & TNR", brandFilter: "Atlas", region: "Marrakech · Casa · Rabat · Fès · Oujda", origin: "Casablanca", dest: "Marrakech" },
  // Tramway & Urban Buses (5 networks)
  { vehicleType: "tram", brand: "Casa Tramway", brandFilter: "Casa Tramway", region: "Casablanca T1 · T2 · T3 · T4", origin: "Casablanca", dest: "Casablanca" },
  { vehicleType: "tram", brand: "Casa Busway", brandFilter: "Casa Busway", region: "Casablanca BRT BW1 · BW2", origin: "Casablanca", dest: "Casablanca" },
  { vehicleType: "tram", brand: "Casabus by Alsa", brandFilter: "Casabus", region: "Greater Casablanca Urban Bus", origin: "Casablanca", dest: "Casablanca" },
  { vehicleType: "tram", brand: "Tramway Rabat-Salé", brandFilter: "Tramway Rabat", region: "Rabat & Salé L1 · L2", origin: "Rabat", dest: "Rabat" },
  { vehicleType: "tram", brand: "ALSA Maroc", brandFilter: "ALSA", region: "Marrakech · Tangier · Agadir", origin: "Tangier", dest: "Tangier" },
];

interface RouteStop {
  time: string;
  name: string;
  address: string;
  city: string;
  nextDay?: boolean;
  isEndpoint?: boolean;
}

const KNOWN_CORRIDOR_INTERMEDIATES: Record<string, Array<{ ratio: number; name: string; address: string; city: string }>> = {
  "laayoune->agadir": [
    { ratio: 0.16, name: "Arret Tarfaya (La Poste)", address: "Devant La Poste De Tarfaya", city: "Tarfaya" },
    { ratio: 0.35, name: "Agence Tan-Tan", address: "Avenue Hassan II, Tan-Tan", city: "Tan-Tan" },
    { ratio: 0.54, name: "Gare Routière Guelmim", address: "Guelmim, Maroc", city: "Guelmim" },
    { ratio: 0.63, name: "Arret Bouizakarne", address: "Près De La Poste, N1, Bouizakarne", city: "Guelmim" },
    { ratio: 0.79, name: "Arret Route Agadir", address: "Tiznit, Maroc", city: "Tiznit" },
    { ratio: 0.94, name: "Gare Routière Inezgane", address: "Inezgane, Maroc", city: "Agadir" },
  ],
  "agadir->laayoune": [
    { ratio: 0.08, name: "Gare Routière Inezgane", address: "Inezgane, Maroc", city: "Agadir" },
    { ratio: 0.21, name: "Arret Tiznit Centre", address: "Route Nationale N1, Tiznit", city: "Tiznit" },
    { ratio: 0.45, name: "Gare Routière Guelmim", address: "Guelmim, Maroc", city: "Guelmim" },
    { ratio: 0.65, name: "Agence Tan-Tan", address: "Avenue Hassan II, Tan-Tan", city: "Tan-Tan" },
    { ratio: 0.84, name: "Arret Tarfaya", address: "Devant La Poste, Tarfaya", city: "Tarfaya" },
  ],
  "casablanca->marrakech": [
    { ratio: 0.32, name: "Gare / Station Settat", address: "Avenue des FAR, Settat", city: "Settat" },
    { ratio: 0.68, name: "Station Benguerir", address: "Route de Marrakech, Benguerir", city: "Marrakech" },
  ],
  "tangier->casablanca": [
    { ratio: 0.38, name: "Gare Kénitra", address: "Avenue Mohammed V, Kénitra", city: "Kenitra" },
    { ratio: 0.62, name: "Gare Rabat-Agdal", address: "Place de la Gare Agdal, Rabat", city: "Rabat" },
  ],
  "casablanca->agadir": [
    { ratio: 0.45, name: "Station Marrakech Palmiers", address: "Guéliz / Route de Casa, Marrakech", city: "Marrakech" },
    { ratio: 0.72, name: "Relais Chichaoua / Imintanoute", address: "Autoroute A3, Chichaoua", city: "Marrakech" },
  ],
};

function addMinsToHHMM(hhmm: string, add: number): { time: string; nextDay: boolean } {
  const safe = String(hhmm || "08:00");
  const parts = safe.split(":");
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  const start = (Number.isFinite(h) ? h : 8) * 60 + (Number.isFinite(m) ? m : 0);
  const total = start + add;
  const nextDay = total >= 24 * 60;
  const mod = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  return {
    time: `${String(Math.floor(mod / 60)).padStart(2, "0")}:${String(mod % 60).padStart(2, "0")}`,
    nextDay,
  };
}

function normalizeKey(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

function buildOfferStops(offer: HydratedTransportOffer): RouteStop[] {
  const key = `${normalizeKey(offer.originCity)}->${normalizeKey(offer.destinationCity)}`;
  const known = KNOWN_CORRIDOR_INTERMEDIATES[key];
  const dep = addMinsToHHMM(offer.depTime, 0);
  const arr = addMinsToHHMM(offer.depTime, offer.durationMins);

  const stops: RouteStop[] = [
    {
      time: dep.time,
      name: `${offer.originStation} · ${offer.originCity}`,
      address: `${offer.originStation}, ${offer.originCity}`,
      city: offer.originCity,
      isEndpoint: true,
    },
  ];

  if (known && offer.stops > 0) {
    for (const s of known) {
      const t = addMinsToHHMM(offer.depTime, Math.round(offer.durationMins * s.ratio));
      stops.push({
        time: t.time,
        name: s.name,
        address: s.address,
        city: s.city,
        nextDay: t.nextDay,
      });
    }
  } else if (offer.stops > 0) {
    for (let i = 1; i <= Math.min(offer.stops, 3); i++) {
      const ratio = i / (Math.min(offer.stops, 3) + 1);
      const t = addMinsToHHMM(offer.depTime, Math.round(offer.durationMins * ratio));
      stops.push({
        time: t.time,
        name: `${offer.carrierType === "train_oncf" ? "Gare Intermédiaire" : "Relais Autoroute"} #${i}`,
        address: `${offer.originCity} → ${offer.destinationCity}`,
        city: offer.originCity,
        nextDay: t.nextDay,
      });
    }
  }

  stops.push({
    time: arr.time,
    name: `${offer.destinationStation} · ${offer.destinationCity}`,
    address: `${offer.destinationStation}, ${offer.destinationCity}`,
    city: offer.destinationCity,
    nextDay: arr.nextDay,
    isEndpoint: true,
  });

  return stops;
}

function carrierLabel(carrier: string): string {
  if (carrier === "train_oncf") return "ONCF / Al Boraq";
  if (carrier === "bus_ctm") return "CTM";
  if (carrier === "supratours") return "Supratours";
  if (carrier === "taxi_transfer") return "VIP Transfer";
  return carrier;
}

function getDepartureHour(depTime: string): number {
  const h = Number(String(depTime || "").split(":")[0]);
  return Number.isFinite(h) ? h : 10;
}

function normalizeMoroccoPhone(raw: string): string {
  const cleaned = raw.trim().replace(/\s+/g, "");
  if (!cleaned) return "";
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("00")) return `+${cleaned.slice(2)}`;
  if (cleaned.startsWith("212")) return `+${cleaned}`;
  if (cleaned.startsWith("0")) return `+212${cleaned.slice(1)}`;
  return `+212${cleaned}`;
}

export function TransportBusExperience({
  tOrigin,
  setTOrigin,
  tDest,
  setTDest,
  tDate,
  setTDate,
  tPax,
  setTPax,
  tPhone,
  setTPhone,
  tMode,
  setTMode,
  tVehicleType,
  setTVehicleType,
  tCarrierFilter,
  setTCarrierFilter,
  tBrandFilter,
  setTBrandFilter,
  tSort,
  setTSort,
  tSeatClass,
  setTSeatClass,
  corridorData,
  loadingOffers,
  verifyingLive,
  watchdogMsg,
  onRunLiveVerify,
  onReloadHistory,
  transHistory,
}: {
  tOrigin: string;
  setTOrigin: (v: string) => void;
  tDest: string;
  setTDest: (v: string) => void;
  tDate: string;
  setTDate: (v: string) => void;
  tPax: number;
  setTPax: (v: number) => void;
  tPhone: string;
  setTPhone: (v: string) => void;
  tMode: "intercity" | "intracity";
  setTMode: (v: "intercity" | "intracity") => void;
  tVehicleType: "bus" | "train" | "tram";
  setTVehicleType: (v: "bus" | "train" | "tram") => void;
  tCarrierFilter: "all" | OfferCarrierType;
  setTCarrierFilter: (v: "all" | OfferCarrierType) => void;
  tBrandFilter: string;
  setTBrandFilter: (v: string) => void;
  tSort: "best" | "earliest" | "cheapest" | "fastest";
  setTSort: (v: "best" | "earliest" | "cheapest" | "fastest") => void;
  tSeatClass: SeatClass;
  setTSeatClass: (v: SeatClass) => void;
  corridorData: CorridorQueryResult;
  loadingOffers: boolean;
  verifyingLive: boolean;
  watchdogMsg: string | null;
  onRunLiveVerify: () => void;
  onReloadHistory: () => void;
  transHistory: Array<Record<string, unknown>>;
}) {
  const { lang, money, user, tr, notify } = useApp();
  const dateLocale = getDateLocale(lang);

  const cityOptions = useMemo(
    () =>
      MOROCCO_CITIES.map((c) => ({
        value: c.name,
        label: `${tCity(lang, c.name)} (${tRegion(lang, c.region)})`,
      })),
    [lang]
  );

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [step, setStep] = useState<1 | 2 | 3>(2);
  const [timeWindow, setTimeWindow] = useState<"all" | "morning" | "afternoon" | "evening">("all");
  const [expandedStopsCode, setExpandedStopsCode] = useState<string | null>(null);
  const [selectedOfferCode, setSelectedOfferCode] = useState<string | null>(null);
  const [stopsModalOffer, setStopsModalOffer] = useState<HydratedTransportOffer | null>(null);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [paxPopoverOpen, setPaxPopoverOpen] = useState(false);
  const [allCompaniesOpen, setAllCompaniesOpen] = useState(false);
  const [trackedRoutes, setTrackedRoutes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem("marhaba_transport_alerts");
      if (saved) setTrackedRoutes(JSON.parse(saved));
    } catch {}
  }, []);

  // Checkout state (Step 3)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [seatPreference, setSeatPreference] = useState<"open" | "window" | "front">("open");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "bank_app" | "cash_network" | "chaabi_tasshilat" | "paypal">("card");
  const [policyExpanded, setPolicyExpanded] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [holdSeconds, setHoldSeconds] = useState(15 * 60);
  const [submitting, setSubmitting] = useState(false);
  const [routeRequestedDone, setRouteRequestedDone] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [confirmedTicket, setConfirmedTicket] = useState<{
    requestRef: string;
    totalMad: number;
    offer: HydratedTransportOffer | null;
    passengerName: string;
    paymentMethod: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      if (!firstName && user.full_name) setFirstName(user.full_name.split(" ")[0] || "");
      if (!lastName && user.full_name) setLastName(user.full_name.split(" ").slice(1).join(" ") || "");
    }
  }, [user, firstName, lastName]);

  useEffect(() => {
    if (step !== 3 || confirmedTicket) return;
    setHoldSeconds(15 * 60);
    const timer = setInterval(() => {
      setHoldSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, confirmedTicket]);

  const holdClock = `${String(Math.floor(holdSeconds / 60)).padStart(2, "0")}:${String(holdSeconds % 60).padStart(2, "0")}`;

  const minCorridorFare = useMemo(() => {
    const offers = corridorData.offers || [];
    if (offers.length === 0) return 110 * Math.max(1, tPax);
    return Math.min(...offers.map((o) => Math.round(o.fareMad * classMultiplier(tSeatClass)) * Math.max(1, tPax)));
  }, [corridorData.offers, tSeatClass, tPax]);

  // Hydration-safe 7-Day Horizontal Date Strip with exact corridor fare
  const dateStrip = useMemo(() => {
    if (!mounted) return [];
    const today = new Date();
    const rawDays: Array<{ iso: string; weekday: string; dayNum: string; estFare: number }> = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const weekday = d.toLocaleDateString(dateLocale, { weekday: "short" });
      const dayNum = d.toLocaleDateString(dateLocale, { day: "numeric", month: "short" });
      rawDays.push({ iso, weekday, dayNum, estFare: minCorridorFare });
    }
    const lowest = Math.min(...rawDays.map((x) => x.estFare));
    return rawDays.map((x) => ({ ...x, isLowest: x.estFare === lowest }));
  }, [mounted, dateLocale, minCorridorFare]);

  const transportBestScore = (o: HydratedTransportOffer) => o.fareMad + o.stops * 35 + o.durationMins * 0.45;

  const sortedOffers = useMemo(() => {
    const filtered = (corridorData.offers || []).filter((o) => {
      if (timeWindow === "all") return true;
      const h = getDepartureHour(o.depTime);
      if (timeWindow === "morning") return h >= 4 && h < 12;
      if (timeWindow === "afternoon") return h >= 12 && h < 18;
      return h >= 18 || h < 4;
    });
    return filtered.sort((a, b) => {
      if (tSort === "best") return transportBestScore(a) - transportBestScore(b);
      if (tSort === "cheapest") return a.fareMad - b.fareMad;
      if (tSort === "fastest") return a.durationMins - b.durationMins;
      return a.depTime.localeCompare(b.depTime);
    });
  }, [corridorData.offers, tSort, timeWindow]);

  const bestOffer = useMemo(() => {
    if (sortedOffers.length === 0) return null;
    return [...sortedOffers].sort((a, b) => transportBestScore(a) - transportBestScore(b))[0];
  }, [sortedOffers]);

  const cheapestOffer = useMemo(() => {
    if (sortedOffers.length === 0) return null;
    return [...sortedOffers].sort((a, b) => a.fareMad - b.fareMad)[0];
  }, [sortedOffers]);

  const fastestOffer = useMemo(() => {
    if (sortedOffers.length === 0) return null;
    return [...sortedOffers].sort((a, b) => a.durationMins - b.durationMins)[0];
  }, [sortedOffers]);

  const cheapestOfferCode = cheapestOffer?.offerCode || null;
  const fastestOfferCode = fastestOffer?.offerCode || null;

  const routeTrackKey = `${tMode}__${tOrigin}__${tMode === "intracity" ? tOrigin : tDest}__${tSeatClass}`;
  const isTrackingRoute = Boolean(trackedRoutes[routeTrackKey]);

  const toggleTrackRoute = () => {
    const next = { ...trackedRoutes, [routeTrackKey]: !isTrackingRoute };
    setTrackedRoutes(next);
    try {
      localStorage.setItem("marhaba_transport_alerts", JSON.stringify(next));
    } catch {}
    notify(!isTrackingRoute ? tr("trackingActiveBtn") : tr("trackPricesBtn"), "success");
  };

  const activeOffer: HydratedTransportOffer | null =
    sortedOffers.find((o) => o.offerCode === selectedOfferCode) || sortedOffers[0] || null;

  useEffect(() => {
    if (step === 3 && !activeOffer && !confirmedTicket && !loadingOffers) {
      setStep(2);
    }
  }, [step, activeOffer, confirmedTicket, loadingOffers]);

  const computeOfferBaseTotal = (offer: HydratedTransportOffer) => {
    const unitFare = Math.round(offer.fareMad * classMultiplier(tSeatClass));
    return offer.carrierType === "taxi_transfer"
      ? unitFare * Math.max(1, Math.ceil(tPax / 4))
      : unitFare * tPax;
  };

  const swapCities = () => {
    setTOrigin(tDest);
    setTDest(tOrigin);
    setTBrandFilter("all");
    setSelectedOfferCode(null);
    setExpandedStopsCode(null);
    setRouteRequestedDone(false);
  };

  const formattedSelectedDate = useMemo(() => {
    if (!mounted || !tDate) return tDate;
    const d = new Date(`${tDate}T00:00:00`);
    if (Number.isNaN(d.getTime())) return tDate;
    return d.toLocaleDateString(dateLocale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }, [mounted, tDate, dateLocale]);

  const openCheckoutForOffer = (offer: HydratedTransportOffer) => {
    setSelectedOfferCode(offer.offerCode);
    setConfirmedTicket(null);
    setCheckoutError("");
    setStep(3);
  };

  const requestPriorityRoute = async () => {
    setSubmitting(true);
    try {
      const phoneVal = normalizeMoroccoPhone(tPhone || user?.phone || "+212600000000") || "+212600000000";
      const res = await fetch("/api/v1/services/transport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: tMode,
          carrierType: "bus_ctm",
          originCity: tOrigin,
          destinationCity: tMode === "intracity" ? tOrigin : tDest,
          travelDate: tDate,
          passengers: tPax,
          contactPhone: phoneVal,
          requestKind: "route_request",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setRouteRequestedDone(true);
        notify(tr("routeRequestedToast"), "success");
        onReloadHistory();
      } else {
        notify(data.error || "Request failed", "warning");
      }
    } catch {
      notify("Network error while requesting route", "warning");
    } finally {
      setSubmitting(false);
    }
  };

  const submitBusCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError("");

    const normalizedPhone = normalizeMoroccoPhone(tPhone || user?.phone || "");
    if (normalizedPhone.length < 9) {
      const msg = `${tr("busWhatsappNum")} (+212 6...)`;
      setCheckoutError(msg);
      notify(msg, "warning");
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      const msg = `${tr("busFirstName")} / ${tr("busLastName")}`;
      setCheckoutError(msg);
      notify(msg, "warning");
      return;
    }
    if (!termsAccepted) {
      setCheckoutError(tr("busCndpConsent"));
      notify(tr("busCndpConsent"), "warning");
      return;
    }

    const target = activeOffer;
    setSubmitting(true);
    try {
      const baseFare = target ? computeOfferBaseTotal(target) : undefined;
      const paxName = `${firstName} ${lastName}`.trim();
      const res = await fetch("/api/v1/services/transport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: tMode,
          carrierType: target?.carrierType || "taxi_transfer",
          originCity: tOrigin,
          destinationCity: tMode === "intracity" ? tOrigin : tDest,
          travelDate: tDate,
          passengers: tPax,
          contactPhone: normalizedPhone,
          selectedScheduleFareMad: baseFare,
          selectedDeparture: target ? `${target.carrierBrand} ${target.depTime}` : "Private Transfer",
          seatClass: tSeatClass,
          offerCode: target?.offerCode,
          paymentMethod,
          seatPreference,
          passengerName: paxName,
          promoCode: appliedPromo || undefined,
          requestKind: "booking",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errText = data.error || "Booking failed";
        setCheckoutError(errText);
        notify(errText, "warning");
        return;
      }
      setConfirmedTicket({
        requestRef: data.requestRef,
        totalMad: data.indicativePriceMad,
        offer: target,
        passengerName: paxName || user?.full_name || "Traveler",
        paymentMethod,
      });
      notify(`${data.requestRef} · ${tCity(lang, tOrigin)} → ${tCity(lang, tMode === "intracity" ? tOrigin : tDest)}`, "success");
      onReloadHistory();
    } catch {
      setCheckoutError("Network error while submitting reservation");
    } finally {
      setSubmitting(false);
    }
  };

  const checkoutBaseMad = activeOffer ? computeOfferBaseTotal(activeOffer) : 270 * tPax;
  const promoPct = appliedPromo === "SAHARA15" ? 0.15 : appliedPromo === "MARHABA10" ? 0.1 : 0;
  const discountMad = Math.round(checkoutBaseMad * promoPct);
  const serviceFeeMad = 5;
  const checkoutTotalMad = Math.max(20, checkoutBaseMad - discountMad + serviceFeeMad);
  const visibleHistory = showAllHistory ? transHistory : transHistory.slice(0, 3);

  return (
    <div className="bus-root" style={{ gap: 18 }}>
      {/* Unified Clean Search + Integrated 7-Day Date Strip */}
      {step !== 3 && (
        <section className="card card-body marhaba-search-card" style={{ display: "grid", gap: 14, minWidth: 0 }}>
          {/* Quiet Single Header Row: Split cleanly between Coaches (Lkiran), Trains (ONCF), and Tramway */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div className="marhaba-segmented" role="tablist" aria-label="Travel mode">
              <button
                type="button"
                className={`marhaba-seg-btn ${tVehicleType === "bus" ? "active" : ""}`}
                onClick={() => {
                  setTVehicleType("bus");
                  setTCarrierFilter("all");
                  setTBrandFilter("all");
                  setSelectedOfferCode(null);
                  setExpandedStopsCode(null);
                }}
              >
                <Bus size={14} />
                <span>{tr("modeBusesLabel")}</span>
              </button>
              <button
                type="button"
                className={`marhaba-seg-btn ${tVehicleType === "train" ? "active" : ""}`}
                onClick={() => {
                  setTVehicleType("train");
                  setTCarrierFilter("all");
                  setTBrandFilter("all");
                  setSelectedOfferCode(null);
                  setExpandedStopsCode(null);
                }}
              >
                <Train size={14} />
                <span>{tr("modeTrainsLabel")}</span>
              </button>
              <button
                type="button"
                className={`marhaba-seg-btn ${tVehicleType === "tram" ? "active" : ""}`}
                onClick={() => {
                  setTVehicleType("tram");
                  setTCarrierFilter("all");
                  setTBrandFilter("all");
                  if (!["Casablanca", "Rabat", "Salé", "Tangier", "Agadir", "Marrakech"].includes(tOrigin)) {
                    setTOrigin("Casablanca");
                  }
                  setSelectedOfferCode(null);
                  setExpandedStopsCode(null);
                }}
              >
                <TramFront size={14} />
                <span>{tr("modeTramLabel")}</span>
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                style={{ borderRadius: 999, gap: 6 }}
                onClick={() => setAllCompaniesOpen(true)}
              >
                <Building2 size={13} />
                <span>{tr("allCarriers")} (22)</span>
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                style={{ borderRadius: 999 }}
                disabled={verifyingLive}
                onClick={onRunLiveVerify}
                title={watchdogMsg || tr("verifyLiveBtn")}
              >
                <RefreshCw size={13} className={verifyingLive ? "spin" : ""} />
                <span>{verifyingLive ? tr("verifyingLiveLabel") : tr("verifyLiveBtn")}</span>
              </button>
            </div>
          </div>

          {/* Search Inputs */}
          <div className={tMode === "intercity" ? "bus-search-grid" : "bus-search-grid bus-search-grid--intra"}>
            <div className="bus-field-origin">
              <label className="field-label">{tMode === "intercity" ? tr("originCityLabel") : tr("search.destination")}</label>
              <BrandSelect
                value={tOrigin}
                ariaLabel={tr("originCityLabel")}
                onChange={(v) => {
                  setTOrigin(v);
                  setTBrandFilter("all");
                  setSelectedOfferCode(null);
                  setExpandedStopsCode(null);
                  setRouteRequestedDone(false);
                }}
                options={cityOptions}
              />
            </div>

            {tMode === "intercity" && (
              <>
                <div className="bus-field-swap">
                  <button
                    type="button"
                    className="btn btn-outline bus-swap-btn"
                    onClick={swapCities}
                    title={tr("swapCitiesBtn")}
                    aria-label={tr("swapCitiesBtn")}
                  >
                    <ArrowLeftRight size={16} />
                  </button>
                </div>
                <div className="bus-field-dest">
                  <label className="field-label">{tr("destCityLabel")}</label>
                  <BrandSelect
                    value={tDest}
                    ariaLabel={tr("destCityLabel")}
                    onChange={(v) => {
                      setTDest(v);
                      setTBrandFilter("all");
                      setSelectedOfferCode(null);
                      setExpandedStopsCode(null);
                      setRouteRequestedDone(false);
                    }}
                    options={cityOptions}
                  />
                </div>
              </>
            )}

            <div className="bus-field-date">
              <label className="field-label">{tr("travelDateLabel")}</label>
              <BrandDateRangePicker mode="single" startDate={tDate} onChangeStart={setTDate} startLabel="" />
            </div>

            <div className="bus-field-pax" style={{ position: "relative" }}>
              <label className="field-label">{tr("travelersCabinLabel")}</label>
              <button
                type="button"
                className="input"
                onClick={() => setPaxPopoverOpen((v) => !v)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 6,
                  cursor: "pointer",
                  textAlign: "start",
                  fontWeight: 700,
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <Users size={14} style={{ color: "var(--primary)", flexShrink: 0 }} />
                  <span dir="ltr">{tPax}</span> · {tSeatClass === "vip" ? tr("classVip") : tSeatClass === "comfort" ? tr("classComfort") : tr("classStandard")}
                </span>
                <ChevronDown size={14} style={{ flexShrink: 0 }} />
              </button>

              {paxPopoverOpen && (
                <div
                  className="card card-body"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    insetInlineEnd: 0,
                    zIndex: 30,
                    width: 268,
                    display: "grid",
                    gap: 12,
                    boxShadow: "var(--shadow-lg)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.86rem" }}>{tr("passengersLabel")}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button type="button" className="btn btn-sm btn-outline" onClick={() => setTPax(Math.max(1, tPax - 1))}>
                        <Minus size={12} />
                      </button>
                      <strong dir="ltr" style={{ minWidth: 18, textAlign: "center" }}>{tPax}</strong>
                      <button type="button" className="btn btn-sm btn-outline" onClick={() => setTPax(Math.min(9, tPax + 1))}>
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {[
                      { id: "standard" as const, label: tr("classStandard") },
                      { id: "comfort" as const, label: tr("classComfort") },
                      { id: "vip" as const, label: tr("classVip") },
                    ].map((cls) => (
                      <button
                        key={cls.id}
                        type="button"
                        className={`btn btn-sm ${tSeatClass === cls.id ? "btn-primary" : "btn-outline"}`}
                        style={{ flex: 1 }}
                        onClick={() => setTSeatClass(cls.id)}
                      >
                        {cls.label}
                      </button>
                    ))}
                  </div>
                  <button type="button" className="btn btn-sm btn-primary" onClick={() => setPaxPopoverOpen(false)}>
                    {tr("doneBtn")}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Integrated 7-Day Date Strip with Exact Corridor Fares & Top 5 Popular Corridors */}
          <div style={{ display: "grid", gap: 10, paddingTop: 4, minWidth: 0, maxWidth: "100%" }}>
            <div className="no-scrollbar" style={{ display: "flex", gap: 8, overflowX: "auto", alignItems: "center", minWidth: 0, maxWidth: "100%" }}>
              {dateStrip.length === 0 ? (
                <div className="skeleton-shimmer" style={{ width: "100%", height: 50, borderRadius: 10 }} />
              ) : (
                dateStrip.map((d) => {
                  const active = tDate === d.iso;
                  return (
                    <button
                      key={d.iso}
                      type="button"
                      onClick={() => {
                        setTDate(d.iso);
                        setRouteRequestedDone(false);
                      }}
                      className={`marhaba-date-pill ${active ? "active" : ""}`}
                      style={{ minWidth: 88 }}
                    >
                      <span style={{ fontSize: "0.66rem", textTransform: "uppercase", opacity: 0.78 }}>{d.weekday}</span>
                      <span style={{ fontSize: "0.82rem", fontWeight: 800 }}>{d.dayNum}</span>
                      <span
                        dir="ltr"
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          color: active ? "#fff" : d.isLowest ? "var(--success)" : "var(--primary)",
                        }}
                      >
                        {money(d.estFare)}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {tVehicleType !== "tram" ? (
              <div className="no-scrollbar" style={{ display: "flex", gap: 6, overflowX: "auto", alignItems: "center", minWidth: 0, maxWidth: "100%" }}>
                <span style={{ fontSize: "0.76rem", color: "var(--text-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>
                  {tr("popularRoutesLabel")}:
                </span>
                {(tVehicleType === "train" ? POPULAR_TRAIN_CORRIDORS : POPULAR_BUS_CORRIDORS).map(([o, d]) => {
                  const active = tOrigin === o && tDest === d;
                  return (
                    <button
                      key={`${o}-${d}`}
                      type="button"
                      className={`marhaba-quiet-chip ${active ? "active" : ""}`}
                      onClick={() => {
                        setTOrigin(o);
                        setTDest(d);
                        setTBrandFilter("all");
                        setSelectedOfferCode(null);
                        setExpandedStopsCode(null);
                        setRouteRequestedDone(false);
                      }}
                    >
                      {tCity(lang, o)} → {tCity(lang, d)}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="no-scrollbar" style={{ display: "flex", gap: 6, overflowX: "auto", alignItems: "center" }}>
                <span style={{ fontSize: "0.76rem", color: "var(--text-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>
                  {tr("modeTramLabel")}:
                </span>
                {TRAM_NETWORK_CITIES.map((net) => {
                  const active = tOrigin === net.city;
                  return (
                    <button
                      key={net.city}
                      type="button"
                      className={`marhaba-quiet-chip ${active ? "active" : ""}`}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, paddingInlineStart: 6 }}
                      onClick={() => {
                        setTOrigin(net.city);
                        setTBrandFilter("all");
                        setSelectedOfferCode(null);
                        setExpandedStopsCode(null);
                        setRouteRequestedDone(false);
                      }}
                    >
                      <TransportOfficialLogo carrierBrand={net.logoBrand} compact />
                      <span>{tCity(lang, net.city)} · {net.network}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Calm, Flat Filter Toolbar tailored per Buses / Trains / Tramway with ALL Company Logos */}
      {step !== 3 && (
        <div className="marhaba-filter-bar">
          <div className="no-scrollbar" style={{ display: "flex", gap: 6, overflowX: "auto", alignItems: "center", minWidth: 0 }}>
            {(tVehicleType === "bus"
              ? [
                  { key: "all", label: tr("allCarriers"), brandFilter: "all", logoBrand: "" },
                  { key: "ctm", label: "CTM", brandFilter: "CTM", logoBrand: "CTM" },
                  { key: "supratours", label: "Supratours", brandFilter: "Supratours", logoBrand: "Supratours" },
                  { key: "satas", label: "SATAS", brandFilter: "SATAS", logoBrand: "SATAS" },
                  { key: "ghazala", label: "Ghazala", brandFilter: "Ghazala", logoBrand: "Ghazala" },
                  { key: "nejme", label: "Nejme Chamal", brandFilter: "Nejme Chamal", logoBrand: "Nejme Chamal" },
                  { key: "babsalama", label: "Bab Salama", brandFilter: "Bab Salama", logoBrand: "Bab Salama" },
                  { key: "globus", label: "Globus", brandFilter: "Globus", logoBrand: "Globus" },
                  { key: "wissam", label: "Al Wissam", brandFilter: "Wissam", logoBrand: "Al Wissam Addahabi" },
                  { key: "sahara", label: "Sahara Prestige", brandFilter: "Sahara Prestige", logoBrand: "Sahara Prestige" },
                  { key: "sat", label: "SAT First", brandFilter: "SAT First", logoBrand: "SAT First" },
                  { key: "sotram", label: "Sotram", brandFilter: "Sotram", logoBrand: "Sotram" },
                  { key: "jaouharat", label: "Jaouharat", brandFilter: "Jaouharat", logoBrand: "Jaouharat Agadir" },
                  { key: "starbus", label: "Star Bus", brandFilter: "Star Bus", logoBrand: "Star Bus STT" },
                  { key: "itrane", label: "Itrane", brandFilter: "Itrane", logoBrand: "Itrane Voyage" },
                  { key: "yamama", label: "Al Yamama", brandFilter: "Yamama", logoBrand: "Trans Al Yamama" },
                ]
              : tVehicleType === "train"
              ? [
                  { key: "all", label: tr("allCarriers"), brandFilter: "all", logoBrand: "ONCF" },
                  { key: "boraq", label: "Al Boraq TGV", brandFilter: "Boraq", logoBrand: "Al Boraq" },
                  { key: "atlas", label: "Al Atlas / TNR", brandFilter: "Atlas", logoBrand: "ONCF" },
                ]
              : [
                  { key: "all", label: tr("allCarriers"), brandFilter: "all", logoBrand: "" },
                  { key: "casatram", label: "Casa Tramway", brandFilter: "Casa Tramway", logoBrand: "Casa Tramway" },
                  { key: "casabusway", label: "Casa Busway", brandFilter: "Casa Busway", logoBrand: "Casa Busway" },
                  { key: "casabus", label: "Casabus", brandFilter: "Casabus", logoBrand: "Casabus" },
                  { key: "rabattram", label: "Rabat-Salé Tram", brandFilter: "Tramway Rabat", logoBrand: "Tramway Rabat-Salé" },
                  { key: "alsa", label: "ALSA Urban", brandFilter: "ALSA", logoBrand: "ALSA" },
                ]
            ).map((c) => {
              const active = tBrandFilter === c.brandFilter;
              return (
                <button
                  key={c.key}
                  type="button"
                  className={`marhaba-quiet-chip ${active ? "active" : ""}`}
                  style={c.logoBrand ? { display: "inline-flex", alignItems: "center", gap: 6, paddingInlineStart: 6, flexShrink: 0 } : { flexShrink: 0 }}
                  onClick={() => {
                    setTCarrierFilter("all");
                    setTBrandFilter(active && c.brandFilter !== "all" ? "all" : c.brandFilter);
                  }}
                >
                  {c.logoBrand && <TransportOfficialLogo carrierBrand={c.logoBrand} compact />}
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>

          <div className="marhaba-filter-selects">
            <BrandSelect
              compact
              ariaLabel={tr("allDayFilter")}
              value={timeWindow}
              onChange={(v) => setTimeWindow(v as typeof timeWindow)}
              options={[
                { value: "all", label: tr("allDayFilter") },
                { value: "morning", label: tr("morningFilter") },
                { value: "afternoon", label: tr("afternoonFilter") },
                { value: "evening", label: tr("eveningFilter") },
              ]}
            />
            <BrandSelect
              compact
              ariaLabel="Cabin class"
              value={tSeatClass}
              onChange={(v) => setTSeatClass(v as SeatClass)}
              options={[
                { value: "standard", label: tr("classStandard") },
                { value: "comfort", label: tr("classComfort") },
                { value: "vip", label: tr("classVip") },
              ]}
            />
            <BrandSelect
              compact
              ariaLabel="Sort schedules"
              value={tSort}
              onChange={(v) => setTSort(v as typeof tSort)}
              options={[
                { value: "best", label: tr("flightBestTab") },
                { value: "earliest", label: tr("sortEarliest") },
                { value: "cheapest", label: tr("sortCheapest") },
                { value: "fastest", label: tr("sortFastest") },
              ]}
            />
          </div>
        </div>
      )}

      {/* Results Area */}
      {step !== 3 && (
        <div className={tMode === "intercity" || transHistory.length > 0 ? "bus-results-layout" : ""}>
          <div style={{ display: "grid", gap: 14, minWidth: 0 }}>
            {/* 3-Column Best / Cheapest / Fastest Summary Switcher */}
            {!loadingOffers && sortedOffers.length > 0 && (
              <div className="flight-summary-tabs">
                {[
                  { id: "best" as const, label: tr("flightBestTab"), offer: bestOffer },
                  { id: "cheapest" as const, label: tr("flightCheapestTab"), offer: cheapestOffer },
                  { id: "fastest" as const, label: tr("flightFastestTab"), offer: fastestOffer },
                ].map((tabItem) => {
                  const active = tSort === tabItem.id;
                  return (
                    <button
                      key={tabItem.id}
                      type="button"
                      className={`flight-summary-tab ${active ? "active" : ""}`}
                      onClick={() => setTSort(tabItem.id)}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: 700, opacity: active ? 0.92 : 0.75 }}>{tabItem.label}</span>
                        {tabItem.offer && (
                          <TransportOfficialLogo carrierBrand={tabItem.offer.carrierBrand} carrierType={tabItem.offer.carrierType} compact />
                        )}
                      </div>
                      {tabItem.offer && (
                        <>
                          <div dir="ltr" style={{ fontSize: "1.12rem", fontWeight: 900, marginTop: 2 }}>
                            {money(computeOfferBaseTotal(tabItem.offer))}
                          </div>
                          <div style={{ fontSize: "0.73rem", opacity: 0.78 }}>
                            {formatDuration(tabItem.offer.durationMins)} · {tabItem.offer.carrierBrand}
                          </div>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Price Alert Banner ("Like these trips? Track prices") */}
            <div className="card card-body flight-track-banner">
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="flight-track-illus" aria-hidden="true">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                      <rect x="13" y="6" width="22" height="36" rx="5" fill="#1F40C5" />
                      <rect x="15.5" y="10" width="17" height="26" rx="2.5" fill="#EFF6FF" />
                      <path d="M24 16C21.8 16 20 17.8 20 20V24L18.5 26H29.5L28 24V20C28 17.8 26.2 16 24 16Z" fill="#F2B705" />
                      <circle cx="24" cy="27.5" r="1.5" fill="#1F40C5" />
                      <path d="M9 12L6 10M9 16H5M10 8L8 5" stroke="#F2B705" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <strong style={{ fontSize: "0.98rem", color: "var(--text)" }}>{tr("trackPricesTitle")}</strong>
                    <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 2 }}>{tr("trackPricesSub")}</div>
                  </div>
                </div>
                <button
                  type="button"
                  className={`btn btn-sm ${isTrackingRoute ? "btn-primary" : "btn-outline"}`}
                  onClick={toggleTrackRoute}
                >
                  {isTrackingRoute ? <BellRing size={14} /> : <Bell size={14} />}
                  <span>{isTrackingRoute ? tr("trackingActiveBtn") : tr("trackPricesBtn")}</span>
                </button>
              </div>
            </div>

            {/* Single Clean Summary Line */}
            {!loadingOffers && sortedOffers.length > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, fontSize: "0.84rem", color: "var(--text-muted)", paddingInline: 2 }}>
                <div>
                  <strong style={{ color: "var(--text)" }} dir="ltr">{sortedOffers.length}</strong>{" "}
                  <span>{tCity(lang, tOrigin)} → {tCity(lang, tMode === "intracity" ? tOrigin : tDest)}</span>
                  {corridorData.summary.cheapestMad !== null && (
                    <span dir="ltr"> · {money(corridorData.summary.cheapestMad)}+</span>
                  )}
                  {corridorData.summary.fastestMins !== null && (
                    <span dir="ltr"> · {formatDuration(corridorData.summary.fastestMins)}</span>
                  )}
                </div>
                {watchdogMsg && <span style={{ fontSize: "0.78rem" }} dir="ltr">{watchdogMsg}</span>}
              </div>
            )}

            {loadingOffers ? (
              <div style={{ display: "grid", gap: 12 }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card card-body" style={{ display: "grid", gap: 12 }}>
                    <div className="skeleton-shimmer" style={{ width: 130, height: 18, borderRadius: 999 }} />
                    <div className="skeleton-shimmer" style={{ width: "80%", height: 26 }} />
                    <div className="skeleton-shimmer" style={{ width: "45%", height: 14 }} />
                  </div>
                ))}
              </div>
            ) : sortedOffers.length === 0 ? (
              <div className="card card-body" style={{ display: "grid", gap: 14, maxWidth: 560 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Calendar size={18} style={{ color: "var(--primary)", flexShrink: 0 }} />
                  <strong style={{ fontSize: "0.96rem" }}>
                    {tr("noTripOnDatePrefix")} {formattedSelectedDate}
                  </strong>
                </div>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.55 }}>
                  {tr("requestThisRouteDesc")}
                </p>
                {routeRequestedDone ? (
                  <div className="badge badge-success" style={{ padding: "10px 14px", borderRadius: 10, width: "fit-content" }}>
                    <CheckCircle2 size={16} />
                    <span>{tr("routeRequestedToast")}</span>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={submitting}
                      onClick={requestPriorityRoute}
                    >
                      <Bus size={16} />
                      <span>{submitting ? tr("submittingLabel") : tr("requestThisRouteBtn")}</span>
                    </button>
                    {timeWindow !== "all" && (
                      <button type="button" className="btn btn-outline" onClick={() => setTimeWindow("all")}>
                        {tr("allDayFilter")}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              sortedOffers.map((offer) => {
                const isSelected = activeOffer?.offerCode === offer.offerCode;
                const isExpanded = expandedStopsCode === offer.offerCode;
                const unitFare = Math.round(offer.fareMad * classMultiplier(tSeatClass));
                const totalPaxFare = computeOfferBaseTotal(offer);
                const isBestPrice = offer.offerCode === cheapestOfferCode;
                const isFastest = offer.offerCode === fastestOfferCode;
                const isRail = offer.carrierType === "train_oncf";
                const co2Saved = isRail
                  ? Math.round(offer.distanceKm * 0.14)
                  : offer.carrierType !== "taxi_transfer"
                  ? Math.round(offer.distanceKm * 0.09)
                  : 0;

                // Show at most ONE primary highlight badge to keep cards airy
                const highlightTag = offer.isHighSpeed
                  ? { label: "Al Boraq 320 km/h", cls: "badge-gold", icon: Zap }
                  : isFastest
                  ? { label: tr("fastestBadge"), cls: "badge-primary", icon: Sparkles }
                  : isBestPrice
                  ? { label: tr("bestPriceBadge"), cls: "badge-success", icon: Tag }
                  : null;

                return (
                  <article
                    key={offer.offerCode}
                    className={`marhaba-pass-card ${isSelected ? "selected" : ""} ${isRail ? "accent-rail" : "accent-coach"}`}
                    onClick={() => setSelectedOfferCode(offer.offerCode)}
                  >
                    <div className="marhaba-pass-body">
                      {/* Clean Top Line: Official Carrier Logo + Name + at most 1 Highlight + Low-seat notice */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <TransportOfficialLogo carrierBrand={offer.carrierBrand} carrierType={offer.carrierType} height={22} />
                          <span style={{ fontWeight: 800, fontSize: "0.9rem", color: isRail ? "var(--primary)" : "var(--text)" }}>
                            {offer.carrierBrand}
                          </span>
                          {highlightTag && (
                            <span className={`badge ${highlightTag.cls}`} style={{ gap: 4, fontSize: "0.72rem", padding: "2px 8px" }}>
                              <highlightTag.icon size={11} /> {highlightTag.label}
                            </span>
                          )}
                        </div>
                        {offer.seatsLeft <= 6 && (
                          <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--warning)" }}>
                            {offer.seatsLeft} {tr("seatsLeftLabel")}
                          </span>
                        )}
                      </div>

                      {/* Airy Boarding Timeline */}
                      <div dir="ltr" className="bus-ticket-times">
                        <div style={{ minWidth: 0 }}>
                          <div className="bus-time-val">{offer.depTime}</div>
                          <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "var(--text)" }}>{tCity(lang, offer.originCity)}</div>
                          <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", overflowWrap: "anywhere" }}>{offer.originStation}</div>
                        </div>

                        <div className="bus-duration-col">
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span className="bus-dash-line" />
                            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--primary)", whiteSpace: "nowrap" }}>
                              {formatDuration(offer.durationMins)}
                            </span>
                            <span className="bus-dash-line" />
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 3 }}>
                            {offer.stops === 0 ? tr("directTripLabel") : `${offer.stops} ${tr("stopsLabel")}`}
                          </div>
                        </div>

                        <div style={{ textAlign: "end", minWidth: 0 }}>
                          <div className="bus-time-val">{offer.arrTime}</div>
                          <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "var(--text)" }}>{tCity(lang, offer.destinationCity)}</div>
                          <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", overflowWrap: "anywhere" }}>{offer.destinationStation}</div>
                        </div>
                      </div>

                      {/* Quiet Metadata Text + Inline Stops Link */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, paddingTop: 4, borderTop: "1px solid var(--border)" }}>
                        <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span>{offer.amenities.slice(0, 3).join(" · ")}</span>
                          {co2Saved > 0 && (
                            <span style={{ color: "var(--success)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 3 }}>
                              · <Leaf size={11} /> -{co2Saved} kg CO₂
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedStopsCode((prev) => (prev === offer.offerCode ? null : offer.offerCode));
                          }}
                          style={{
                            border: 0,
                            background: "transparent",
                            color: "var(--primary)",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            cursor: "pointer",
                            padding: "2px 4px",
                          }}
                        >
                          <MapIcon size={13} />
                          <span>{tr("inlineStopsToggle")}</span>
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                      </div>

                      {/* Inline Route Stops Drawer */}
                      {isExpanded && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            marginTop: 4,
                            padding: 14,
                            borderRadius: 12,
                            background: "var(--surface-muted)",
                            display: "grid",
                            gap: 12,
                          }}
                        >
                          <div className="bus-timeline">
                            {buildOfferStops(offer).map((st, idx, arr) => {
                              const isLast = idx === arr.length - 1;
                              return (
                                <div key={`${st.time}-${idx}`} className="bus-timeline-item">
                                  <span className={`bus-timeline-marker ${st.isEndpoint ? "endpoint" : ""}`}>
                                    {st.isEndpoint ? <MapPin size={11} /> : null}
                                  </span>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                                    <div>
                                      <strong dir="ltr" style={{ color: "var(--primary)", fontSize: "0.86rem" }}>{st.time}</strong>{" "}
                                      <span style={{ fontWeight: 700, fontSize: "0.86rem" }}>· {st.name}</span>
                                      {st.nextDay && (
                                        <span className="badge badge-primary" style={{ fontSize: "0.66rem", padding: "1px 6px", marginInlineStart: 6 }}>
                                          {tr("plusOneDay")}
                                        </span>
                                      )}
                                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{st.address}</div>
                                    </div>
                                    {st.isEndpoint && (
                                      <Link
                                        href={`/search?city=${encodeURIComponent(st.city)}&view=map`}
                                        className="btn btn-sm btn-outline"
                                        style={{ borderRadius: 8 }}
                                      >
                                        <MapIcon size={12} /> {tr("routeMapLabel")}
                                      </Link>
                                    )}
                                  </div>
                                  {!isLast && <span className="bus-timeline-connector" />}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Clean Price & CTA Stub */}
                    <div className="marhaba-pass-stub">
                      <div>
                        <div dir="ltr" style={{ fontSize: "1.35rem", fontWeight: 900, color: "var(--primary)", lineHeight: 1.1 }}>
                          {money(totalPaxFare)}
                        </div>
                        <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: 3 }}>
                          {tPax > 1 ? `${tPax} × ${money(unitFare)}` : tr("perPersonLabel")}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          openCheckoutForOffer(offer);
                        }}
                      >
                        {tr("selectDepartureBtn")}
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          {/* Minimal Sidebar: Only show relevant helper & active passes */}
          {(tMode === "intercity" || transHistory.length > 0) && (
            <aside style={{ display: "grid", gap: 14, minWidth: 0 }}>
              {tMode === "intercity" && (
                <div className="card card-body" style={{ display: "grid", gap: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.94rem" }}>
                    {tr("destinationStayCrossSell")} {tCity(lang, tDest)}?
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Link
                      href={`/search?city=${encodeURIComponent(tDest)}&type=stay&checkIn=${encodeURIComponent(tDate)}`}
                      className="btn btn-sm btn-outline"
                    >
                      <Building2 size={13} /> {tr("stays")}
                    </Link>
                    <Link
                      href={`/search?city=${encodeURIComponent(tDest)}&type=car&checkIn=${encodeURIComponent(tDate)}`}
                      className="btn btn-sm btn-outline"
                    >
                      <CarFront size={13} /> {tr("cars")}
                    </Link>
                  </div>
                </div>
              )}

              {transHistory.length > 0 && (
                <div className="card card-body" style={{ display: "grid", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontSize: "0.95rem" }}>{tr("yourTransportRequests")}</strong>
                    <span className="badge badge-muted" dir="ltr">{transHistory.length}</span>
                  </div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {visibleHistory.map((item) => (
                      <div key={String(item.id)} style={{ padding: 10, borderRadius: 10, border: "1px solid var(--border)", fontSize: "0.82rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                          <strong dir="ltr">{String(item.request_ref)}</strong>
                          <span dir="ltr" style={{ fontWeight: 700, color: "var(--primary)" }}>
                            {money(Number(item.indicative_price_mad))}
                          </span>
                        </div>
                        <div style={{ marginTop: 3, fontWeight: 600 }}>
                          {tCity(lang, String(item.origin_city))} → {tCity(lang, String(item.destination_city))}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>
                          {carrierLabel(String(item.carrier_type))} · <span dir="ltr">{String(item.travel_date)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {transHistory.length > 3 && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => setShowAllHistory((v) => !v)}
                    >
                      {showAllHistory ? tr("closeBtn") : `+${transHistory.length - 3}`}
                    </button>
                  )}
                </div>
              )}
            </aside>
          )}
        </div>
      )}

      {/* STEP 3: Calm, Streamlined MARHABA Checkout & Digital Mobility Pass */}
      {step === 3 && activeOffer && (
        <div style={{ display: "grid", gap: 18, minWidth: 0 }}>
          {confirmedTicket ? (
            <div className="card marhaba-digital-pass" style={{ maxWidth: 660, width: "100%", marginInline: "auto", overflow: "hidden" }}>
              <div style={{ background: "linear-gradient(135deg, var(--navy), var(--primary))", color: "#fff", padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <BrandLogo size="sm" showArabic={false} />
                  <span style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--gold)" }}>{tr("boardingPassTitle")}</span>
                </div>
                <span className="badge badge-gold" dir="ltr">
                  <CheckCircle2 size={14} /> {confirmedTicket.requestRef}
                </span>
              </div>

              <div className="card-body" style={{ display: "grid", gap: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: "1.3rem" }}>
                      {tCity(lang, tOrigin)} → {tCity(lang, tMode === "intracity" ? tOrigin : tDest)}
                    </h2>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: "0.86rem", color: "var(--text-muted)", marginTop: 6 }}>
                      {confirmedTicket.offer && (
                        <TransportOfficialLogo carrierBrand={confirmedTicket.offer.carrierBrand} carrierType={confirmedTicket.offer.carrierType} height={20} />
                      )}
                      <span>{confirmedTicket.offer?.carrierBrand} · {formattedSelectedDate}</span>
                    </div>
                    {confirmedTicket.offer && (
                      <div style={{ fontSize: "0.84rem", fontWeight: 700, marginTop: 4 }} dir="ltr">
                        {confirmedTicket.offer.depTime} ({confirmedTicket.offer.originStation}) → {confirmedTicket.offer.arrTime} ({confirmedTicket.offer.destinationStation})
                      </div>
                    )}
                  </div>
                  <div style={{ padding: 10, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface-muted)", display: "grid", placeItems: "center" }}>
                    <QrCode size={42} color="var(--primary)" />
                  </div>
                </div>

                <div className="grid-2" style={{ gap: 10, fontSize: "0.88rem", background: "var(--surface-muted)", padding: 14, borderRadius: 12 }}>
                  <div><strong>{tr("busFirstName")}:</strong> {confirmedTicket.passengerName}</div>
                  <div><strong>{tr("passengersLabel")}:</strong> {tPax} ({tSeatClass})</div>
                  <div><strong>{tr("busPayStep")}:</strong> {confirmedTicket.paymentMethod}</div>
                  <div><strong>{tr("total")}:</strong> <strong style={{ color: "var(--primary)" }}>{money(confirmedTicket.totalMad)}</strong></div>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button type="button" className="btn btn-outline" onClick={() => window.print()}>
                    <Printer size={15} /> Print Pass
                  </button>
                  <button type="button" className="btn btn-primary" onClick={() => { setConfirmedTicket(null); setStep(2); }}>
                    {tr("busStep2")}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={submitBusCheckout} className="bus-checkout-layout">
                <div style={{ display: "grid", gap: 14, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                    <button type="button" className="btn btn-sm btn-outline" onClick={() => setStep(2)}>
                      <ArrowLeft size={14} /> {tr("backBtn")}
                    </button>
                    <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <Clock size={14} color="var(--primary)" />
                      <strong dir="ltr" style={{ color: "var(--text)" }}>{holdClock}</strong>
                    </span>
                  </div>

                  {/* 1. Traveler Details */}
                  <section className="card card-body" style={{ display: "grid", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className="bus-section-num">1</span>
                      <h3 style={{ margin: 0, fontSize: "1.05rem" }}>{tr("busContactStep").replace(/^1\.\s*/, "")}</h3>
                    </div>

                    <div className="grid-2" style={{ gap: 12 }}>
                      <div>
                        <label className="field-label">{tr("busFirstName")}</label>
                        <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder="Ayoub" />
                      </div>
                      <div>
                        <label className="field-label">{tr("busLastName")}</label>
                        <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} required placeholder="Oumessa" />
                      </div>
                    </div>

                    <div>
                      <label className="field-label">{tr("busWhatsappNum")}</label>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span
                          className="badge"
                          style={{
                            height: 42,
                            paddingInline: 10,
                            borderRadius: "var(--radius-sm)",
                            border: "1.5px solid var(--border)",
                            background: "var(--surface-muted)",
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          🇲🇦 +212
                        </span>
                        <input
                          type="tel"
                          className="input"
                          dir="ltr"
                          placeholder="6 12 34 56 78"
                          value={tPhone}
                          onChange={(e) => setTPhone(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </section>

                  {/* 2. Cabin Class & Seat Preference */}
                  <section className="card card-body" style={{ display: "grid", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className="bus-section-num">2</span>
                      <h3 style={{ margin: 0, fontSize: "1.05rem" }}>{tr("seatComfortTitle")}</h3>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
                      {(["standard", "comfort", "vip"] as const).map((cls) => {
                        const active = tSeatClass === cls;
                        const previewFare = Math.round(activeOffer.fareMad * classMultiplier(cls));
                        return (
                          <button
                            key={cls}
                            type="button"
                            onClick={() => setTSeatClass(cls)}
                            className={`pay-option-card ${active ? "selected" : ""}`}
                            style={{ padding: "10px 12px", textAlign: "start" }}
                          >
                            <div>
                              <div style={{ fontWeight: 800, fontSize: "0.86rem" }}>
                                {cls === "standard" ? tr("classStandard") : cls === "comfort" ? tr("classComfort") : tr("classVip")}
                              </div>
                              <div style={{ fontSize: "0.78rem", color: "var(--primary)", fontWeight: 700 }} dir="ltr">
                                {money(previewFare)} / {tr("perPersonLabel")}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {[
                        { id: "open" as const, label: tr("busOpenSeatingTitle") },
                        { id: "window" as const, label: "Window / Fenêtre" },
                        { id: "front" as const, label: "Front / Avant" },
                      ].map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          className={`marhaba-quiet-chip ${seatPreference === s.id ? "active" : ""}`}
                          onClick={() => setSeatPreference(s.id)}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* 3. Payment */}
                  <section className="card card-body" style={{ display: "grid", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span className="bus-section-num">3</span>
                        <h3 style={{ margin: 0, fontSize: "1.05rem" }}>{tr("busPayStep").replace(/^3\.\s*/, "")}</h3>
                      </div>
                      <span style={{ fontSize: "0.78rem", color: "var(--success)", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Lock size={12} /> {tr("busSecureBadge")}
                      </span>
                    </div>

                    <div className="marhaba-pay-grid">
                      {[
                        { id: "card" as const, title: tr("payBankCard"), icon: CreditCard, cash: false },
                        { id: "bank_app" as const, title: tr("payBankApp"), icon: Smartphone, cash: false },
                        { id: "cash_network" as const, title: tr("payCashNetworks"), icon: Wallet, cash: true },
                        { id: "chaabi_tasshilat" as const, title: tr("payChaabiTasshilat"), icon: Wallet, cash: true },
                        { id: "paypal" as const, title: "PayPal", icon: ShieldCheck, cash: false },
                      ].map((opt) => {
                        const Icon = opt.icon;
                        const active = paymentMethod === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setPaymentMethod(opt.id)}
                            className={`pay-option-card ${active ? "selected" : ""}`}
                            style={{ textAlign: "start", padding: "11px 13px" }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                              <Icon size={17} style={{ color: active ? "var(--primary)" : "var(--text-muted)", flexShrink: 0 }} />
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text)" }}>{opt.title}</div>
                                {opt.cash && (
                                  <div style={{ fontSize: "0.7rem", color: "var(--gold)", fontWeight: 700 }}>{tr("payCashBadge")}</div>
                                )}
                              </div>
                            </div>
                            <span
                              style={{
                                width: 16,
                                height: 16,
                                borderRadius: "50%",
                                border: active ? "5px solid var(--primary)" : "2px solid var(--border)",
                                flexShrink: 0,
                              }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </section>
                </div>

                {/* Right Sticky Summary */}
                <aside className="bus-checkout-aside">
                  <div className="card card-body" style={{ display: "grid", gap: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ fontSize: "1rem" }}>{tr("yourReservationTitle")}</strong>
                      <span className="badge badge-muted" style={{ fontSize: "0.72rem" }}>{tSeatClass.toUpperCase()}</span>
                    </div>

                    <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 12, display: "grid", gap: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.82rem", fontWeight: 700 }}>{formattedSelectedDate}</span>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <TransportOfficialLogo carrierBrand={activeOffer.carrierBrand} carrierType={activeOffer.carrierType} compact />
                          <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--primary)" }}>{activeOffer.carrierBrand}</span>
                        </div>
                      </div>

                      <div style={{ display: "grid", gap: 8, borderTop: "1px solid var(--border)", paddingTop: 10, fontSize: "0.84rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700 }}>{tCity(lang, activeOffer.originCity)} · {activeOffer.originStation}</div>
                            <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }} dir="ltr">{activeOffer.depTime}</div>
                          </div>
                          <button type="button" className="btn btn-sm btn-outline" onClick={() => setStopsModalOffer(activeOffer)} aria-label={tr("inlineStopsToggle")}>
                            <MapIcon size={13} />
                          </button>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700 }}>{tCity(lang, activeOffer.destinationCity)} · {activeOffer.destinationStation}</div>
                            <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }} dir="ltr">{activeOffer.arrTime}</div>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setPolicyExpanded((v) => !v)}
                        style={{
                          border: 0,
                          background: "transparent",
                          padding: 0,
                          color: "var(--text-muted)",
                          fontSize: "0.76rem",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          cursor: "pointer",
                          width: "fit-content",
                        }}
                      >
                        <Info size={13} />
                        <span>{tr("cancellationsPoliciesTitle")}</span>
                        {policyExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                      {policyExpanded && (
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.5, paddingTop: 4, borderTop: "1px solid var(--border)" }}>
                          {tr("nonRefundableTag")} · {tr("nonModifiableTag")}. {tr("luggageFeeNotice")}
                        </div>
                      )}
                    </div>

                    <div style={{ padding: "9px 11px", borderRadius: 10, background: "var(--surface-muted)", fontSize: "0.78rem", display: "flex", gap: 8, alignItems: "flex-start", color: "var(--text-muted)" }}>
                      <Luggage size={15} style={{ color: "var(--primary)", flexShrink: 0, marginTop: 1 }} />
                      <span>{tr("luggageFeeNotice")}</span>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => setPromoOpen((v) => !v)}
                        style={{
                          width: "100%",
                          padding: "6px 2px",
                          background: "transparent",
                          border: 0,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          cursor: "pointer",
                          color: "var(--text)",
                          fontWeight: 700,
                          fontSize: "0.84rem",
                        }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <Tag size={14} style={{ color: "var(--primary)" }} />
                          {tr("discountCodeToggle")}
                        </span>
                        {promoOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                      {promoOpen && (
                        <div style={{ paddingTop: 8, display: "grid", gap: 8 }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <input className="input" placeholder="MARHABA10" value={promoInput} onChange={(e) => setPromoInput(e.target.value)} />
                            <button type="button" className="btn btn-sm btn-outline" onClick={() => setAppliedPromo(promoInput.trim().toUpperCase())}>
                              {tr("applyBtn")}
                            </button>
                          </div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {["MARHABA10", "SAHARA15"].map((c) => (
                              <button
                                key={c}
                                type="button"
                                className={`marhaba-quiet-chip ${appliedPromo === c ? "active" : ""}`}
                                onClick={() => { setPromoInput(c); setAppliedPromo(c); }}
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, display: "grid", gap: 7, fontSize: "0.86rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>{tPax} {tr("passengersLabel")}</span>
                        <strong dir="ltr">{money(checkoutBaseMad)}</strong>
                      </div>
                      {discountMad > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", color: "var(--success)" }}>
                          <span>Promo ({appliedPromo})</span>
                          <strong dir="ltr">-{money(discountMad)}</strong>
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>{tr("busServiceFeeLabel")}</span>
                        <span dir="ltr">{money(serviceFeeMad)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: 8, fontSize: "1.08rem", fontWeight: 900 }}>
                        <span>{tr("total")}</span>
                        <span dir="ltr" style={{ color: "var(--primary)" }}>{money(checkoutTotalMad)}</span>
                      </div>
                    </div>

                    <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: "0.76rem", color: "var(--text-muted)", lineHeight: 1.45 }}>
                      <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} style={{ marginTop: 2 }} />
                      <span>{tr("busCndpConsent")}</span>
                    </label>

                    {checkoutError && (
                      <div className="badge badge-danger" style={{ padding: "8px 10px", borderRadius: 8 }}>
                        {checkoutError}
                      </div>
                    )}

                    <button type="submit" className="btn btn-gold" disabled={submitting} style={{ width: "100%", paddingBlock: 13 }}>
                      <Lock size={15} />
                      <span>
                        {submitting ? tr("submittingLabel") : `${tr("confirmPayBtn")} (${money(checkoutTotalMad)})`}
                      </span>
                    </button>
                  </div>
                </aside>
              </form>

              <MoroccanPaymentBadges />
            </>
          )}
        </div>
      )}

      {/* Full Modal Route Timeline (for quick pin icon in checkout) */}
      {stopsModalOffer && (
        <div className="modal-backdrop" onClick={() => setStopsModalOffer(null)} role="dialog" aria-modal="true" aria-label={stopsModalOffer.carrierBrand}>
          <div className="modal-panel" style={{ maxWidth: 520, padding: 0, overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--text)" }}>{stopsModalOffer.carrierBrand}</div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  {formatDuration(stopsModalOffer.durationMins)} · {stopsModalOffer.stops === 0 ? tr("directTripLabel") : `${stopsModalOffer.stops} ${tr("stopsLabel")}`}
                </div>
              </div>
              <button type="button" className="btn btn-sm btn-outline" onClick={() => setStopsModalOffer(null)} aria-label={tr("closeBtn")}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: "18px 20px", maxHeight: "62dvh", overflowY: "auto", display: "grid", gap: 14 }}>
              <div className="bus-timeline">
                {buildOfferStops(stopsModalOffer).map((st, idx, arr) => {
                  const isLast = idx === arr.length - 1;
                  return (
                    <div key={`${st.time}-${idx}`} className="bus-timeline-item">
                      <span className={`bus-timeline-marker ${st.isEndpoint ? "endpoint" : ""}`}>
                        {st.isEndpoint ? <MapPin size={12} /> : null}
                      </span>
                      <div style={{ display: "grid", gap: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <strong dir="ltr" style={{ color: "var(--primary)", fontSize: "0.94rem" }}>{st.time}</strong>
                          <span style={{ fontWeight: 700, fontSize: "0.94rem", color: "var(--text)" }}>· {st.name}</span>
                          {st.nextDay && (
                            <span className="badge badge-primary" style={{ fontSize: "0.68rem", padding: "2px 7px" }}>
                              {tr("plusOneDay")}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{st.address}</div>
                      </div>
                      {!isLast && <span className="bus-timeline-connector" />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)" }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: "100%", paddingBlock: 12 }}
                onClick={() => setStopsModalOffer(null)}
              >
                {tr("closeBtn")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All 22 Moroccan Transport Companies Directory Modal */}
      {allCompaniesOpen && (
        <div className="modal-backdrop" onClick={() => setAllCompaniesOpen(false)} role="dialog" aria-modal="true" aria-label={tr("allCarriers")}>
          <div className="modal-panel" style={{ maxWidth: 740, maxHeight: "86vh", overflowY: "auto", padding: "20px", display: "grid", gap: 16 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.08rem", fontWeight: 900 }}>{tr("allCarriers")} · Morocco Mobility Directory (22)</h3>
                <p style={{ margin: "3px 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Coaches (Lkiran), ONCF Trains, Tramways, and City Bus networks across Morocco.
                </p>
              </div>
              <button type="button" className="btn btn-sm btn-outline" onClick={() => setAllCompaniesOpen(false)} aria-label={tr("closeBtn")}>
                <X size={16} />
              </button>
            </div>

            {([
              { vt: "bus" as const, title: `${tr("modeBusesLabel")} (15)` },
              { vt: "train" as const, title: `${tr("modeTrainsLabel")} (2)` },
              { vt: "tram" as const, title: `${tr("modeTramLabel")} & City Bus (5)` },
            ]).map((group) => (
              <div key={group.vt} style={{ display: "grid", gap: 8 }}>
                <strong style={{ fontSize: "0.86rem", color: "var(--primary)" }}>{group.title}</strong>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 10 }}>
                  {ALL_MOROCCO_COMPANIES.filter((co) => co.vehicleType === group.vt).map((co) => (
                    <div
                      key={co.brand}
                      style={{
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        padding: 11,
                        display: "grid",
                        gap: 8,
                        background: "var(--surface)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <TransportOfficialLogo carrierBrand={co.brand} height={24} />
                      </div>
                      <div>
                        <strong style={{ fontSize: "0.86rem" }}>{co.brand}</strong>
                        <div style={{ fontSize: "0.73rem", color: "var(--text-muted)" }}>{co.region}</div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        style={{ justifyContent: "space-between", width: "100%", fontSize: "0.74rem" }}
                        onClick={() => {
                          setTVehicleType(co.vehicleType);
                          setTOrigin(co.origin);
                          if (co.vehicleType !== "tram") setTDest(co.dest);
                          setTCarrierFilter("all");
                          setTBrandFilter(co.brandFilter);
                          setSelectedOfferCode(null);
                          setAllCompaniesOpen(false);
                        }}
                      >
                        <span>{co.vehicleType === "tram" ? tCity(lang, co.origin) : `${tCity(lang, co.origin)} → ${tCity(lang, co.dest)}`}</span>
                        <span>→</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
