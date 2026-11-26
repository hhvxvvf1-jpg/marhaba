"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  BedDouble,
  Calendar,
  Car,
  Check,
  CheckCircle2,
  Compass,
  Copy,
  Luggage,
  MapPin,
  Minus,
  Moon,
  Plane,
  Plus,
  Printer,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Train,
  Utensils,
  Wifi,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { BrandLogo } from "@/components/BrandLogo";
import { BrandSelect } from "@/components/BrandSelect";
import { BrandDateRangePicker } from "@/components/BrandDateRangePicker";
import { TraceImage } from "@/components/TraceImage";
import { getFirstImage } from "@/components/PropertyCard";
import { MOROCCO_CITIES } from "@/lib/morocco-cities";
import { tCategory, tCity, tRegion } from "@/lib/i18n";

interface PlannerItem {
  id: number;
  slug: string;
  title: string;
  title_fr?: string | null;
  title_ar?: string | null;
  city: string;
  marketplace_type: string;
  base_price_mad: number;
  unit_type?: string;
  rating_avg?: number;
  images_json?: string;
  partner_name: string;
  estimatedMad?: number;
}

interface DailyItemRef {
  id: number;
  slug: string;
  title: string;
  title_fr?: string | null;
  title_ar?: string | null;
  estimatedMad?: number;
}

interface PlanResult {
  planRef: string;
  status: string;
  city: string;
  days: number;
  travelers: number;
  budgetMad: number;
  pace?: "relaxed" | "balanced" | "explorer";
  dates?: { startDate: string; endDate: string };
  estimatedTotalMad: number;
  breakdown?: { stayMad: number; carMad: number; expMad: number; diningMad: number };
  overBudget: boolean;
  budgetDifferenceMad: number;
  pricingDisclaimer: string;
  cheaperAlternative?: { id: number; slug: string; title: string; basePriceMad: number; estimatedMad?: number } | null;
  selectedServices: Array<{
    role: string;
    estimatedMad: number;
    item: PlannerItem;
  }>;
  alternatives?: {
    stays: PlannerItem[];
    cars: PlannerItem[];
    experiences: PlannerItem[];
    dining: PlannerItem[];
  };
  dailyPlan: Array<{
    day: number;
    city: string;
    stay: DailyItemRef | null;
    car: DailyItemRef | null;
    experience: DailyItemRef | null;
    dining: DailyItemRef | null;
  }>;
  cityGuide?: {
    bestDistrict: string;
    gettingThere: string;
    mustTryDish: string;
    bestHours: string;
  };
  createdBookings?: Array<{ bookingRef: string; title: string; status: string; totalMad: number }>;
}

const PRESET_TRIPS = [
  { city: "Marrakech", days: 4, travelers: 2, budgetMad: 8500, pace: "balanced" as const, interests: "medina, hammam, gastronomy", includeCar: false },
  { city: "Laâyoune", days: 3, travelers: 2, budgetMad: 6000, pace: "explorer" as const, interests: "desert, oasis, dunes", includeCar: true },
  { city: "Dakhla", days: 5, travelers: 2, budgetMad: 11000, pace: "balanced" as const, interests: "surf, lagoon, seafood", includeCar: true },
  { city: "Fès", days: 4, travelers: 2, budgetMad: 7500, pace: "relaxed" as const, interests: "medina, culture, gastronomy", includeCar: false },
];

const INTEREST_CHIPS = [
  { id: "desert", keyword: "desert", labelKey: "interestDesert", icon: Sun },
  { id: "surf", keyword: "surf", labelKey: "interestSurf", icon: Compass },
  { id: "culture", keyword: "medina", labelKey: "interestCulture", icon: Sparkles },
  { id: "food", keyword: "gastronomy", labelKey: "interestFood", icon: Utensils },
  { id: "atlas", keyword: "atlas", labelKey: "interestAtlas", icon: MapPin },
  { id: "wellness", keyword: "hammam", labelKey: "interestWellness", icon: Moon },
];

const DEFAULT_CHECKLIST = [
  { id: "docs", labelEn: "Passport / National ID & booking references", labelFr: "Passeport / CNI & références de réservation", labelAr: "جواز السفر / البطاقة الوطنية وتأكيدات الحجز" },
  { id: "esim", labelEn: "Activate Morocco 5G eSIM before departure", labelFr: "Activer l’eSIM Maroc 5G avant le départ", labelAr: "تفعيل شريحة eSIM المغرب قبل السفر" },
  { id: "transport", labelEn: "Confirm airport transfer / ONCF or CTM seat", labelFr: "Confirmer transfert aéroport / billet ONCF ou CTM", labelAr: "تأكيد النقل من المطار أو تذكرة القطار/الحافلة" },
  { id: "pack", labelEn: "Layered clothing for cool desert/Atlas nights", labelFr: "Tenue adaptée aux soirées fraîches (désert / Atlas)", labelAr: "ملابس مناسبة للنهار والمساء (الصحراء والأطلس)" },
  { id: "pay", labelEn: "Carry MAD cash for souks + CMI / card ready", labelFr: "Espèces MAD pour les souks + carte bancaire", labelAr: "درهم نقدي للأسواق التقليدية + بطاقة بنكية" },
];

export default function PlannerPage() {
  const { lang, tr, money, user, openAuthModal } = useApp();
  const [city, setCity] = useState("Marrakech");
  const [days, setDays] = useState(4);
  const [travelers, setTravelers] = useState(2);
  const [budgetMad, setBudgetMad] = useState(8500);
  const [pace, setPace] = useState<"relaxed" | "balanced" | "explorer">("balanced");
  const [includeCar, setIncludeCar] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>(["medina", "gastronomy"]);
  const [customNote, setCustomNote] = useState("");
  const [startDate, setStartDate] = useState(() => new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [bookingTrip, setBookingTrip] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<PlanResult | null>(null);
  const [savedPlans, setSavedPlans] = useState<Array<Record<string, unknown>>>([]);
  const [copiedPlan, setCopiedPlan] = useState(false);
  const [swappingRole, setSwappingRole] = useState<string | null>(null);
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});

  const localizedTitle = (item: { title: string; title_fr?: string | null; title_ar?: string | null } | null | undefined) => {
    if (!item) return "";
    if (lang === "ar" && item.title_ar) return item.title_ar;
    if (lang === "fr" && item.title_fr) return item.title_fr;
    return item.title;
  };

  const endDateComputed = useMemo(() => {
    const startMs = new Date(`${startDate}T00:00:00Z`).getTime();
    if (!Number.isFinite(startMs)) return "";
    return new Date(startMs + Math.max(1, days - 1) * 86400_000).toISOString().slice(0, 10);
  }, [startDate, days]);

  const interestsJoined = useMemo(() => {
    return [...selectedTags, customNote.trim()].filter(Boolean).join(", ");
  }, [selectedTags, customNote]);

  useEffect(() => {
    if (!plan) return;
    try {
      const raw = localStorage.getItem(`marhaba_plan_chk_${plan.planRef}`);
      setCheckedTasks(raw ? JSON.parse(raw) : {});
    } catch {
      setCheckedTasks({});
    }
  }, [plan]);

  const toggleChecklistTask = (id: string) => {
    if (!plan) return;
    setCheckedTasks((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(`marhaba_plan_chk_${plan.planRef}`, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  useEffect(() => {
    if (!user) return;
    fetch("/api/v1/planner")
      .then((r) => r.json())
      .then((d) => setSavedPlans(d.itineraries || []))
      .catch(() => {});
  }, [user]);

  const generatePlan = async (
    bookWhole = false,
    override?: {
      city?: string;
      days?: number;
      travelers?: number;
      budgetMad?: number;
      pace?: "relaxed" | "balanced" | "explorer";
      includeCar?: boolean;
      interests?: string;
    }
  ) => {
    if (bookWhole && !user) {
      openAuthModal("login");
      return;
    }
    setError("");
    if (bookWhole) setBookingTrip(true);
    else setLoading(true);

    const selectedItemIds = bookWhole && plan ? plan.selectedServices.map((s) => s.item.id) : undefined;

    try {
      const res = await fetch("/api/v1/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: override?.city ?? city,
          days: override?.days ?? days,
          travelers: override?.travelers ?? travelers,
          budgetMad: override?.budgetMad ?? budgetMad,
          pace: override?.pace ?? pace,
          includeCar: override?.includeCar ?? includeCar,
          interests: override?.interests ?? interestsJoined,
          startDate,
          bookWholePlan: bookWhole,
          selectedItemIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not build trip plan");
      } else {
        setPlan(data);
        setSwappingRole(null);
      }
    } catch {
      setError("Network error while building trip plan.");
    } finally {
      setLoading(false);
      setBookingTrip(false);
    }
  };

  const applyPreset = (preset: (typeof PRESET_TRIPS)[number]) => {
    setCity(preset.city);
    setDays(preset.days);
    setTravelers(preset.travelers);
    setBudgetMad(preset.budgetMad);
    setPace(preset.pace);
    setIncludeCar(preset.includeCar);
    setSelectedTags(preset.interests.split(",").map((s) => s.trim()).filter(Boolean));
    generatePlan(false, {
      city: preset.city,
      days: preset.days,
      travelers: preset.travelers,
      budgetMad: preset.budgetMad,
      pace: preset.pace,
      includeCar: preset.includeCar,
      interests: preset.interests,
    });
  };

  const swapServiceInPlan = (role: string, replacement: PlannerItem) => {
    if (!plan) return;
    const oldEntry = plan.selectedServices.find((s) => s.role === role);
    if (!oldEntry) return;
    const newEst = replacement.estimatedMad ?? replacement.base_price_mad;
    const updatedServices = plan.selectedServices.map((s) =>
      s.role === role ? { ...s, item: replacement, estimatedMad: newEst } : s
    );
    const updatedDaily = plan.dailyPlan.map((d) => {
      if (role === "accommodation") return { ...d, stay: { id: replacement.id, slug: replacement.slug, title: replacement.title, title_fr: replacement.title_fr, title_ar: replacement.title_ar } };
      if (role === "vehicle") return { ...d, car: { id: replacement.id, slug: replacement.slug, title: replacement.title, title_fr: replacement.title_fr, title_ar: replacement.title_ar } };
      if (role === "experience" && d.experience?.id === oldEntry.item.id) {
        return { ...d, experience: { id: replacement.id, slug: replacement.slug, title: replacement.title, title_fr: replacement.title_fr, title_ar: replacement.title_ar, estimatedMad: newEst } };
      }
      if (role === "dining" && d.dining?.id === oldEntry.item.id) {
        return { ...d, dining: { id: replacement.id, slug: replacement.slug, title: replacement.title, title_fr: replacement.title_fr, title_ar: replacement.title_ar, estimatedMad: newEst } };
      }
      return d;
    });
    const newTotal = updatedServices.reduce((acc, s) => acc + s.estimatedMad, 0);
    setPlan({
      ...plan,
      selectedServices: updatedServices,
      dailyPlan: updatedDaily,
      estimatedTotalMad: newTotal,
      overBudget: newTotal > plan.budgetMad,
      budgetDifferenceMad: plan.budgetMad - newTotal,
    });
    setSwappingRole(null);
  };

  const copyPlanSummary = () => {
    if (!plan) return;
    const lines = [
      `MARHABA A-to-Z Trip Plan (${plan.planRef}) — ${plan.days} ${tr("dayLabel")} · ${tCity(lang, plan.city)} (${plan.travelers} ${tr("travelersCount")})`,
      `${tr("estimatedTotalLabel")}: ${money(plan.estimatedTotalMad)} (${tr("targetBudgetLabel")}: ${money(plan.budgetMad)})`,
      "",
      ...plan.dailyPlan.map(
        (d) =>
          `${tr("dayLabel")} ${d.day} (${tCity(lang, d.city)}): ${tr("stayLabel")}=${localizedTitle(d.stay) || "—"} | ${tr("activityLabel")}=${localizedTitle(d.experience) || "—"} | ${tr("dining")}=${localizedTitle(d.dining) || "—"}`
      ),
    ].join("\n");
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(lines).catch(() => {});
    }
    setCopiedPlan(true);
    setTimeout(() => setCopiedPlan(false), 2000);
  };

  const toggleTag = (keyword: string) => {
    setSelectedTags((prev) => (prev.includes(keyword) ? prev.filter((k) => k !== keyword) : [...prev, keyword]));
  };

  const budgetProgressPct = plan ? Math.min(100, Math.round((plan.estimatedTotalMad / Math.max(1, plan.budgetMad)) * 100)) : 0;

  return (
    <div className="container" style={{ paddingTop: 22, paddingBottom: 56 }}>
      {/* Clean Guided Header + Quick-Start Trip Vibes */}
      <div className="card card-body brand-zellige" style={{ marginBottom: 18, display: "grid", gap: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
          <div style={{ maxWidth: 680 }}>
            <span className="badge badge-gold">
              <Sparkles size={12} /> {tr("nav.planner")}
            </span>
            <h1 style={{ margin: "8px 0 4px", fontSize: "clamp(1.35rem, 2.4vw, 1.85rem)", fontWeight: 800 }}>{tr("plannerTitle")}</h1>
            <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.94rem" }}>{tr("plannerSubtitle")}</p>
          </div>
          <BrandLogo size="md" showArabic={false} />
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {PRESET_TRIPS.map((preset) => {
            const active = city === preset.city && days === preset.days && budgetMad === preset.budgetMad;
            return (
              <button
                key={preset.city}
                type="button"
                className={`btn btn-sm ${active ? "btn-primary" : "btn-outline"}`}
                style={{ borderRadius: 999, gap: 6 }}
                onClick={() => applyPreset(preset)}
              >
                <Sparkles size={13} />
                <span>{tCity(lang, preset.city)} · {preset.days} {tr("dayLabel")}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 2-Column A-to-Z Planner Workspace */}
      <div className="planner-layout">
        {/* Left Guided Builder */}
        <aside className="card card-body planner-builder" style={{ display: "grid", gap: 14, alignSelf: "start" }}>
          <div>
            <label className="field-label">{tr("destinationCity")}</label>
            <BrandSelect
              value={city}
              ariaLabel={tr("destinationCity")}
              onChange={setCity}
              options={[
                { value: "all", label: tr("allMoroccanCities") },
                ...MOROCCO_CITIES.map((c) => ({
                  value: c.name,
                  label: `${tCity(lang, c.name)} (${tRegion(lang, c.region).split("-")[0].trim()})`,
                })),
              ]}
            />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <label className="field-label" style={{ margin: 0 }}>{tr("startDateLabel")}</label>
              {endDateComputed && (
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }} dir="ltr">
                  → {endDateComputed}
                </span>
              )}
            </div>
            <BrandDateRangePicker mode="single" startDate={startDate} onChangeStart={setStartDate} startLabel="" />
          </div>

          {/* Clean Steppers for Days & Travelers */}
          <div className="grid-2" style={{ gap: 10 }}>
            <div className="counter-box" style={{ flexDirection: "column", alignItems: "stretch", gap: 6, padding: "10px 12px" }}>
              <span className="field-label" style={{ margin: 0 }}>{tr("tripDays")}</span>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button type="button" className="counter-btn" onClick={() => setDays((d) => Math.max(1, d - 1))} aria-label="Decrease days">
                  <Minus size={13} />
                </button>
                <strong style={{ fontSize: "1.05rem", fontVariantNumeric: "tabular-nums" }} dir="ltr">{days}</strong>
                <button type="button" className="counter-btn" onClick={() => setDays((d) => Math.min(14, d + 1))} aria-label="Increase days">
                  <Plus size={13} />
                </button>
              </div>
            </div>

            <div className="counter-box" style={{ flexDirection: "column", alignItems: "stretch", gap: 6, padding: "10px 12px" }}>
              <span className="field-label" style={{ margin: 0 }}>{tr("travelersCount")}</span>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button type="button" className="counter-btn" onClick={() => setTravelers((t) => Math.max(1, t - 1))} aria-label="Decrease travelers">
                  <Minus size={13} />
                </button>
                <strong style={{ fontSize: "1.05rem", fontVariantNumeric: "tabular-nums" }} dir="ltr">{travelers}</strong>
                <button type="button" className="counter-btn" onClick={() => setTravelers((t) => Math.min(12, t + 1))} aria-label="Increase travelers">
                  <Plus size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Budget Slider + Quick Tiers */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label className="field-label" style={{ margin: 0 }}>{tr("budgetLabel")}</label>
              <strong style={{ color: "var(--primary)", fontSize: "0.95rem" }} dir="ltr">{money(budgetMad)}</strong>
            </div>
            <input
              type="range"
              min={1000}
              max={35000}
              step={500}
              value={Math.min(35000, Math.max(1000, budgetMad))}
              onChange={(e) => setBudgetMad(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--primary)", cursor: "pointer" }}
              aria-label={tr("budgetLabel")}
            />
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              {[
                { label: tr("budgetFilter"), val: 4500 },
                { label: tr("paceBalanced"), val: 9000 },
                { label: tr("luxuryFilter"), val: 18000 },
              ].map((tier) => (
                <button
                  key={tier.label}
                  type="button"
                  className={`btn btn-sm ${Math.abs(budgetMad - tier.val) < 800 ? "btn-primary" : "btn-outline"}`}
                  style={{ flex: 1, fontSize: "0.75rem", borderRadius: 999 }}
                  onClick={() => setBudgetMad(tier.val)}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </div>

          {/* Travel Pace */}
          <div>
            <label className="field-label">{tr("paceLabel")}</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
              {(
                [
                  { id: "relaxed", label: tr("paceRelaxed") },
                  { id: "balanced", label: tr("paceBalanced") },
                  { id: "explorer", label: tr("paceExplorer") },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`btn btn-sm ${pace === p.id ? "btn-primary" : "btn-outline"}`}
                  style={{ borderRadius: 10, fontSize: "0.78rem" }}
                  onClick={() => setPace(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Interest Chips */}
          <div>
            <label className="field-label">{tr("interestsLabel")}</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              {INTEREST_CHIPS.map((chip) => {
                const Icon = chip.icon;
                const active = selectedTags.includes(chip.keyword);
                return (
                  <button
                    key={chip.id}
                    type="button"
                    className={`btn btn-sm ${active ? "btn-primary" : "btn-outline"}`}
                    style={{ borderRadius: 999, gap: 5, fontSize: "0.76rem" }}
                    onClick={() => toggleTag(chip.keyword)}
                  >
                    <Icon size={12} />
                    <span>{tr(chip.labelKey)}</span>
                  </button>
                );
              })}
            </div>
            <input
              className="input"
              placeholder="desert, surf, riad, rooftop..."
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
            />
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.88rem", fontWeight: 600, cursor: "pointer" }}>
            <input type="checkbox" checked={includeCar} onChange={(e) => setIncludeCar(e.target.checked)} />
            <Car size={15} style={{ color: "var(--primary)" }} />
            <span>{tr("includeRentalCar")}</span>
          </label>

          <button type="button" className="btn btn-primary" style={{ height: 46 }} disabled={loading} onClick={() => generatePlan(false)}>
            <Sparkles size={16} />
            <span>{loading ? tr("generatingPlan") : tr("generatePlanBtn")}</span>
          </button>

          {error && <div className="badge badge-danger">{error}</div>}
        </aside>

        {/* Right Workspace: Guided Onboarding OR Complete A-to-Z Itinerary */}
        <div style={{ display: "grid", gap: 18, minWidth: 0 }}>
          {!plan ? (
            <div className="card card-body" style={{ display: "grid", gap: 20, padding: 28 }}>
              <div style={{ textAlign: "center", maxWidth: 520, margin: "0 auto" }}>
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 16,
                    background: "var(--primary-light)",
                    color: "var(--primary)",
                    display: "grid",
                    placeItems: "center",
                    margin: "0 auto 12px",
                  }}
                >
                  <Calendar size={26} />
                </div>
                <h2 style={{ margin: "0 0 6px", fontSize: "1.3rem" }}>{tr("plannerReadyTitle")}</h2>
                <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.92rem" }}>{tr("plannerReadySub")}</p>
              </div>

              <div className="planner-steps-grid">
                {[
                  { icon: MapPin, title: tr("step1Title"), desc: tCity(lang, city) },
                  { icon: BedDouble, title: tr("step2Title"), desc: `${tr("stays")} · ${tr("cars")}` },
                  { icon: Compass, title: tr("step3Title"), desc: `${days} ${tr("dayLabel")} · ${tr("experiences")}` },
                  { icon: ShieldCheck, title: tr("step4Title"), desc: `${tr("transport")} · ${tr("esim")}` },
                ].map((st) => {
                  const Icon = st.icon;
                  return (
                    <div
                      key={st.title}
                      style={{
                        padding: 14,
                        borderRadius: 14,
                        border: "1px solid var(--border)",
                        background: "var(--surface-muted)",
                        display: "grid",
                        gap: 6,
                      }}
                    >
                      <span style={{ color: "var(--primary)" }}><Icon size={18} /></span>
                      <strong style={{ fontSize: "0.88rem" }}>{st.title}</strong>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{st.desc}</span>
                    </div>
                  );
                })}
              </div>

              <div style={{ textAlign: "center" }}>
                <button type="button" className="btn btn-primary" disabled={loading} onClick={() => generatePlan(false)}>
                  <Sparkles size={15} />
                  <span>{loading ? tr("generatingPlan") : tr("generatePlanBtn")}</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 1. Trip Header, Budget Progress & One-Click Booking */}
              <div className="card card-body" style={{ display: "grid", gap: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <span className="badge badge-primary">{plan.planRef}</span>
                      {plan.dates && (
                        <span className="badge badge-muted" dir="ltr">
                          {plan.dates.startDate} → {plan.dates.endDate}
                        </span>
                      )}
                    </div>
                    <h2 style={{ margin: "8px 0 4px", fontSize: "1.38rem" }}>
                      {plan.days} {tr("dayLabel")} · {tCity(lang, plan.city)} ({plan.travelers} {tr("travelersCount")})
                    </h2>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", margin: 0 }}>{plan.pricingDisclaimer}</p>
                  </div>

                  <div style={{ textAlign: "end" }}>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{tr("estimatedTotalLabel")}</div>
                    <div style={{ fontSize: "1.65rem", fontWeight: 900, color: plan.overBudget ? "var(--danger)" : "var(--success)" }} dir="ltr">
                      {money(plan.estimatedTotalMad)}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }} dir="ltr">
                      {tr("targetBudgetLabel")}: {money(plan.budgetMad)}
                    </div>
                  </div>
                </div>

                {/* Visual Budget Progress Bar & Cost Breakdown */}
                <div>
                  <div style={{ height: 8, borderRadius: 999, background: "var(--surface-muted)", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${budgetProgressPct}%`,
                        height: "100%",
                        background: plan.overBudget ? "var(--danger)" : "var(--success)",
                        borderRadius: 999,
                        transition: "width 0.25s ease",
                      }}
                    />
                  </div>
                  {plan.breakdown && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                      {plan.breakdown.stayMad > 0 && (
                        <span className="badge badge-muted"><BedDouble size={12} /> {tr("stayLabel")}: {money(plan.breakdown.stayMad)}</span>
                      )}
                      {plan.breakdown.carMad > 0 && (
                        <span className="badge badge-muted"><Car size={12} /> {tr("cars")}: {money(plan.breakdown.carMad)}</span>
                      )}
                      {plan.breakdown.expMad > 0 && (
                        <span className="badge badge-muted"><Compass size={12} /> {tr("experiences")}: {money(plan.breakdown.expMad)}</span>
                      )}
                      {plan.breakdown.diningMad > 0 && (
                        <span className="badge badge-muted"><Utensils size={12} /> {tr("dining")}: {money(plan.breakdown.diningMad)}</span>
                      )}
                    </div>
                  )}
                </div>

                {plan.overBudget && (
                  <div
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      background: "var(--warning-bg)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 10,
                    }}
                  >
                    <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: "0.86rem" }}>
                      <AlertCircle size={17} />
                      <span>
                        +{money(Math.abs(plan.budgetDifferenceMad))}
                        {plan.cheaperAlternative ? ` · ${plan.cheaperAlternative.title} (${money(plan.cheaperAlternative.basePriceMad)})` : ""}
                      </span>
                    </div>
                    {plan.alternatives?.stays && plan.alternatives.stays.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => {
                          const cheapest = [...plan.alternatives!.stays].sort((a, b) => (a.estimatedMad ?? 0) - (b.estimatedMad ?? 0))[0];
                          if (cheapest) swapServiceInPlan("accommodation", cheapest);
                        }}
                      >
                        <RefreshCw size={13} /> {tr("applyCheaperBtn")}
                      </button>
                    )}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <button type="button" className="btn btn-gold" disabled={bookingTrip} onClick={() => generatePlan(true)}>
                    <CheckCircle2 size={16} />
                    <span>{bookingTrip ? tr("creatingHoldsBtn") : tr("submitWholeTripBtn")}</span>
                  </button>
                  <button type="button" className="btn btn-sm btn-outline" onClick={copyPlanSummary}>
                    {copiedPlan ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedPlan ? tr("copiedLabel") : tr("copyItineraryBtn")}</span>
                  </button>
                  <button type="button" className="btn btn-sm btn-outline no-print" onClick={() => window.print()}>
                    <Printer size={14} /> {tr("printPlanBtn")}
                  </button>
                </div>

                {plan.createdBookings && plan.createdBookings.length > 0 && (
                  <div style={{ padding: 14, borderRadius: 12, background: "var(--success-bg)" }}>
                    <strong style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <CheckCircle2 size={16} /> {plan.createdBookings.length} {tr("partnerReservations")}
                    </strong>
                    <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                      {plan.createdBookings.map((b) => (
                        <div key={b.bookingRef} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
                          <span>{b.bookingRef} · {b.title}</span>
                          <strong>{money(b.totalMad)} ({b.status})</strong>
                        </div>
                      ))}
                    </div>
                    <Link href="/account" className="btn btn-sm btn-primary" style={{ marginTop: 10 }}>
                      {tr("manageInAccountBtn")}
                    </Link>
                  </div>
                )}
              </div>

              {/* 2. Included Services Strip with Photos & Live Swap */}
              {plan.selectedServices.length > 0 && (
                <div className="card card-body" style={{ display: "grid", gap: 12 }}>
                  <h3 style={{ margin: 0, fontSize: "1.05rem" }}>{tr("tripServicesTitle")}</h3>
                  <div className="planner-pkg-grid">
                    {plan.selectedServices.map((svc) => {
                      const alts =
                        svc.role === "accommodation"
                          ? plan.alternatives?.stays
                          : svc.role === "vehicle"
                          ? plan.alternatives?.cars
                          : svc.role === "experience"
                          ? plan.alternatives?.experiences
                          : plan.alternatives?.dining;
                      const otherAlts = (alts || []).filter((a) => a.id !== svc.item.id);
                      const img = svc.item.images_json ? getFirstImage(svc.item.images_json) : "/images/cities/marrakech.jpg";
                      return (
                        <div key={`${svc.role}-${svc.item.id}`} className="card" style={{ overflow: "hidden", border: "1px solid var(--border)" }}>
                          <div style={{ position: "relative", aspectRatio: "16/10" }}>
                            <TraceImage src={img} alt={localizedTitle(svc.item)} label={localizedTitle(svc.item)} className="prop-img" />
                            <span className="badge" style={{ position: "absolute", top: 8, insetInlineStart: 8, background: "rgba(17,26,53,0.82)", color: "#fff" }}>
                              {tCategory(lang, svc.item.marketplace_type)}
                            </span>
                          </div>
                          <div className="card-body" style={{ padding: 12, display: "grid", gap: 6 }}>
                            <Link href={`/properties/${svc.item.slug}`} style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text)" }}>
                              {localizedTitle(svc.item)}
                            </Link>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                              <span>{tCity(lang, svc.item.city)}</span>
                              {svc.item.rating_avg ? (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontWeight: 700, color: "var(--text)" }}>
                                  <Star size={12} fill="#f2b705" color="#f2b705" /> {svc.item.rating_avg}
                                </span>
                              ) : null}
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                              <strong style={{ color: "var(--primary)" }} dir="ltr">{money(svc.estimatedMad)}</strong>
                              {otherAlts.length > 0 && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline"
                                  style={{ padding: "3px 9px", fontSize: "0.74rem" }}
                                  onClick={() => setSwappingRole(swappingRole === svc.role ? null : svc.role)}
                                >
                                  <RefreshCw size={11} /> {tr("swapOptionBtn")}
                                </button>
                              )}
                            </div>

                            {swappingRole === svc.role && otherAlts.length > 0 && (
                              <div style={{ marginTop: 6, paddingTop: 8, borderTop: "1px solid var(--border)", display: "grid", gap: 5 }}>
                                {otherAlts.map((alt) => (
                                  <button
                                    key={alt.id}
                                    type="button"
                                    className="btn btn-sm btn-outline"
                                    style={{ justifyContent: "space-between", fontSize: "0.76rem", textAlign: "start" }}
                                    onClick={() => swapServiceInPlan(svc.role, alt)}
                                  >
                                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{localizedTitle(alt)}</span>
                                    <strong dir="ltr">{money(alt.estimatedMad ?? alt.base_price_mad)}</strong>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Day-by-Day Structured Schedule */}
              <div className="grid-2" style={{ gap: 14 }}>
                {plan.dailyPlan.map((d) => (
                  <div key={d.day} className="card card-body planner-day-card" style={{ display: "grid", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                      <strong style={{ color: "var(--primary)", fontSize: "1rem" }}>
                        {tr("dayLabel")} {d.day} · {tCity(lang, d.city)}
                      </strong>
                      <span className="badge badge-muted">{d.day === 1 ? tr("search.checkIn") : d.day === plan.days ? tr("search.checkOut") : tr("exploreAll")}</span>
                    </div>

                    <div style={{ display: "grid", gap: 9, fontSize: "0.88rem" }}>
                      {d.stay && (
                        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                          <BedDouble size={15} style={{ color: "var(--primary)", marginTop: 2, flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", fontWeight: 700 }}>{tr("stayLabel")}</div>
                            <Link href={`/properties/${d.stay.slug}`} style={{ color: "var(--text)", fontWeight: 600 }}>{localizedTitle(d.stay)}</Link>
                          </div>
                        </div>
                      )}

                      {d.experience && (
                        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                          <Compass size={15} style={{ color: "#0f766e", marginTop: 2, flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", fontWeight: 700 }}>{tr("activityLabel")}</div>
                            <Link href={`/properties/${d.experience.slug}`} style={{ color: "var(--text)", fontWeight: 600 }}>
                              {localizedTitle(d.experience)}
                            </Link>
                            {d.experience.estimatedMad ? (
                              <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}> · {money(d.experience.estimatedMad)}</span>
                            ) : null}
                          </div>
                        </div>
                      )}

                      {d.dining && (
                        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                          <Utensils size={15} style={{ color: "#b45309", marginTop: 2, flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", fontWeight: 700 }}>{tr("dining")}</div>
                            <Link href={`/properties/${d.dining.slug}`} style={{ color: "var(--text)", fontWeight: 600 }}>
                              {localizedTitle(d.dining)}
                            </Link>
                            {d.dining.estimatedMad ? (
                              <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}> · {money(d.dining.estimatedMad)}</span>
                            ) : null}
                          </div>
                        </div>
                      )}

                      {d.car && (
                        <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                          <Car size={14} style={{ color: "var(--primary)", flexShrink: 0 }} />
                          <Link href={`/properties/${d.car.slug}`} style={{ color: "var(--primary)" }}>{localizedTitle(d.car)}</Link>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* 4. Complete A-to-Z Mobility, Local Insider Tips & Travel Checklist */}
              <div className="grid-2" style={{ gap: 14 }}>
                <div className="card card-body" style={{ display: "grid", gap: 12 }}>
                  <h3 style={{ margin: 0, fontSize: "1rem", display: "flex", alignItems: "center", gap: 7 }}>
                    <Train size={17} style={{ color: "var(--primary)" }} /> {tr("plannerMobilityTitle")}
                  </h3>
                  {plan.cityGuide && (
                    <div style={{ display: "grid", gap: 6, fontSize: "0.84rem", color: "var(--text-muted)", background: "var(--surface-muted)", padding: 12, borderRadius: 12 }}>
                      <strong style={{ color: "var(--text)" }}>{tr("localInsiderTitle")} · {tCity(lang, plan.city)}</strong>
                      <div><strong style={{ color: "var(--text)" }}>•</strong> {plan.cityGuide.bestDistrict}</div>
                      <div><strong style={{ color: "var(--text)" }}>•</strong> {plan.cityGuide.gettingThere}</div>
                      <div><strong style={{ color: "var(--text)" }}>•</strong> {plan.cityGuide.mustTryDish}</div>
                      <div><strong style={{ color: "var(--text)" }}>•</strong> {plan.cityGuide.bestHours}</div>
                    </div>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                    <Link href={`/services?tab=transport&to=${encodeURIComponent(plan.city)}`} className="btn btn-sm btn-outline">
                      <Train size={14} /> {tr("transportTab")}
                    </Link>
                    <Link href="/services?tab=flights" className="btn btn-sm btn-outline">
                      <Plane size={14} /> {tr("flights")}
                    </Link>
                    <Link href="/services?tab=esim" className="btn btn-sm btn-outline">
                      <Wifi size={14} /> {tr("esim")}
                    </Link>
                    <Link href="/services?tab=guide" className="btn btn-sm btn-outline">
                      <ShieldCheck size={14} /> {tr("travelGuide")}
                    </Link>
                  </div>
                </div>

                <div className="card card-body" style={{ display: "grid", gap: 10 }}>
                  <h3 style={{ margin: 0, fontSize: "1rem", display: "flex", alignItems: "center", gap: 7 }}>
                    <Luggage size={17} style={{ color: "var(--primary)" }} /> {tr("plannerChecklistTitle")}
                  </h3>
                  <div style={{ display: "grid", gap: 8 }}>
                    {DEFAULT_CHECKLIST.map((item) => {
                      const done = !!checkedTasks[item.id];
                      const text = lang === "ar" ? item.labelAr : lang === "fr" ? item.labelFr : item.labelEn;
                      return (
                        <label
                          key={item.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "8px 10px",
                            borderRadius: 10,
                            border: "1px solid var(--border)",
                            background: done ? "var(--primary-light)" : "var(--surface)",
                            cursor: "pointer",
                            fontSize: "0.84rem",
                            textDecoration: done ? "line-through" : "none",
                            color: done ? "var(--primary)" : "var(--text)",
                          }}
                        >
                          <input type="checkbox" checked={done} onChange={() => toggleChecklistTask(item.id)} />
                          <span>{text}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          {savedPlans.length > 0 && (
            <div className="card card-body">
              <h3 style={{ marginTop: 0 }}>{tr("savedItinerariesTitle")}</h3>
              <div style={{ display: "grid", gap: 8 }}>
                {savedPlans.map((sp) => (
                  <div
                    key={String(sp.id)}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 8,
                      padding: 10,
                      borderRadius: 10,
                      border: "1px solid var(--border)",
                    }}
                  >
                    <span>
                      <strong>{String(sp.plan_ref)}</strong> · {tCity(lang, String(sp.city))} ({Number(sp.days_count)} {tr("dayLabel")})
                    </span>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span className="badge badge-muted">{String(sp.status)} · {money(Number(sp.estimated_total_mad))}</span>
                      {typeof sp.plan_json === "string" && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          onClick={() => {
                            try {
                              const parsed = JSON.parse(String(sp.plan_json));
                              setPlan({
                                planRef: String(sp.plan_ref),
                                status: String(sp.status),
                                pricingDisclaimer: "Loaded from your saved MARHABA itineraries.",
                                ...parsed,
                              });
                            } catch {
                              // ignore malformed json
                            }
                          }}
                        >
                          {tr("seeAvailability")}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
