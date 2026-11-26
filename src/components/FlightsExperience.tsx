"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowLeftRight,
  Bell,
  BellRing,
  Building2,
  CalendarDays,
  CarFront,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Crown,
  Info,
  Leaf,
  Lock,
  Luggage,
  MapPin,
  Minus,
  Plane,
  Plus,
  Printer,
  QrCode,
  ShieldCheck,
  Tag,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useApp } from "./AppProvider";
import { BrandLogo } from "./BrandLogo";
import { BrandSelect } from "./BrandSelect";
import { BrandDateRangePicker } from "./BrandDateRangePicker";
import { MoroccanPaymentBadges } from "./MoroccanPaymentBadges";
import { TraceImage } from "./TraceImage";
import { AirlineOfficialLogo } from "./CarrierOfficialLogo";
import { getDateLocale, tCity } from "@/lib/i18n";
import { formatDuration } from "@/lib/transport-engine";
import {
  AIRLINES,
  AIRPORTS_CATALOG,
  computeFlightOfferTotal,
  queryFlightsForDate,
  type AirlineCode,
  type FlightOffer,
} from "@/lib/flights-catalog";

const POPULAR_AIR_CORRIDORS: Array<{ origin: string; dest: string; label: string }> = [
  { origin: "Paris Orly (ORY)", dest: "Marrakech Menara (RAK)", label: "ORY → RAK" },
  { origin: "Casablanca Mohammed V (CMN)", dest: "Laâyoune Hassan I (EUN)", label: "CMN → EUN" },
  { origin: "Casablanca Mohammed V (CMN)", dest: "Dakhla (VIL)", label: "CMN → VIL" },
  { origin: "London Gatwick (LGW)", dest: "Marrakech Menara (RAK)", label: "LGW → RAK" },
  { origin: "Barcelona El Prat (BCN)", dest: "Marrakech Menara (RAK)", label: "BCN → RAK" },
  { origin: "Istanbul (IST)", dest: "Casablanca Mohammed V (CMN)", label: "IST → CMN" },
  { origin: "Frankfurt (FRA)", dest: "Casablanca Mohammed V (CMN)", label: "FRA → CMN" },
  { origin: "Doha Hamad (DOH)", dest: "Casablanca Mohammed V (CMN)", label: "DOH → CMN" },
  { origin: "Brussels Zaventem (BRU)", dest: "Casablanca Mohammed V (CMN)", label: "BRU → CMN" },
];

const AIRLINE_QUICK_ROUTE: Record<AirlineCode, { origin: string; dest: string }> = {
  AT: { origin: "Casablanca Mohammed V (CMN)", dest: "Laâyoune Hassan I (EUN)" },
  "3O": { origin: "Casablanca Mohammed V (CMN)", dest: "Agadir Al Massira (AGA)" },
  TO: { origin: "Paris Orly (ORY)", dest: "Marrakech Menara (RAK)" },
  FR: { origin: "Madrid Barajas (MAD)", dest: "Marrakech Menara (RAK)" },
  IB: { origin: "Madrid Barajas (MAD)", dest: "Casablanca Mohammed V (CMN)" },
  VY: { origin: "Barcelona El Prat (BCN)", dest: "Marrakech Menara (RAK)" },
  U2: { origin: "London Gatwick (LGW)", dest: "Marrakech Menara (RAK)" },
  TB: { origin: "Brussels Zaventem (BRU)", dest: "Casablanca Mohammed V (CMN)" },
  AF: { origin: "Paris Charles de Gaulle (CDG)", dest: "Casablanca Mohammed V (CMN)" },
  LH: { origin: "Frankfurt (FRA)", dest: "Casablanca Mohammed V (CMN)" },
  TK: { origin: "Istanbul (IST)", dest: "Casablanca Mohammed V (CMN)" },
  QR: { origin: "Doha Hamad (DOH)", dest: "Casablanca Mohammed V (CMN)" },
  NT: { origin: "Gran Canaria (LPA)", dest: "Laâyoune Hassan I (EUN)" },
};

export function AirlineLogoBadge({ code, size = 34 }: { code: AirlineCode; size?: number }) {
  return <AirlineOfficialLogo code={code} height={Math.max(18, Math.round(size * 0.72))} compact={size <= 24} />;
}

function normalizePhone(raw: string): string {
  const cleaned = raw.trim().replace(/\s+/g, "");
  if (!cleaned) return "";
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("00")) return `+${cleaned.slice(2)}`;
  if (cleaned.startsWith("212")) return `+${cleaned}`;
  if (cleaned.startsWith("0")) return `+212${cleaned.slice(1)}`;
  return `+212${cleaned}`;
}

export function FlightsExperience({
  flightHistory,
  onReloadHistory,
}: {
  flightHistory: Array<Record<string, unknown>>;
  onReloadHistory: () => void;
}) {
  const { lang, money, user, tr, notify } = useApp();
  const dateLocale = getDateLocale(lang);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [step, setStep] = useState<2 | 3>(2);
  const [tripType, setTripType] = useState<"one_way" | "round_trip">("round_trip");
  const [fOrigin, setFOrigin] = useState("Paris Orly (ORY)");
  const [fDest, setFDest] = useState("Marrakech Menara (RAK)");
  const [fDep, setFDep] = useState(() => new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10));
  const [fRet, setFRet] = useState(() => new Date(Date.now() + 14 * 86400_000).toISOString().slice(0, 10));
  const [fCabin, setFCabin] = useState<"economy" | "business">("economy");
  const [fAdults, setFAdults] = useState(1);
  const [fChildren, setFChildren] = useState(0);

  const [airlineFilter, setAirlineFilter] = useState<"all" | AirlineCode>("all");
  const [timeWindow, setTimeWindow] = useState<"all" | "morning" | "afternoon" | "evening">("all");
  const [directOnly, setDirectOnly] = useState(false);
  const [fSort, setFSort] = useState<"best" | "earliest" | "cheapest" | "fastest">("best");
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const [selectedOfferCode, setSelectedOfferCode] = useState<string | null>(null);
  const [paxPopoverOpen, setPaxPopoverOpen] = useState(false);
  const [fullCalendarOpen, setFullCalendarOpen] = useState(false);
  const [calMonthOffset, setCalMonthOffset] = useState(0);
  const dateRowRef = useRef<HTMLDivElement | null>(null);
  const [allAirlinesOpen, setAllAirlinesOpen] = useState(false);
  const [trackedCorridors, setTrackedCorridors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem("marhaba_flight_alerts");
      if (saved) setTrackedCorridors(JSON.parse(saved));
    } catch {}
  }, []);

  // Checkout state (Step 3)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [fPhone, setFPhone] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fBaggage, setFBaggage] = useState(true);
  const [fFlex, setFFlex] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "bank_app" | "cash_network" | "chaabi_tasshilat" | "paypal">("card");
  const [appliedPromo, setAppliedPromo] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [confirmedFlight, setConfirmedFlight] = useState<{
    requestRef: string;
    note?: string;
    totalMad: number;
    offer: FlightOffer | null;
    arrivalCars: Array<{ id: number; slug: string; title: string; city: string; base_price_mad: number }>;
  } | null>(null);

  useEffect(() => {
    if (user) {
      if (!firstName && user.full_name) setFirstName(user.full_name.split(" ")[0] || "");
      if (!lastName && user.full_name) setLastName(user.full_name.split(" ").slice(1).join(" ") || "");
      if (!fPhone && user.phone) setFPhone(user.phone);
      if (!fEmail && user.email) setFEmail(user.email);
    }
  }, [user, firstName, lastName, fPhone, fEmail]);

  const airportSelectOptions = useMemo(
    () =>
      AIRPORTS_CATALOG.map((a) => ({
        value: `${a.city} (${a.code})`,
        label: `${a.code} · ${tCity(lang, a.city)} (${a.name})`,
        hint: a.country,
      })),
    [lang]
  );

  const totalPax = Math.max(1, fAdults + fChildren);

  const computeOfferTotal = (offer: FlightOffer) =>
    computeFlightOfferTotal(offer, tripType, fAdults, fChildren);

  const dateAvailability = useMemo(
    () => queryFlightsForDate(fOrigin, fDest, fCabin, fDep, totalPax),
    [fOrigin, fDest, fCabin, fDep, totalPax]
  );

  const rawOffers = dateAvailability.offers;

  // 7-day horizontal departure strip synchronized with real flight & seat availability + exact total fare
  const dateStrip = useMemo(() => {
    if (!mounted) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selParts = fDep.split("-").map(Number);
    const selDate =
      selParts.length === 3 && !selParts.some(Number.isNaN)
        ? new Date(selParts[0], selParts[1] - 1, selParts[2])
        : new Date(today.getTime() + 7 * 86400_000);
    const startWindow = new Date(selDate);
    startWindow.setDate(selDate.getDate() - 3);
    const minWindow = new Date(today);
    minWindow.setDate(today.getDate() + 1);
    const anchor = startWindow < minWindow ? minWindow : startWindow;

    const rawDays: Array<{
      iso: string;
      weekday: string;
      dayNum: string;
      estFare: number | null;
      seatsLeft: number;
      flightsCount: number;
    }> = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(anchor);
      d.setDate(anchor.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const dayRes = queryFlightsForDate(fOrigin, fDest, fCabin, iso, totalPax);
      const cheapestDayOffer =
        dayRes.offers.length > 0
          ? [...dayRes.offers].sort((a, b) => a.baseFareMad - b.baseFareMad)[0]
          : null;
      const estFare = cheapestDayOffer
        ? computeFlightOfferTotal(cheapestDayOffer, tripType, fAdults, fChildren)
        : null;
      rawDays.push({
        iso,
        weekday: d.toLocaleDateString(dateLocale, { weekday: "short" }),
        dayNum: d.toLocaleDateString(dateLocale, { day: "numeric", month: "short" }),
        estFare,
        seatsLeft: dayRes.totalSeatsLeft,
        flightsCount: dayRes.offers.length,
      });
    }
    const availableFares = rawDays.map((x) => x.estFare).filter((v): v is number => v !== null);
    const lowest = availableFares.length > 0 ? Math.min(...availableFares) : null;
    return rawDays.map((item) => ({
      ...item,
      isLowest: item.estFare !== null && lowest !== null && item.estFare === lowest,
    }));
  }, [mounted, dateLocale, fOrigin, fDest, fCabin, fDep, tripType, fAdults, fChildren, totalPax]);

  // Full Monthly Calendar (same clean horizontal pill strip style, filtered to open/future days of selected month)
  const monthTabs = useMemo(() => {
    if (!mounted) return [];
    const today = new Date();
    return Array.from({ length: 6 }, (_, offset) => {
      const d = new Date(today.getFullYear(), today.getMonth() + offset, 1);
      return {
        offset,
        label: d.toLocaleDateString(dateLocale, { month: "short", year: "numeric" }),
      };
    });
  }, [mounted, dateLocale]);

  const fullMonthCalendar = useMemo(() => {
    if (!mounted) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetMonthDate = new Date(today.getFullYear(), today.getMonth() + calMonthOffset, 1);
    const year = targetMonthDate.getFullYear();
    const month = targetMonthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: Array<{
      iso: string;
      weekday: string;
      dayNum: string;
      estFare: number | null;
      seatsLeft: number;
      flightsCount: number;
      isLowest?: boolean;
    }> = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      if (d <= today) continue;
      const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const res = queryFlightsForDate(fOrigin, fDest, fCabin, iso, totalPax);
      const cheapestOffer =
        res.offers.length > 0
          ? [...res.offers].sort((a, b) => a.baseFareMad - b.baseFareMad)[0]
          : null;
      const estFare = cheapestOffer
        ? computeFlightOfferTotal(cheapestOffer, tripType, fAdults, fChildren)
        : null;
      days.push({
        iso,
        weekday: d.toLocaleDateString(dateLocale, { weekday: "short" }),
        dayNum: d.toLocaleDateString(dateLocale, { day: "numeric", month: "short" }),
        estFare,
        seatsLeft: res.totalSeatsLeft,
        flightsCount: res.offers.length,
      });
    }

    const monthFares = days.map((c) => c.estFare).filter((v): v is number => v !== null);
    const lowestFare = monthFares.length > 0 ? Math.min(...monthFares) : null;
    const availableDaysCount = days.filter((c) => c.estFare !== null).length;

    return {
      monthTitle: targetMonthDate.toLocaleDateString(dateLocale, { month: "long", year: "numeric" }),
      lowestFare,
      availableDaysCount,
      days: days.map((c) => ({
        ...c,
        isLowest: c.estFare !== null && lowestFare !== null && c.estFare === lowestFare,
      })),
    };
  }, [mounted, calMonthOffset, dateLocale, fOrigin, fDest, fCabin, tripType, fAdults, fChildren, totalPax]);

  const displayedDatePills = fullCalendarOpen && fullMonthCalendar ? fullMonthCalendar.days : dateStrip;

  const selectDepartureDate = (iso: string) => {
    setFDep(iso);
    setSelectedOfferCode(null);
    if (tripType === "round_trip" && (!fRet || fRet <= iso)) {
      const d = new Date(`${iso}T00:00:00`);
      d.setDate(d.getDate() + 7);
      setFRet(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
    }
  };

  const availableAirlines = useMemo(() => {
    const codes = new Set<AirlineCode>();
    for (const o of rawOffers) codes.add(o.airlineCode);
    return Array.from(codes);
  }, [rawOffers]);

  const flightBestScore = (o: FlightOffer) => o.baseFareMad + o.stops * 320 + o.durationMins * 1.4;

  const filteredOffers = useMemo(() => {
    const list = rawOffers.filter((o) => {
      if (airlineFilter !== "all" && o.airlineCode !== airlineFilter) return false;
      if (directOnly && o.stops > 0) return false;
      if (timeWindow !== "all") {
        const h = Number(o.depTime.split(":")[0]) || 10;
        if (timeWindow === "morning" && !(h >= 4 && h < 12)) return false;
        if (timeWindow === "afternoon" && !(h >= 12 && h < 18)) return false;
        if (timeWindow === "evening" && !(h >= 18 || h < 4)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (fSort === "best") return flightBestScore(a) - flightBestScore(b);
      if (fSort === "cheapest") return a.baseFareMad - b.baseFareMad;
      if (fSort === "fastest") return a.durationMins - b.durationMins;
      return a.depTime.localeCompare(b.depTime);
    });
  }, [rawOffers, airlineFilter, directOnly, timeWindow, fSort]);

  const bestOffer = useMemo(() => {
    if (filteredOffers.length === 0) return null;
    return [...filteredOffers].sort((a, b) => flightBestScore(a) - flightBestScore(b))[0];
  }, [filteredOffers]);

  const cheapestOffer = useMemo(() => {
    if (filteredOffers.length === 0) return null;
    return [...filteredOffers].sort((a, b) => a.baseFareMad - b.baseFareMad)[0];
  }, [filteredOffers]);

  const fastestOffer = useMemo(() => {
    if (filteredOffers.length === 0) return null;
    return [...filteredOffers].sort((a, b) => a.durationMins - b.durationMins)[0];
  }, [filteredOffers]);

  const cheapestCode = cheapestOffer?.offerCode || null;
  const fastestCode = fastestOffer?.offerCode || null;

  const corridorKey = `${fOrigin}__${fDest}__${fCabin}`;
  const isTrackingCorridor = Boolean(trackedCorridors[corridorKey]);

  const toggleTrackCorridor = () => {
    const next = { ...trackedCorridors, [corridorKey]: !isTrackingCorridor };
    setTrackedCorridorState(next);
  };

  const setTrackedCorridorState = (next: Record<string, boolean>) => {
    setTrackedCorridors(next);
    try {
      localStorage.setItem("marhaba_flight_alerts", JSON.stringify(next));
    } catch {}
    notify(!isTrackingCorridor ? tr("trackingActiveBtn") : tr("trackPricesBtn"), "success");
  };

  const activeOffer = filteredOffers.find((o) => o.offerCode === selectedOfferCode) || filteredOffers[0] || null;

  const swapAirports = () => {
    setFOrigin(fDest);
    setFDest(fOrigin);
    setSelectedOfferCode(null);
    setExpandedCode(null);
    setAirlineFilter("all");
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError("");
    const normalizedPhone = normalizePhone(fPhone || user?.phone || "");
    if (normalizedPhone.length < 7) {
      setCheckoutError(`${tr("busWhatsappNum")} (+212 6...)`);
      return;
    }
    if (!termsAccepted) {
      setCheckoutError(tr("busCndpConsent"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/services/flights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripType,
          origin: activeOffer ? `${activeOffer.originCity} (${activeOffer.originCode})` : fOrigin,
          destination: activeOffer ? `${activeOffer.destinationCity} (${activeOffer.destinationCode})` : fDest,
          departureDate: fDep,
          returnDate: tripType === "round_trip" ? fRet : "",
          cabinClass: fCabin,
          adults: fAdults,
          children: fChildren,
          extraBaggage: fBaggage,
          flexibleDates: fFlex,
          contactPhone: normalizedPhone,
          contactEmail: fEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCheckoutError(data.error || "Submission failed");
        return;
      }

      const base = activeOffer ? computeOfferTotal(activeOffer) : 1450 * totalPax;
      const bagFee = fBaggage && activeOffer && !activeOffer.baggageIncluded.includes("23") ? 280 * totalPax : 0;
      const discount = appliedPromo === "SAHARA15" ? Math.round(base * 0.15) : appliedPromo === "MARHABA10" ? Math.round(base * 0.1) : 0;

      setConfirmedFlight({
        requestRef: data.requestRef,
        note: data.note,
        totalMad: Math.max(200, base + bagFee - discount),
        offer: activeOffer,
        arrivalCars: data.arrivalCars || [],
      });
      notify(data.requestRef, "success");
      onReloadHistory();
    } catch {
      setCheckoutError("Network error submitting flight request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bus-root" style={{ gap: 18 }}>
      {/* Visual Aviation Showcase + Search Card */}
      {step === 2 && (
        <section
          className={`card card-body marhaba-search-card ${fCabin === "business" ? "marhaba-search-card-lux" : ""}`}
          style={{ display: "grid", gap: 14, minWidth: 0 }}
        >
          {/* Visual Aviation Banner Strip */}
          <div className="flight-visual-banner">
            <div className="flight-visual-copy">
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span className="badge badge-primary" style={{ gap: 5 }}>
                  <Plane size={13} /> {tr("flightTabTitle")}
                </span>
                <button
                  type="button"
                  onClick={() => setAllAirlinesOpen(true)}
                  className="btn btn-sm btn-outline"
                  style={{ borderRadius: 999, gap: 6 }}
                >
                  <Building2 size={13} />
                  <span>{tr("allAirlinesFilter")} (13)</span>
                </button>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: "0.84rem", color: "var(--text-muted)" }}>{tr("flightDisclaimer")}</p>
            </div>
            <div className="flight-visual-thumbs">
              <div className="flight-thumb-box">
                <TraceImage src="/images/services/flights-ram-wing.jpg" alt="Morocco Sky Routes" label="Sky" className="prop-img" priority />
              </div>
              <div className="flight-thumb-box">
                <TraceImage src="/images/services/flights-onda-terminal.jpg" alt="ONDA Terminal" label="ONDA" className="prop-img" priority />
              </div>
            </div>
          </div>

          {/* Trip Type & Cabin Segmented Controls */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div className="marhaba-segmented" role="tablist">
              <button
                type="button"
                className={`marhaba-seg-btn ${tripType === "round_trip" ? "active" : ""}`}
                onClick={() => setTripType("round_trip")}
              >
                <ArrowLeftRight size={14} />
                <span>{tr("roundTripLabel")}</span>
              </button>
              <button
                type="button"
                className={`marhaba-seg-btn ${tripType === "one_way" ? "active" : ""}`}
                onClick={() => setTripType("one_way")}
              >
                <Plane size={14} />
                <span>{tr("oneWayLabel")}</span>
              </button>
            </div>

            <div className="marhaba-segmented">
              <button
                type="button"
                className={`marhaba-seg-btn ${fCabin === "economy" ? "active" : ""}`}
                onClick={() => setFCabin("economy")}
              >
                <span>{tr("economyLabel")}</span>
              </button>
              <button
                type="button"
                className={`marhaba-seg-btn marhaba-seg-btn-lux ${fCabin === "business" ? "active" : ""}`}
                onClick={() => setFCabin("business")}
              >
                <Crown size={14} />
                <span>{tr("businessLabel")}</span>
              </button>
            </div>
          </div>

          {/* Airport Search Grid */}
          <div className="bus-search-grid">
            <div className="bus-field-origin">
              <label className="field-label">{tr("originAirportLabel")}</label>
              <BrandSelect
                value={fOrigin}
                ariaLabel={tr("originAirportLabel")}
                onChange={(v) => {
                  setFOrigin(v);
                  setSelectedOfferCode(null);
                  setExpandedCode(null);
                  setAirlineFilter("all");
                }}
                options={airportSelectOptions}
              />
            </div>

            <div className="bus-field-swap">
              <button type="button" className="btn btn-outline bus-swap-btn" onClick={swapAirports} aria-label={tr("swapCitiesBtn")}>
                <ArrowLeftRight size={16} />
              </button>
            </div>

            <div className="bus-field-dest">
              <label className="field-label">{tr("destMoroccoLabel")}</label>
              <BrandSelect
                value={fDest}
                ariaLabel={tr("destMoroccoLabel")}
                onChange={(v) => {
                  setFDest(v);
                  setSelectedOfferCode(null);
                  setExpandedCode(null);
                  setAirlineFilter("all");
                }}
                options={airportSelectOptions}
              />
            </div>

            <div className="bus-field-date">
              <label className="field-label">{tr("travelDateLabel")}</label>
              {tripType === "round_trip" ? (
                <BrandDateRangePicker
                  mode="range"
                  startDate={fDep}
                  endDate={fRet}
                  onChangeStart={setFDep}
                  onChangeEnd={setFRet}
                  startLabel={tr("search.checkIn")}
                  endLabel={tr("search.checkOut")}
                />
              ) : (
                <BrandDateRangePicker mode="single" startDate={fDep} onChangeStart={setFDep} startLabel="" />
              )}
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
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {fCabin === "business" ? (
                    <Crown size={14} style={{ color: "#b45309", flexShrink: 0 }} />
                  ) : (
                    <Users size={14} style={{ color: "var(--primary)", flexShrink: 0 }} />
                  )}
                  <span dir="ltr">{totalPax}</span> · {fCabin === "business" ? tr("businessLabel") : tr("economyLabel")}
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
                    width: 260,
                    display: "grid",
                    gap: 12,
                    boxShadow: "var(--shadow-lg)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.86rem" }}>{tr("adultsLabel")}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button type="button" className="btn btn-sm btn-outline" onClick={() => setFAdults((a) => Math.max(1, a - 1))}>
                        <Minus size={12} />
                      </button>
                      <strong dir="ltr" style={{ minWidth: 18, textAlign: "center" }}>{fAdults}</strong>
                      <button type="button" className="btn btn-sm btn-outline" onClick={() => setFAdults((a) => Math.min(9, a + 1))}>
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.86rem" }}>{tr("childrenLabel")}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button type="button" className="btn btn-sm btn-outline" onClick={() => setFChildren((c) => Math.max(0, c - 1))}>
                        <Minus size={12} />
                      </button>
                      <strong dir="ltr" style={{ minWidth: 18, textAlign: "center" }}>{fChildren}</strong>
                      <button type="button" className="btn btn-sm btn-outline" onClick={() => setFChildren((c) => Math.min(8, c + 1))}>
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      className={`btn btn-sm ${fCabin === "economy" ? "btn-primary" : "btn-outline"}`}
                      style={{ flex: 1 }}
                      onClick={() => setFCabin("economy")}
                    >
                      {tr("economyLabel")}
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${fCabin === "business" ? "marhaba-seg-btn-lux active" : "btn-outline marhaba-seg-btn-lux"}`}
                      style={{ flex: 1, borderRadius: 999, gap: 5 }}
                      onClick={() => setFCabin("business")}
                    >
                      <Crown size={13} />
                      <span>{tr("businessLabel")}</span>
                    </button>
                  </div>
                  <button type="button" className="btn btn-sm btn-primary" onClick={() => setPaxPopoverOpen(false)}>
                    {tr("doneBtn")}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Clean Horizontal Date Strip (Week or Full Month in exact same pill row) + Popular Air Corridors */}
          <div style={{ display: "grid", gap: 10, minWidth: 0, maxWidth: "100%" }}>
            {fullCalendarOpen && fullMonthCalendar && (
              <div className="no-scrollbar" style={{ display: "flex", alignItems: "center", gap: 6, overflowX: "auto", minWidth: 0, maxWidth: "100%" }}>
                {monthTabs.map((mt) => (
                  <button
                    key={mt.offset}
                    type="button"
                    className={`marhaba-quiet-chip ${calMonthOffset === mt.offset ? "active" : ""}`}
                    onClick={() => {
                      setCalMonthOffset(mt.offset);
                      dateRowRef.current?.scrollTo({ left: 0, behavior: "smooth" });
                    }}
                  >
                    {mt.label}
                  </button>
                ))}
                {fullMonthCalendar.lowestFare !== null && (
                  <span className="badge badge-success" dir="ltr" style={{ whiteSpace: "nowrap", flexShrink: 0 }}>
                    {lang === "ar" ? "الأرخص:" : lang === "fr" ? "Min :" : "Min:"} {money(fullMonthCalendar.lowestFare)}
                  </span>
                )}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "stretch", gap: 6, minWidth: 0, maxWidth: "100%" }}>
              {fullCalendarOpen && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  style={{ flexShrink: 0, paddingInline: 8, borderRadius: 12 }}
                  onClick={() => dateRowRef.current?.scrollBy({ left: -240, behavior: "smooth" })}
                  aria-label="Scroll left"
                >
                  <ChevronLeft size={15} />
                </button>
              )}

              <div
                ref={dateRowRef}
                className="no-scrollbar"
                style={{ display: "flex", gap: 8, overflowX: "auto", alignItems: "center", flex: "1 1 0%", minWidth: 0 }}
              >
                {displayedDatePills.length === 0 ? (
                  <div className="skeleton-shimmer" style={{ width: "100%", height: 56, borderRadius: 10 }} />
                ) : (
                  displayedDatePills.map((d) => {
                    const unavailable = d.estFare === null || d.seatsLeft < totalPax;
                    const active = fDep === d.iso;
                    return (
                      <button
                        key={d.iso}
                        type="button"
                        disabled={unavailable}
                        onClick={() => selectDepartureDate(d.iso)}
                        className={`marhaba-date-pill ${active ? "active" : ""}`}
                        style={{
                          minWidth: 94,
                          opacity: unavailable ? 0.45 : 1,
                          cursor: unavailable ? "not-allowed" : "pointer",
                        }}
                      >
                        <span style={{ fontSize: "0.66rem", textTransform: "uppercase", opacity: 0.78 }}>{d.weekday}</span>
                        <span style={{ fontSize: "0.82rem", fontWeight: 800 }}>{d.dayNum}</span>
                        {unavailable || d.estFare === null ? (
                          <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)" }}>
                            {lang === "ar" ? "غير متاح" : lang === "fr" ? "Complet" : "Sold out"}
                          </span>
                        ) : (
                          <>
                            <span
                              dir="ltr"
                              style={{
                                fontSize: "0.72rem",
                                fontWeight: 800,
                                color: active ? "#fff" : d.isLowest ? "var(--success)" : "var(--primary)",
                              }}
                            >
                              {money(d.estFare)}
                            </span>
                            <span
                              dir="ltr"
                              style={{
                                fontSize: "0.64rem",
                                fontWeight: 700,
                                opacity: active ? 0.92 : 0.82,
                                color: active ? "#fff" : d.seatsLeft <= 5 ? "var(--warning)" : "var(--text-muted)",
                              }}
                            >
                              {d.seatsLeft} {tr("seatsLeftLabel")}
                            </span>
                          </>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {fullCalendarOpen && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  style={{ flexShrink: 0, paddingInline: 8, borderRadius: 12 }}
                  onClick={() => dateRowRef.current?.scrollBy({ left: 240, behavior: "smooth" })}
                  aria-label="Scroll right"
                >
                  <ChevronRight size={15} />
                </button>
              )}

              <button
                type="button"
                className={`btn btn-sm ${fullCalendarOpen ? "btn-primary" : "btn-outline"}`}
                onClick={() => setFullCalendarOpen((v) => !v)}
                style={{ flexShrink: 0, display: "inline-flex", flexDirection: "column", justifyContent: "center", gap: 3, paddingInline: 11, borderRadius: 12 }}
                aria-expanded={fullCalendarOpen}
              >
                <CalendarDays size={16} />
                <span style={{ fontSize: "0.7rem", whiteSpace: "nowrap" }}>
                  {fullCalendarOpen
                    ? lang === "ar"
                      ? "الأسبوع"
                      : lang === "fr"
                      ? "Semaine"
                      : "7 Days"
                    : lang === "ar"
                    ? "الشهر كامل"
                    : lang === "fr"
                    ? "Tout le mois"
                    : "Full Month"}
                </span>
              </button>
            </div>

            <div className="no-scrollbar" style={{ display: "flex", gap: 6, overflowX: "auto", alignItems: "center", minWidth: 0, maxWidth: "100%" }}>
              <span style={{ fontSize: "0.76rem", color: "var(--text-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>
                {tr("popularRoutesLabel")}:
              </span>
              {POPULAR_AIR_CORRIDORS.map((c) => {
                const active = fOrigin.includes(c.origin.slice(-5)) && fDest.includes(c.dest.slice(-5));
                return (
                  <button
                    key={c.label}
                    type="button"
                    className={`marhaba-quiet-chip ${active ? "active" : ""}`}
                    onClick={() => {
                      setFOrigin(c.origin);
                      setFDest(c.dest);
                      setAirlineFilter("all");
                      setSelectedOfferCode(null);
                    }}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Flat Airline Logo Filter Toolbar */}
      {step === 2 && (
        <div className="marhaba-filter-bar">
          <div className="no-scrollbar" style={{ display: "flex", gap: 6, overflowX: "auto", alignItems: "center", flex: "1 1 280px", minWidth: 0, maxWidth: "100%" }}>
            <button
              type="button"
              className={`marhaba-quiet-chip ${airlineFilter === "all" ? "active" : ""}`}
              onClick={() => setAirlineFilter("all")}
            >
              {tr("allAirlinesFilter")}
            </button>
            {(availableAirlines.length > 0 ? availableAirlines : (["AT", "3O", "TO", "FR", "IB", "VY", "U2", "TB", "AF", "LH", "TK", "QR", "NT"] as AirlineCode[])).map((code) => {
              const al = AIRLINES[code];
              const active = airlineFilter === code;
              return (
                <button
                  key={code}
                  type="button"
                  className={`marhaba-quiet-chip ${active ? "active" : ""}`}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, paddingInlineStart: 6 }}
                  onClick={() => setAirlineFilter(active ? "all" : code)}
                >
                  <AirlineLogoBadge code={code} size={20} />
                  <span>{al.shortName}</span>
                </button>
              );
            })}
            <button
              type="button"
              className={`marhaba-quiet-chip ${directOnly ? "active" : ""}`}
              onClick={() => setDirectOnly((v) => !v)}
            >
              {tr("directOnlyLabel")}
            </button>
          </div>

          <div className="marhaba-filter-selects" style={{ gridTemplateColumns: "repeat(2, minmax(130px, 160px))" }}>
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
              ariaLabel="Sort flights"
              value={fSort}
              onChange={(v) => setFSort(v as typeof fSort)}
              options={[
                { value: "best", label: tr("flightBestTab") },
                { value: "cheapest", label: tr("sortCheapest") },
                { value: "fastest", label: tr("sortFastest") },
                { value: "earliest", label: tr("sortEarliest") },
              ]}
            />
          </div>
        </div>
      )}

      {/* Results & Optional Flight Requests Sidebar */}
      {step === 2 ? (
        <div className={flightHistory.length > 0 ? "bus-results-layout" : undefined} style={flightHistory.length === 0 ? { display: "grid", gap: 14, minWidth: 0 } : undefined}>
          <div style={{ display: "grid", gap: 14, minWidth: 0 }}>
            {/* Skyscanner-Grade 3-Column Best / Cheapest / Fastest Fare Strip */}
            {filteredOffers.length > 0 && (
              <div className="flight-summary-tabs">
                {[
                  { id: "best" as const, label: tr("flightBestTab"), offer: bestOffer },
                  { id: "cheapest" as const, label: tr("flightCheapestTab"), offer: cheapestOffer },
                  { id: "fastest" as const, label: tr("flightFastestTab"), offer: fastestOffer },
                ].map((tabItem) => {
                  const active = fSort === tabItem.id;
                  return (
                    <button
                      key={tabItem.id}
                      type="button"
                      className={`flight-summary-tab ${active ? "active" : ""}`}
                      onClick={() => setFSort(tabItem.id)}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: 700, opacity: active ? 0.92 : 0.75 }}>{tabItem.label}</span>
                        {tabItem.offer && <AirlineOfficialLogo code={tabItem.offer.airlineCode} compact />}
                      </div>
                      {tabItem.offer && (
                        <>
                          <div dir="ltr" style={{ fontSize: "1.12rem", fontWeight: 900, marginTop: 2 }}>
                            {money(computeOfferTotal(tabItem.offer))}
                          </div>
                          <div style={{ fontSize: "0.73rem", opacity: 0.78 }}>
                            {formatDuration(tabItem.offer.durationMins)} · {tabItem.offer.stops === 0 ? tr("directTripLabel") : `${tabItem.offer.stops} ${tr("stopsLabel")}`}
                          </div>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Skyscanner-style Price Alert Banner ("Like these flights? Track prices") */}
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
                  className={`btn btn-sm ${isTrackingCorridor ? "btn-primary" : "btn-outline"}`}
                  onClick={toggleTrackCorridor}
                >
                  {isTrackingCorridor ? <BellRing size={14} /> : <Bell size={14} />}
                  <span>{isTrackingCorridor ? tr("trackingActiveBtn") : tr("trackPricesBtn")}</span>
                </button>
              </div>
            </div>
            {filteredOffers.length === 0 ? (
              <div className="card card-body" style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Plane size={20} style={{ color: "var(--primary)" }} />
                  <strong>{fOrigin} → {fDest}</strong>
                </div>
                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.88rem" }}>{tr("flightDisclaimer")}</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setFullCalendarOpen(true)}
                  >
                    <CalendarDays size={15} /> {lang === "ar" ? "عرض التقويم الكامل" : lang === "fr" ? "Voir le calendrier" : "Open Full Calendar"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setSelectedOfferCode(null);
                      setConfirmedFlight(null);
                      setStep(3);
                    }}
                  >
                    <Plane size={15} /> {tr("requestFlightBtn")}
                  </button>
                  {airlineFilter !== "all" && (
                    <button type="button" className="btn btn-outline" onClick={() => setAirlineFilter("all")}>
                      {tr("allAirlinesFilter")}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              filteredOffers.map((offer) => {
                const airline = AIRLINES[offer.airlineCode];
                const isSelected = activeOffer?.offerCode === offer.offerCode;
                const isExpanded = expandedCode === offer.offerCode;
                const totalFare = computeOfferTotal(offer);
                const isCheapest = offer.offerCode === cheapestCode;
                const isFastest = offer.offerCode === fastestCode;
                const highlightTag = isCheapest
                  ? { label: tr("bestPriceBadge"), cls: "badge-success", icon: Tag }
                  : isFastest
                  ? { label: tr("fastestBadge"), cls: "badge-primary", icon: Zap }
                  : null;

                return (
                  <article
                    key={offer.offerCode}
                    className={`marhaba-pass-card ${isSelected ? "selected" : ""} ${fCabin === "business" ? "marhaba-pass-card-lux" : ""}`}
                    style={{ borderInlineStart: `4px solid ${fCabin === "business" ? "#d97706" : airline.accentHex}` }}
                    onClick={() => setSelectedOfferCode(offer.offerCode)}
                  >
                    <div className="marhaba-pass-body">
                      {/* Top Airline Logo + Flight No + Aircraft + Photo */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                          <AirlineLogoBadge code={offer.airlineCode} size={36} />
                          <div>
                            <div style={{ fontWeight: 800, fontSize: "0.94rem", color: "var(--text)", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                              <span>{airline.name}</span>
                              <span className="badge badge-muted" style={{ fontSize: "0.72rem" }} dir="ltr">{offer.flightNumber}</span>
                            </div>
                            <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>{offer.aircraft}</div>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {fCabin === "business" && (
                            <span className="badge badge-lux" style={{ gap: 4, fontSize: "0.72rem" }}>
                              <Crown size={11} /> {tr("businessLabel")}
                            </span>
                          )}
                          {highlightTag && (
                            <span className={`badge ${highlightTag.cls}`} style={{ gap: 4, fontSize: "0.72rem" }}>
                              <highlightTag.icon size={11} /> {highlightTag.label}
                            </span>
                          )}
                          {offer.seatsLeft <= 6 && (
                            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--warning)" }}>
                              {offer.seatsLeft} {tr("seatsLeftLabel")}
                            </span>
                          )}
                          <div className="flight-card-dest-thumb">
                            <TraceImage src={offer.image} alt={offer.destinationCity} label={offer.destinationCode} className="prop-img" />
                          </div>
                        </div>
                      </div>

                      {/* Flight Timeline */}
                      <div dir="ltr" className="bus-ticket-times">
                        <div style={{ minWidth: 0 }}>
                          <div className="bus-time-val">{offer.depTime}</div>
                          <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "var(--text)" }}>
                            {offer.originCode} · {tCity(lang, offer.originCity)}
                          </div>
                          <div style={{ fontSize: "0.73rem", color: "var(--text-muted)" }}>
                            {offer.originAirport} ({offer.originTerminal})
                          </div>
                        </div>

                        <div className="bus-duration-col">
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span className="bus-dash-line" />
                            <Plane size={14} style={{ color: airline.accentHex, flexShrink: 0 }} />
                            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--primary)", whiteSpace: "nowrap" }}>
                              {formatDuration(offer.durationMins)}
                            </span>
                            <span className="bus-dash-line" />
                          </div>
                          <div style={{ fontSize: "0.72rem", color: offer.stops === 0 ? "var(--success)" : "var(--warning)", fontWeight: 600, marginTop: 3 }}>
                            {offer.stops === 0 ? tr("directTripLabel") : `${tr("viaHubLabel")} ${offer.viaCode}`}
                          </div>
                        </div>

                        <div style={{ textAlign: "end", minWidth: 0 }}>
                          <div className="bus-time-val">{offer.arrTime}</div>
                          <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "var(--text)" }}>
                            {offer.destinationCode} · {tCity(lang, offer.destinationCity)}
                          </div>
                          <div style={{ fontSize: "0.73rem", color: "var(--text-muted)" }}>
                            {offer.destinationAirport} ({offer.destinationTerminal})
                          </div>
                        </div>
                      </div>

                      {tripType === "round_trip" && (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 8,
                            padding: "6px 10px",
                            borderRadius: 10,
                            background: "var(--surface-muted)",
                            fontSize: "0.76rem",
                          }}
                        >
                          <span style={{ fontWeight: 700, color: "var(--text)" }}>
                            {tr("returnFlightLabel")} ({fRet}):{" "}
                            <span dir="ltr">
                              {offer.destinationCode} → {offer.originCode}
                            </span>
                          </span>
                          <span style={{ color: "var(--text-muted)" }} dir="ltr">
                            {formatDuration(offer.durationMins)} · {offer.stops === 0 ? tr("directTripLabel") : `${tr("viaHubLabel")} ${offer.viaCode}`}
                          </span>
                        </div>
                      )}

                      {/* Baggage + Amenities + Expandable Details */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, paddingTop: 6, borderTop: "1px solid var(--border)" }}>
                        <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--text)", fontWeight: 600 }}>
                            <Luggage size={13} style={{ color: "var(--primary)" }} /> {offer.baggageIncluded}
                          </span>
                          <span>· {offer.amenities.slice(0, 2).join(" · ")}</span>
                          <span style={{ color: "var(--success)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 3 }}>
                            · <Leaf size={11} /> {offer.co2Kg} kg CO₂
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedCode(isExpanded ? null : offer.offerCode);
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
                          }}
                        >
                          <span>{tr("flightDetailsToggle")}</span>
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                      </div>

                      {isExpanded && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            padding: 12,
                            borderRadius: 12,
                            background: "var(--surface-muted)",
                            display: "grid",
                            gap: 8,
                            fontSize: "0.82rem",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                            <span><strong>{airline.name}:</strong> {airline.baggageNote}</span>
                            <span className={`badge ${fCabin === "business" ? "badge-lux" : "badge-muted"}`} style={{ gap: 4 }}>
                              {fCabin === "business" && <Crown size={11} />}
                              {fCabin === "business" ? tr("businessLabel") : tr("economyLabel")}
                            </span>
                          </div>
                          {offer.stops === 1 && offer.viaCity && (
                            <div style={{ color: "var(--warning)", fontWeight: 600 }}>
                              {tr("viaHubLabel")} {offer.viaCity} ({offer.viaCode}) · {offer.layoverMins} min layover
                            </div>
                          )}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                            <span style={{ color: "var(--text-muted)" }}>
                              <MapPin size={12} /> {AIRPORTS_CATALOG.find((a) => a.code === offer.destinationCode)?.transferNote}
                            </span>
                            <Link
                              href={`/search?city=${encodeURIComponent(offer.destinationCity)}&type=car`}
                              className="btn btn-sm btn-outline"
                            >
                              <CarFront size={12} /> {tr("cars")} · {tCity(lang, offer.destinationCity)}
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Fare & CTA Stub */}
                    <div className="marhaba-pass-stub">
                      <div>
                        <div dir="ltr" style={{ fontSize: "1.32rem", fontWeight: 900, color: "var(--primary)", lineHeight: 1.1 }}>
                          {money(totalFare)}
                        </div>
                        <div style={{ fontSize: "0.73rem", color: "var(--text-muted)", marginTop: 3 }}>
                          {tripType === "round_trip" ? tr("roundTripLabel") : tr("oneWayLabel")} · {totalPax} pax
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOfferCode(offer.offerCode);
                          setConfirmedFlight(null);
                          setCheckoutError("");
                          setStep(3);
                        }}
                      >
                        {tr("selectFlightBtn")}
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          {flightHistory.length > 0 && (
            <aside style={{ display: "grid", gap: 14, minWidth: 0 }}>
              <div className="card card-body" style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontSize: "0.95rem" }}>{tr("yourFlightRequests")}</strong>
                  <span className="badge badge-muted" dir="ltr">{flightHistory.length}</span>
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {flightHistory.slice(0, 4).map((item) => (
                    <div key={String(item.id)} style={{ padding: 10, borderRadius: 10, border: "1px solid var(--border)", fontSize: "0.82rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <strong dir="ltr">{String(item.request_ref)}</strong>
                        <span className="badge badge-primary" style={{ fontSize: "0.7rem" }}>{String(item.status)}</span>
                      </div>
                      <div style={{ fontWeight: 600, marginTop: 3 }}>
                        {String(item.origin)} → {String(item.destination)}
                      </div>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: 2 }} dir="ltr">
                        {String(item.departure_date)} · {String(item.cabin_class)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          )}
        </div>
      ) : (
        /* Step 3: Clean Flight Checkout & Printable Confirmation Pass */
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <button type="button" className="btn btn-sm btn-outline" onClick={() => setStep(2)}>
              <ArrowLeft size={14} /> {tr("backBtn")}
            </button>
            <BrandLogo size="sm" showArabic={false} />
          </div>

          {confirmedFlight ? (
            <div className="card card-body" style={{ display: "grid", gap: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <span className="badge badge-success" style={{ gap: 5 }}>
                    <CheckCircle2 size={14} /> {confirmedFlight.requestRef}
                  </span>
                  <h2 style={{ margin: "8px 0 4px" }}>{tr("flightCheckoutTitle")}</h2>
                  <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.88rem" }}>{confirmedFlight.note}</p>
                </div>
                <div style={{ textAlign: "end" }}>
                  <div style={{ fontSize: "1.45rem", fontWeight: 900, color: "var(--primary)" }} dir="ltr">
                    {money(confirmedFlight.totalMad)}
                  </div>
                  <button type="button" className="btn btn-sm btn-outline no-print" style={{ marginTop: 6 }} onClick={() => window.print()}>
                    <Printer size={13} /> {tr("printPlanBtn")}
                  </button>
                </div>
              </div>

              {confirmedFlight.offer && (
                <div style={{ padding: 14, borderRadius: 12, background: "var(--surface-muted)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <AirlineLogoBadge code={confirmedFlight.offer.airlineCode} size={38} />
                    <div>
                      <strong>{AIRLINES[confirmedFlight.offer.airlineCode].name} · {confirmedFlight.offer.flightNumber}</strong>
                      <div style={{ fontSize: "0.84rem", color: "var(--text-muted)" }}>
                        {confirmedFlight.offer.originCode} ({confirmedFlight.offer.depTime}) → {confirmedFlight.offer.destinationCode} ({confirmedFlight.offer.arrTime}) · {fDep}
                      </div>
                    </div>
                  </div>
                  <QrCode size={42} style={{ color: "var(--primary)" }} />
                </div>
              )}

              {confirmedFlight.arrivalCars.length > 0 && (
                <div style={{ display: "grid", gap: 8 }}>
                  <strong>{tr("cars")} · {confirmedFlight.offer?.destinationCity || fDest}</strong>
                  <div className="grid-3">
                    {confirmedFlight.arrivalCars.map((c) => (
                      <Link key={c.id} href={`/properties/${c.slug}`} className="card card-body" style={{ padding: 12 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{c.title}</div>
                        <div style={{ color: "var(--primary)", fontWeight: 800, marginTop: 4 }} dir="ltr">{money(c.base_price_mad)}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleCheckoutSubmit} className="bus-checkout-grid">
              <div style={{ display: "grid", gap: 14 }}>
                {activeOffer && (
                  <div className="card card-body" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <AirlineLogoBadge code={activeOffer.airlineCode} size={38} />
                      <div>
                        <strong>{AIRLINES[activeOffer.airlineCode].name} · {activeOffer.flightNumber}</strong>
                        <div style={{ fontSize: "0.84rem", color: "var(--text-muted)" }}>
                          {activeOffer.originCode} {activeOffer.depTime} → {activeOffer.destinationCode} {activeOffer.arrTime} · {fDep}
                        </div>
                      </div>
                    </div>
                    <strong style={{ fontSize: "1.2rem", color: "var(--primary)" }} dir="ltr">
                      {money(computeOfferTotal(activeOffer))}
                    </strong>
                  </div>
                )}

                <div className="card card-body" style={{ display: "grid", gap: 12 }}>
                  <h3 style={{ margin: 0 }}>{tr("flightCheckoutTitle")}</h3>
                  <div className="grid-2">
                    <div>
                      <label className="field-label">{tr("busFirstName")}</label>
                      <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                    </div>
                    <div>
                      <label className="field-label">{tr("busLastName")}</label>
                      <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                    </div>
                  </div>
                  <div className="grid-2">
                    <div>
                      <label className="field-label">{tr("busWhatsappNum")}</label>
                      <input className="input" placeholder="+212 6..." value={fPhone} onChange={(e) => setFPhone(e.target.value)} required />
                    </div>
                    <div>
                      <label className="field-label">{tr("emailLabel")}</label>
                      <input type="email" className="input" value={fEmail} onChange={(e) => setFEmail(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.88rem" }}>
                      <input type="checkbox" checked={fBaggage} onChange={(e) => setFBaggage(e.target.checked)} />
                      <span>{tr("checkedBagLabel")}</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.88rem" }}>
                      <input type="checkbox" checked={fFlex} onChange={(e) => setFFlex(e.target.checked)} />
                      <span>{tr("flexDatesLabel")}</span>
                    </label>
                  </div>
                </div>

                <div className="card card-body" style={{ display: "grid", gap: 12 }}>
                  <strong>{tr("busPayStep")}</strong>
                  <div style={{ display: "grid", gap: 8 }}>
                    {[
                      { id: "card" as const, label: tr("payBankCard") },
                      { id: "bank_app" as const, label: tr("payBankApp") },
                      { id: "cash_network" as const, label: tr("payCashNetworks") },
                      { id: "chaabi_tasshilat" as const, label: tr("payChaabiTasshilat") },
                    ].map((pm) => (
                      <label
                        key={pm.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 12px",
                          borderRadius: 10,
                          border: `1.5px solid ${paymentMethod === pm.id ? "var(--primary)" : "var(--border)"}`,
                          background: paymentMethod === pm.id ? "var(--primary-light)" : "var(--surface)",
                          cursor: "pointer",
                          fontSize: "0.86rem",
                          fontWeight: 600,
                        }}
                      >
                        <input
                          type="radio"
                          name="flightPayMethod"
                          checked={paymentMethod === pm.id}
                          onChange={() => setPaymentMethod(pm.id)}
                        />
                        <span>{pm.label}</span>
                      </label>
                    ))}
                  </div>
                  <MoroccanPaymentBadges compact />
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.84rem" }}>
                    <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
                    <span>{tr("busCndpConsent")}</span>
                  </label>
                  {checkoutError && <div className="badge badge-danger">{checkoutError}</div>}
                </div>
              </div>

              <aside className="card card-body" style={{ display: "grid", gap: 12, alignSelf: "start" }}>
                <strong>{tr("estimatedTotalLabel")}</strong>
                <div style={{ display: "flex", gap: 6 }}>
                  <input className="input" placeholder="MARHABA10 / SAHARA15" value={promoInput} onChange={(e) => setPromoInput(e.target.value)} />
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => setAppliedPromo(promoInput.trim().toUpperCase())}
                  >
                    {tr("applyBtn")}
                  </button>
                </div>
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, display: "grid", gap: 6, fontSize: "0.88rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{totalPax} pax · {fCabin}</span>
                    <strong dir="ltr">{money(activeOffer ? computeOfferTotal(activeOffer) : 1450 * totalPax)}</strong>
                  </div>
                  {appliedPromo && (
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--success)" }}>
                      <span>Promo ({appliedPromo})</span>
                      <strong>-{appliedPromo === "SAHARA15" ? "15%" : appliedPromo === "MARHABA10" ? "10%" : "0%"}</strong>
                    </div>
                  )}
                  <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: 6 }}>
                    <Lock size={15} />
                    <span>{submitting ? tr("submittingLabel") : tr("requestFlightBtn")}</span>
                  </button>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
                    <Info size={13} /> {tr("flightDisclaimer")}
                  </div>
                </div>
              </aside>
            </form>
          )}
        </div>
      )}

      {/* All 13 Partner Airlines Directory Modal */}
      {allAirlinesOpen && (
        <div className="modal-backdrop" onClick={() => setAllAirlinesOpen(false)} role="dialog" aria-modal="true" aria-label={tr("allAirlinesFilter")}>
          <div className="modal-panel" style={{ maxWidth: 680, maxHeight: "86vh", overflowY: "auto", padding: "20px", display: "grid", gap: 14 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.08rem", fontWeight: 900 }}>{tr("allAirlinesFilter")} · Morocco Sky Network (13)</h3>
                <p style={{ margin: "3px 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Official domestic, European, Atlantic, and global carriers serving Moroccan airports.
                </p>
              </div>
              <button type="button" className="btn btn-sm btn-outline" onClick={() => setAllAirlinesOpen(false)} aria-label={tr("closeBtn")}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
              {(Object.keys(AIRLINES) as AirlineCode[]).map((code) => {
                const al = AIRLINES[code];
                const qr = AIRLINE_QUICK_ROUTE[code];
                return (
                  <div
                    key={code}
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      padding: 12,
                      display: "grid",
                      gap: 8,
                      background: "var(--surface)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <AirlineLogoBadge code={code} size={28} />
                      <span className="badge badge-neutral" style={{ fontSize: "0.68rem" }}>{code}</span>
                    </div>
                    <div>
                      <strong style={{ fontSize: "0.9rem" }}>{al.name}</strong>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{al.hub}</div>
                    </div>
                    <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>{al.baggageNote}</div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      style={{ justifyContent: "space-between", width: "100%" }}
                      onClick={() => {
                        setFOrigin(qr.origin);
                        setFDest(qr.dest);
                        setAirlineFilter(code);
                        setSelectedOfferCode(null);
                        setAllAirlinesOpen(false);
                      }}
                    >
                      <span>{qr.origin.match(/\(([A-Z]{3})\)/)?.[1]} → {qr.dest.match(/\(([A-Z]{3})\)/)?.[1]}</span>
                      <span>→</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
