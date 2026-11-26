"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Copy,
  Globe2,
  Info,
  Laptop,
  MapPin,
  Printer,
  QrCode,
  Search,
  Signal,
  Smartphone,
  Sparkles,
  Wifi,
  Zap,
} from "lucide-react";
import { useApp } from "./AppProvider";
import { BrandLogo } from "./BrandLogo";
import { TelecomOfficialLogo } from "./CarrierOfficialLogo";
import { MoroccanPaymentBadges } from "./MoroccanPaymentBadges";
import {
  COMPATIBLE_DEVICE_GROUPS,
  ESIM_PACKAGES,
  MOROCCO_COVERAGE_ZONES,
  TELECOM_OPERATORS,
  searchCompatibleDevices,
  type EsimPackage,
  type TelecomOperatorId,
} from "@/lib/services-catalog";

interface EsimSubmitResp {
  requestRef?: string;
  package?: EsimPackage;
  operator?: { id: TelecomOperatorId; name: string; apn: string };
  smdpAddress?: string;
  activationCode?: string;
  qrPayload?: string;
  status?: string;
  note?: string;
  error?: string;
}

export function EsimExperience({
  initialPackageCode,
  esimHistory,
  onReloadHistory,
  standalone = false,
}: {
  initialPackageCode?: string;
  esimHistory: Array<Record<string, unknown>>;
  onReloadHistory: () => void;
  standalone?: boolean;
}) {
  const { lang, money, user, tr, notify } = useApp();
  const isAr = lang === "ar";
  const isFr = lang === "fr";

  const copy = useMemo(
    () => ({
      badge: isAr ? "شريحة eSIM المغرب 5G" : isFr ? "eSIM Maroc 5G / 4G+" : "Morocco 5G / 4G+ eSIM",
      title: isAr ? "شرائح eSIM المغرب الفورية" : isFr ? "eSIM Voyage Maroc Instantanée" : "Morocco Instant Travel eSIM",
      subtitle: isAr
        ? "تغطية 4G+/5G عبر اتصالات المغرب وأورنج وإنوي من طنجة إلى الداخلة — بدون انتظار في المطار."
        : isFr
        ? "Couverture 4G+/5G via Maroc Telecom, Orange & inwi de Tanger à Dakhla — sans file d’attente."
        : "High-speed 4G+/5G via Maroc Telecom, Orange & inwi from Tangier to Dakhla — zero airport queue.",
      partnersLabel: isAr ? "الشبكات المحلية:" : isFr ? "Réseaux locaux :" : "Local 5G/4G+ Networks:",
      step1: isAr ? "1. الباقة والتغطية" : isFr ? "1. Forfait & Réseau" : "1. Plan & Network",
      step2: isAr ? "2. فحص الهاتف والتفعيل" : isFr ? "2. Compatibilité & Activation" : "2. Device & Checkout",
      step3: isAr ? "3. رمز QR ودليل التثبيت" : isFr ? "3. Pass QR & Guide" : "3. QR Pass & Setup",
      estimatorTitle: isAr ? "حاسبة البيانات لرحلتك" : isFr ? "Estimateur Data de Voyage" : "Smart Trip Data Calculator",
      daysLabel: isAr ? "مدة الرحلة" : isFr ? "Durée du séjour" : "Trip length",
      usageLabel: isAr ? "طبيعة الاستخدام" : isFr ? "Profil d’utilisation" : "Travel Usage Profile",
      applyRec: isAr ? "اعتماد المقترح" : isFr ? "Appliquer" : "Apply Recommended",
      allOps: isAr ? "أفضل شبكة تلقائياً" : isFr ? "Meilleur réseau auto" : "Best Auto Signal",
      coverageTitle: isAr ? "خريطة التغطية حسب الجهة" : isFr ? "Couverture par Région" : "Signal Coverage by Region",
      coverageSub: isAr
        ? "قارن قوة الإشارة في المدن الكبرى وجبال الأطلس ومرزوكة والداخلة."
        : isFr
        ? "Comparez la couverture réelle en ville, dans l’Atlas, à Merzouga et à Dakhla."
        : "Compare real-world signal across Morocco’s cities, Atlas mountains, Sahara dunes & Southern Provinces.",
      deviceCheckTitle: isAr ? "تحقق من توافق هاتفك مع eSIM" : isFr ? "Vérifier la compatibilité eSIM" : "Check Smartphone eSIM Support",
      devicePlaceholder: isAr
        ? "ابحث عن هاتفك (مثلاً iPhone 15, S24, Pixel 8)..."
        : isFr
        ? "Rechercher votre modèle (ex: iPhone 15, S24, Pixel 8)..."
        : "Search phone model (e.g. iPhone 15, Galaxy S24, Pixel 8)...",
      eidTip: isAr
        ? "اطلب *#06# في هاتفك وتأكد من ظهور رقم EID قبل الطلب."
        : isFr
        ? "Composez *#06# sur votre téléphone pour vérifier la présence d’un numéro EID."
        : "Dial *#06# on your phone keypad and confirm an EID number appears.",
      activateBtn: isAr ? "طلب رمز QR للتفعيل" : isFr ? "Commander mon eSIM QR" : "Request Instant eSIM QR",
      selectedLabel: isAr ? "الباقة المختارة" : isFr ? "Forfait sélectionné" : "Selected Plan",
      viewDetails: isAr ? "التفاصيل" : isFr ? "Détails" : "Plan Page",
      selectPlan: isAr ? "اختيار الباقة" : isFr ? "Choisir" : "Select Plan",
      carrierLabel: isAr ? "الشبكة المفضلة" : isFr ? "Opérateur préféré" : "Preferred Carrier",
      arrivalLabel: isAr ? "تاريخ الوصول" : isFr ? "Date d’arrivée" : "Arrival Date",
      guideTitle: isAr ? "دليل التثبيت في دقيقتين" : isFr ? "Guide d’installation (2 min)" : "2-Minute Installation Guide",
      printPass: isAr ? "طباعة البطاقة" : isFr ? "Imprimer le Pass" : "Print eSIM Pass",
    }),
    [isAr, isFr]
  );

  const [activeOpFilter, setActiveOpFilter] = useState<"all" | TelecomOperatorId>("all");
  const [selectedCode, setSelectedCode] = useState<string>(
    initialPackageCode && ESIM_PACKAGES.some((p) => p.code === initialPackageCode)
      ? initialPackageCode
      : "MA-5GB-30D"
  );
  const [tripDays, setTripDays] = useState<number>(10);
  const [usageTier, setUsageTier] = useState<"light" | "balanced" | "nomad">("balanced");
  const [activeZoneId, setActiveZoneId] = useState<string>("casa-rabat");

  // Device checker + checkout state
  const [deviceQuery, setDeviceQuery] = useState("");
  const [selectedDevice, setSelectedDevice] = useState("");
  const [preferredOp, setPreferredOp] = useState<"auto" | TelecomOperatorId>("auto");
  const [arrivalDate, setArrivalDate] = useState(() =>
    new Date(Date.now() + 5 * 86400_000).toISOString().slice(0, 10)
  );
  const [email, setEmail] = useState("");
  const [deviceUnlocked, setDeviceUnlocked] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resp, setResp] = useState<EsimSubmitResp | null>(null);

  // Setup guide & active step
  const [osTab, setOsTab] = useState<"ios" | "android">("ios");
  const [sectionFocus, setSectionFocus] = useState<"plans" | "checkout" | "guide">("plans");

  useEffect(() => {
    if (initialPackageCode && ESIM_PACKAGES.some((p) => p.code === initialPackageCode)) {
      setSelectedCode(initialPackageCode);
    }
  }, [initialPackageCode]);

  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [user, email]);

  const recommendedCode = useMemo(() => {
    const ratePerDay = usageTier === "light" ? 0.25 : usageTier === "balanced" ? 0.5 : 1.35;
    const estGb = tripDays * ratePerDay;
    if (estGb <= 1) return "MA-1GB-7D";
    if (estGb <= 3) return "MA-3GB-30D";
    if (estGb <= 5) return "MA-5GB-30D";
    if (estGb <= 10) return "MA-10GB-30D";
    if (estGb <= 20) return "MA-20GB-30D";
    return "MA-UNL-15D";
  }, [tripDays, usageTier]);

  const recommendedPlan = useMemo(
    () => ESIM_PACKAGES.find((p) => p.code === recommendedCode) || ESIM_PACKAGES[2],
    [recommendedCode]
  );

  const currentPlan = useMemo(
    () => ESIM_PACKAGES.find((p) => p.code === selectedCode) || ESIM_PACKAGES[2],
    [selectedCode]
  );

  const activeZone = useMemo(
    () => MOROCCO_COVERAGE_ZONES.find((z) => z.id === activeZoneId) || MOROCCO_COVERAGE_ZONES[0],
    [activeZoneId]
  );

  const deviceMatches = useMemo(() => searchCompatibleDevices(deviceQuery), [deviceQuery]);

  const filteredPackages = useMemo(() => {
    if (activeOpFilter === "all") return ESIM_PACKAGES;
    return ESIM_PACKAGES.filter((p) => p.operators.includes(activeOpFilter));
  }, [activeOpFilter]);

  const activeOperatorInfo = useMemo(() => {
    const id = preferredOp === "auto" ? currentPlan.bestOperator : preferredOp;
    return TELECOM_OPERATORS.find((o) => o.id === id) || TELECOM_OPERATORS[0];
  }, [preferredOp, currentPlan]);

  const handleSelectPackage = (code: string) => {
    setSelectedCode(code);
    setSectionFocus("checkout");
    if (typeof document !== "undefined") {
      document.getElementById("marhaba-esim-checkout")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleCopyText = async (txt: string, label: string) => {
    try {
      await navigator.clipboard.writeText(txt);
      notify(`${label} copied`, "success");
    } catch {
      notify(txt, "info");
    }
  };

  const submitEsim = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResp(null);
    try {
      const res = await fetch("/api/v1/services/esim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageCode: selectedCode,
          customerEmail: email,
          deviceUnlockedConfirmed: deviceUnlocked,
          preferredOperator: preferredOp,
          arrivalDate,
          deviceModel: selectedDevice || deviceQuery,
        }),
      });
      const data: EsimSubmitResp = await res.json();
      setResp(res.ok ? data : { error: data.error || "Submission failed" });
      if (res.ok) {
        notify(`${data.requestRef}`, "success");
        setSectionFocus("guide");
        onReloadHistory();
        if (typeof document !== "undefined") {
          document.getElementById("marhaba-esim-guide")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    } catch {
      setResp({ error: "Network error while requesting eSIM." });
    } finally {
      setSubmitting(false);
    }
  };

  const renderBars = (score: number) => (
    <span style={{ display: "inline-flex", alignItems: "flex-end", gap: 2, height: 14 }} aria-label={`${score}/5 signal`}>
      {[1, 2, 3, 4, 5].map((lvl) => (
        <span
          key={lvl}
          style={{
            width: 3.5,
            height: 3 + lvl * 2.1,
            borderRadius: 2,
            background: lvl <= score ? "var(--primary)" : "var(--border)",
          }}
        />
      ))}
    </span>
  );

  return (
    <div className="esim-root">
      {/* MARHABA Branded eSIM Hero Card */}
      <div className="card card-body brand-zellige esim-hero-card">
        <div className="esim-hero-grid">
          <div style={{ display: "grid", gap: 10, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span className="badge badge-primary" style={{ gap: 5 }}>
                <Wifi size={13} /> {copy.badge}
              </span>
              <span className="badge badge-gold" style={{ gap: 4 }}>
                <Zap size={12} /> {isAr ? "تفعيل فوري QR" : isFr ? "QR Instantané" : "Instant QR"}
              </span>
              {standalone && (
                <Link href="/services?tab=esim" className="badge badge-muted" style={{ gap: 5 }}>
                  <Sparkles size={12} /> MARHABA Hub
                </Link>
              )}
            </div>

            <h2 style={{ margin: 0, fontSize: "clamp(1.3rem, 2.5vw, 1.75rem)" }}>{copy.title}</h2>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: 1.55 }}>
              {copy.subtitle}
            </p>

            {/* Official Moroccan Telecom Logos Row */}
            <div dir="ltr" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", paddingTop: 4 }}>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 700 }}>
                {copy.partnersLabel}
              </span>
              {TELECOM_OPERATORS.map((op) => (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => {
                    setActiveOpFilter((prev) => (prev === op.id ? "all" : op.id));
                    setPreferredOp(op.id);
                  }}
                  className={`esim-op-pill ${activeOpFilter === op.id ? "active" : ""}`}
                  title={op.name}
                >
                  <TelecomOfficialLogo operatorId={op.id} height={18} compact />
                </button>
              ))}
            </div>
          </div>

          {/* MARHABA Branded Digital eSIM Card Visual */}
          <div className="esim-sim-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div className="esim-sim-chip" aria-hidden="true" />
                <div>
                  <div style={{ fontSize: "0.72rem", opacity: 0.85, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    MARHABA CONNECT
                  </div>
                  <strong style={{ fontSize: "0.96rem" }} dir="ltr">
                    {currentPlan.name}
                  </strong>
                </div>
              </div>
              <span className="badge badge-gold" dir="ltr">
                {currentPlan.dataLabel} · {currentPlan.durationDays}d
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                gap: 10,
                paddingTop: 4,
                borderTop: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              <div style={{ fontSize: "0.76rem", opacity: 0.92, display: "grid", gap: 2 }}>
                <span dir="ltr">{activeOperatorInfo.name} · 5G / 4G+</span>
                <span>{isAr ? "تبقى شريحتك الأصلية فعّالة" : isFr ? "Gardez votre SIM active" : "Keep home SIM active for OTPs"}</span>
              </div>
              <div dir="ltr" style={{ fontWeight: 900, fontSize: "1.3rem", color: "#fde68a" }}>
                {money(currentPlan.priceMad)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Branded Fluid Step Segmented Navigation (LTR-locked) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div className="marhaba-segmented" dir="ltr" role="tablist">
          <button
            type="button"
            className={`marhaba-seg-btn ${sectionFocus === "plans" ? "active" : ""}`}
            onClick={() => {
              setSectionFocus("plans");
              document.getElementById("marhaba-esim-plans")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <Wifi size={14} />
            <span>{copy.step1}</span>
          </button>
          <button
            type="button"
            className={`marhaba-seg-btn ${sectionFocus === "checkout" ? "active" : ""}`}
            onClick={() => {
              setSectionFocus("checkout");
              document.getElementById("marhaba-esim-checkout")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <Smartphone size={14} />
            <span>{copy.step2}</span>
          </button>
          <button
            type="button"
            className={`marhaba-seg-btn ${sectionFocus === "guide" ? "active" : ""}`}
            onClick={() => {
              setSectionFocus("guide");
              document.getElementById("marhaba-esim-guide")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <QrCode size={14} />
            <span>{copy.step3}</span>
          </button>
        </div>

        <span className="badge badge-muted" dir="ltr">
          {ESIM_PACKAGES.length} Plans · {money(50)} – {money(390)}
        </span>
      </div>

      {/* STEP 1: INTERACTIVE TRIP CALCULATOR + PACKAGE CARDS */}
      <section id="marhaba-esim-plans" style={{ display: "grid", gap: 16, minWidth: 0 }}>
        {/* Compact Fluid Smart Data Estimator */}
        <div className="card card-body esim-calc-grid">
          <div style={{ display: "grid", gap: 8, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <strong style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.94rem" }}>
                <Zap size={16} color="var(--primary)" /> {copy.estimatorTitle}
              </strong>
              <span className="badge badge-primary" dir="ltr">
                {tripDays}d
              </span>
            </div>
            <input
              type="range"
              min={3}
              max={30}
              value={tripDays}
              onChange={(e) => setTripDays(Number(e.target.value))}
              aria-label={copy.daysLabel}
              style={{ width: "100%", accentColor: "var(--primary)", cursor: "pointer" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)" }} dir="ltr">
              <span>3 days</span>
              <span>15 days</span>
              <span>30 days</span>
            </div>
          </div>

          <div style={{ display: "grid", gap: 8, minWidth: 0 }}>
            <span className="field-label" style={{ margin: 0 }}>
              {copy.usageLabel}
            </span>
            <div className="marhaba-segmented" dir="ltr" style={{ width: "100%", justifyContent: "space-between" }}>
              <button
                type="button"
                className={`marhaba-seg-btn ${usageTier === "light" ? "active" : ""}`}
                style={{ flex: "1 1 auto", justifyContent: "center", paddingInline: 10 }}
                onClick={() => setUsageTier("light")}
              >
                Maps & Chat
              </button>
              <button
                type="button"
                className={`marhaba-seg-btn ${usageTier === "balanced" ? "active" : ""}`}
                style={{ flex: "1 1 auto", justifyContent: "center", paddingInline: 10 }}
                onClick={() => setUsageTier("balanced")}
              >
                Photos & Calls
              </button>
              <button
                type="button"
                className={`marhaba-seg-btn ${usageTier === "nomad" ? "active" : ""}`}
                style={{ flex: "1 1 auto", justifyContent: "center", paddingInline: 10 }}
                onClick={() => setUsageTier("nomad")}
              >
                Work & 4K
              </button>
            </div>
          </div>

          <div
            style={{
              padding: "12px 14px",
              borderRadius: 14,
              background: "var(--gold-soft)",
              border: "1px solid rgba(217, 155, 22, 0.28)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
              minWidth: 0,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", fontWeight: 700 }}>MARHABA Match</div>
              <strong dir="ltr" style={{ color: "var(--primary)", fontSize: "0.96rem", display: "block" }}>
                {recommendedPlan.name} · {money(recommendedPlan.priceMad)}
              </strong>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-gold"
              style={{ flexShrink: 0 }}
              onClick={() => handleSelectPackage(recommendedCode)}
            >
              {copy.applyRec}
            </button>
          </div>
        </div>

        {/* Operator Filter Bar (LTR-locked) */}
        <div dir="ltr" className="no-scrollbar" style={{ display: "flex", alignItems: "center", gap: 8, overflowX: "auto", maxWidth: "100%", paddingBottom: 2 }}>
          <button
            type="button"
            className={`marhaba-quiet-chip ${activeOpFilter === "all" ? "active" : ""}`}
            onClick={() => setActiveOpFilter("all")}
          >
            <Globe2 size={13} style={{ display: "inline", verticalAlign: "-2px", marginInlineEnd: 5 }} />
            {copy.allOps}
          </button>
          {TELECOM_OPERATORS.map((op) => (
            <button
              key={op.id}
              type="button"
              className={`marhaba-quiet-chip ${activeOpFilter === op.id ? "active" : ""}`}
              onClick={() => {
                setActiveOpFilter(op.id);
                setPreferredOp(op.id);
              }}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, paddingInlineStart: 6 }}
            >
              <TelecomOfficialLogo operatorId={op.id} height={15} compact />
              <span>{op.shortName}</span>
            </button>
          ))}
        </div>

        {/* Responsive 3 -> 2 -> 1 Column Package Cards Grid */}
        <div className="esim-plans-grid">
          {filteredPackages.map((pkg) => {
            const isSelected = pkg.code === selectedCode;
            const isRecommended = pkg.code === recommendedCode;
            const perGb = Math.round(pkg.priceMad / pkg.dataGb);
            const recDesc = isAr ? pkg.recommendedForAr : isFr ? pkg.recommendedForFr : pkg.recommendedForEn;
            return (
              <div
                key={pkg.code}
                className="card card-body"
                style={{
                  display: "grid",
                  gap: 10,
                  minWidth: 0,
                  border: isSelected
                    ? "2px solid var(--primary)"
                    : isRecommended
                    ? "1.5px solid var(--gold)"
                    : "1px solid var(--border)",
                  boxShadow: isSelected ? "var(--shadow-md)" : undefined,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: "1.35rem", fontWeight: 900, color: "var(--primary)" }} dir="ltr">
                        {pkg.dataLabel}
                      </span>
                      <span className="badge badge-primary" dir="ltr">
                        {pkg.durationDays}d
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, marginTop: 2, fontSize: "0.94rem" }}>{pkg.name}</div>
                  </div>
                  <div style={{ textAlign: "end", flexShrink: 0 }}>
                    <div dir="ltr" style={{ fontWeight: 900, fontSize: "1.18rem", color: "var(--text)" }}>
                      {money(pkg.priceMad)}
                    </div>
                    <div dir="ltr" style={{ fontSize: "0.73rem", color: "var(--text-muted)" }}>
                      ~{money(perGb)} / GB
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {pkg.badge && <span className="badge badge-gold">{pkg.badge}</span>}
                  {isRecommended && (
                    <span className="badge badge-success" style={{ gap: 4 }}>
                      <Sparkles size={11} /> Best Match
                    </span>
                  )}
                  <span className="badge badge-muted" dir="ltr">
                    {pkg.networkSpeed}
                  </span>
                </div>

                <p style={{ margin: 0, fontSize: "0.84rem", color: "var(--text-muted)", lineHeight: 1.45 }}>
                  {recDesc}
                </p>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, paddingTop: 4, borderTop: "1px solid var(--border)" }}>
                  <div dir="ltr" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {pkg.operators.map((opId) => (
                      <TelecomOfficialLogo key={opId} operatorId={opId} height={14} compact />
                    ))}
                  </div>
                  <span style={{ fontSize: "0.74rem", color: "var(--success)", fontWeight: 700 }}>
                    Hotspot OK
                  </span>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${isSelected ? "btn-primary" : "btn-outline"}`}
                    style={{ flex: 1 }}
                    onClick={() => handleSelectPackage(pkg.code)}
                  >
                    {isSelected ? (
                      <>
                        <CheckCircle2 size={14} /> {copy.selectedLabel}
                      </>
                    ) : (
                      copy.selectPlan
                    )}
                  </button>
                  <Link href={`/esim/${pkg.code}`} className="btn btn-sm btn-outline">
                    {copy.viewDetails}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Regional 5G / Sahara Coverage Explorer */}
        <div className="card card-body" style={{ display: "grid", gap: 14, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <Signal size={18} color="var(--primary)" /> {copy.coverageTitle}
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                {copy.coverageSub}
              </p>
            </div>
            <span className="badge badge-primary" dir="ltr">
              {activeZone.speedLabel}
            </span>
          </div>

          <div dir="ltr" className="no-scrollbar" style={{ display: "flex", gap: 8, overflowX: "auto", maxWidth: "100%", paddingBottom: 2 }}>
            {MOROCCO_COVERAGE_ZONES.map((z) => (
              <button
                key={z.id}
                type="button"
                className={`marhaba-quiet-chip ${activeZoneId === z.id ? "active" : ""}`}
                style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
                onClick={() => setActiveZoneId(z.id)}
              >
                <MapPin size={12} /> {isAr ? z.zoneAr : isFr ? z.zoneFr : z.zoneEn}
              </button>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: 12,
            }}
          >
            {TELECOM_OPERATORS.map((op) => {
              const sig =
                op.id === "iam"
                  ? activeZone.iamSignal
                  : op.id === "orange"
                  ? activeZone.orangeSignal
                  : activeZone.inwiSignal;
              return (
                <div
                  key={op.id}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    background: "var(--surface-muted)",
                    display: "grid",
                    gap: 6,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <TelecomOfficialLogo operatorId={op.id} height={18} compact />
                    {renderBars(sig)}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>{op.name}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    {isAr ? op.saharaAtlasNoteAr : isFr ? op.saharaAtlasNoteFr : op.saharaAtlasNoteEn}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              background: "var(--primary-soft)",
              fontSize: "0.84rem",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Info size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
            <span>{isAr ? activeZone.tipAr : isFr ? activeZone.tipFr : activeZone.tipEn}</span>
          </div>
        </div>
      </section>

      {/* STEP 2: DEVICE COMPATIBILITY CHECKER + INSTANT ACTIVATION CHECKOUT */}
      <section id="marhaba-esim-checkout" className="esim-checkout-grid">
        {/* Left: Device Compatibility Checker */}
        <div className="card card-body" style={{ display: "grid", gap: 12, minWidth: 0 }}>
          <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Smartphone size={18} color="var(--primary)" /> {copy.deviceCheckTitle}
          </h3>

          <div style={{ position: "relative" }}>
            <Search
              size={15}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
            <input
              type="text"
              className="input"
              style={{ paddingLeft: 36 }}
              placeholder={copy.devicePlaceholder}
              value={deviceQuery}
              onChange={(e) => setDeviceQuery(e.target.value)}
            />
          </div>

          {deviceQuery.trim().length > 0 ? (
            <div style={{ display: "grid", gap: 8 }}>
              {deviceMatches.length > 0 ? (
                deviceMatches.slice(0, 5).map((m) => (
                  <button
                    key={m.model}
                    type="button"
                    onClick={() => {
                      setSelectedDevice(m.model);
                      setDeviceQuery(m.model);
                    }}
                    style={{
                      textAlign: "start",
                      padding: "9px 12px",
                      borderRadius: 10,
                      border: "1px solid var(--border)",
                      background: "var(--success-bg)",
                      cursor: "pointer",
                      display: "grid",
                      gap: 2,
                    }}
                  >
                    <strong style={{ fontSize: "0.86rem", display: "flex", alignItems: "center", gap: 6 }}>
                      <CheckCircle2 size={14} color="var(--success)" /> {m.model}
                    </strong>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }} dir="ltr">
                      {m.setupPath}
                    </span>
                  </button>
                ))
              ) : (
                <div className="badge badge-warning" style={{ padding: "8px 10px" }}>
                  Not listed? Dial *#06# to check if your phone displays an EID number.
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {COMPATIBLE_DEVICE_GROUPS.map((grp) => (
                <div
                  key={grp.brand}
                  style={{ padding: "9px 11px", borderRadius: 10, background: "var(--surface-muted)", fontSize: "0.82rem" }}
                >
                  <strong>{grp.brand}</strong>
                  <div style={{ color: "var(--text-muted)", marginTop: 2 }}>{grp.models[0]} · {grp.models[1]}</div>
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              padding: "9px 12px",
              borderRadius: 10,
              border: "1px dashed var(--border)",
              fontSize: "0.82rem",
              color: "var(--text-muted)",
            }}
          >
            {copy.eidTip}
          </div>
        </div>

        {/* Right: Activation Checkout Form */}
        <form onSubmit={submitEsim} className="card card-body" style={{ display: "grid", gap: 12, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <h3 style={{ margin: 0 }}>{copy.selectedLabel}</h3>
            <BrandLogo size="sm" showArabic={false} />
          </div>

          <div
            style={{
              padding: 14,
              borderRadius: 12,
              background: "var(--surface-muted)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: "1.02rem" }} dir="ltr">
                {currentPlan.name} ({currentPlan.dataLabel})
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }} dir="ltr">
                {currentPlan.durationDays}d · {activeOperatorInfo.name} · APN {activeOperatorInfo.apn}
              </div>
            </div>
            <div dir="ltr" style={{ fontWeight: 900, fontSize: "1.28rem", color: "var(--primary)" }}>
              {money(currentPlan.priceMad)}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
            <div>
              <label className="field-label">{copy.carrierLabel}</label>
              <select
                className="input"
                value={preferredOp}
                onChange={(e) => setPreferredOp(e.target.value as "auto" | TelecomOperatorId)}
              >
                <option value="auto">Auto Best Signal ({currentPlan.bestOperator.toUpperCase()})</option>
                <option value="iam">Maroc Telecom (IAM)</option>
                <option value="orange">Orange Maroc</option>
                <option value="inwi">inwi Morocco</option>
              </select>
            </div>
            <div>
              <label className="field-label">{copy.arrivalLabel}</label>
              <input
                type="date"
                className="input"
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="field-label">{tr("deliveryEmailLabel")}</label>
            <input
              type="email"
              className="input"
              required
              placeholder="traveler@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.86rem" }}>
            <input
              type="checkbox"
              checked={deviceUnlocked}
              onChange={(e) => setDeviceUnlocked(e.target.checked)}
              required
            />
            {tr("esimUnlockedConfirm")}
          </label>

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            <QrCode size={16} /> {submitting ? tr("submittingLabel") : copy.activateBtn}
          </button>

          <MoroccanPaymentBadges />

          {resp?.error && <div className="badge badge-danger">{resp.error}</div>}
        </form>
      </section>

      {/* STEP 3: QR ACTIVATION PASS + iOS/ANDROID GUIDE + HISTORY */}
      <section id="marhaba-esim-guide" style={{ display: "grid", gap: 16, minWidth: 0 }}>
        {resp?.requestRef && (
          <div
            className="card card-body"
            style={{
              border: "2px solid var(--success)",
              background: "var(--success-bg)",
              display: "grid",
              gap: 14,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "grid", gap: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <CheckCircle2 size={18} color="var(--success)" />
                  <strong dir="ltr" style={{ fontSize: "1.08rem" }}>
                    {resp.requestRef}
                  </strong>
                  <span className="badge badge-warning">{tr("pendingQuoteStatus")}</span>
                </div>
                <p style={{ margin: 0, fontSize: "0.86rem" }}>{resp.note}</p>
              </div>
              <button type="button" className="btn btn-sm btn-outline" onClick={() => window.print()}>
                <Printer size={14} /> {copy.printPass}
              </button>
            </div>

            <div className="esim-qr-box">
              <svg
                width="96"
                height="96"
                viewBox="0 0 24 24"
                fill="none"
                aria-label="MARHABA eSIM QR Pass"
                style={{ background: "#fff", padding: 8, borderRadius: 10, border: "1px solid var(--border)" }}
              >
                <rect x="2" y="2" width="7" height="7" stroke="#0f172a" strokeWidth="1.8" />
                <rect x="4.3" y="4.3" width="2.4" height="2.4" fill="#0f172a" />
                <rect x="15" y="2" width="7" height="7" stroke="#0f172a" strokeWidth="1.8" />
                <rect x="17.3" y="4.3" width="2.4" height="2.4" fill="#0f172a" />
                <rect x="2" y="15" width="7" height="7" stroke="#0f172a" strokeWidth="1.8" />
                <rect x="4.3" y="17.3" width="2.4" height="2.4" fill="#0f172a" />
                <path d="M11 3h2v4h-2zM11 10h3v3h-3zM16 12h6v2h-6zM12 16h4v2h-4zM18 16h4v6h-4zM11 20h4v2h-4z" fill="#0f172a" />
              </svg>

              <div style={{ display: "grid", gap: 6, fontSize: "0.84rem", minWidth: 0 }}>
                <div>
                  <strong>Network:</strong> {resp.operator?.name || activeOperatorInfo.name} · APN{" "}
                  <code dir="ltr">{resp.operator?.apn || activeOperatorInfo.apn}</code>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span>
                    <strong>SM-DP+:</strong> <code dir="ltr">{resp.smdpAddress || "smdp.marhaba.ma"}</code>
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => handleCopyText(resp.smdpAddress || "smdp.marhaba.ma", "SM-DP+")}
                  >
                    <Copy size={12} /> Copy
                  </button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ wordBreak: "break-all" }}>
                    <strong>Activation Code:</strong> <code dir="ltr">{resp.activationCode || resp.requestRef}</code>
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => handleCopyText(resp.activationCode || resp.requestRef || "", "Activation Code")}
                  >
                    <Copy size={12} /> Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="esim-checkout-grid">
          {/* iOS / Android Quick Setup Guide */}
          <div className="card card-body" style={{ display: "grid", gap: 12, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <Laptop size={18} color="var(--primary)" /> {copy.guideTitle}
              </h3>
              <div className="marhaba-segmented" dir="ltr">
                <button
                  type="button"
                  className={`marhaba-seg-btn ${osTab === "ios" ? "active" : ""}`}
                  onClick={() => setOsTab("ios")}
                >
                  iOS (iPhone)
                </button>
                <button
                  type="button"
                  className={`marhaba-seg-btn ${osTab === "android" ? "active" : ""}`}
                  onClick={() => setOsTab("android")}
                >
                  Android
                </button>
              </div>
            </div>

            {osTab === "ios" ? (
              <ol style={{ margin: 0, paddingInlineStart: 18, display: "grid", gap: 6, fontSize: "0.86rem", lineHeight: 1.5 }}>
                <li>Connect to Wi-Fi before departure or at the airport terminal.</li>
                <li>Open <strong>Settings → Mobile Service → Add eSIM → Use QR Code</strong>.</li>
                <li>Label the line <strong>MARHABA Morocco</strong> and set it for <strong>Mobile Data</strong> only.</li>
                <li>Keep your home SIM active for Calls/SMS OTPs, with <strong>Data Roaming OFF</strong> on home SIM and <strong>ON</strong> for Morocco eSIM upon landing.</li>
              </ol>
            ) : (
              <ol style={{ margin: 0, paddingInlineStart: 18, display: "grid", gap: 6, fontSize: "0.86rem", lineHeight: 1.5 }}>
                <li>Connect to stable Wi-Fi before enabling your Morocco eSIM profile.</li>
                <li>Open <strong>Settings → Connections / Network → SIM Manager → Add eSIM</strong>.</li>
                <li>Scan the QR code (or paste SM-DP+ & Activation Code manually).</li>
                <li>Upon arrival in Morocco, enable <strong>Mobile Data</strong> and <strong>Roaming</strong> on the MARHABA eSIM line.</li>
              </ol>
            )}
          </div>

          {/* Saved eSIM Requests History */}
          <div className="card card-body" style={{ display: "grid", gap: 10, minWidth: 0 }}>
            <h3 style={{ margin: 0 }}>{tr("yourEsimRequests")}</h3>
            {esimHistory.length === 0 ? (
              <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.88rem" }}>{tr("noEsimRequests")}</p>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {esimHistory.slice(0, 6).map((item) => {
                  const qrStr = String(item.qr_payload || "");
                  return (
                    <div
                      key={String(item.id)}
                      style={{
                        padding: 10,
                        borderRadius: 10,
                        border: "1px solid var(--border)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <strong dir="ltr">{String(item.request_ref)}</strong>
                        <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }} dir="ltr">
                          {Number(item.data_gb)} GB · {Number(item.duration_days)}d · {money(Number(item.price_mad))}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {qrStr && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline"
                            onClick={() => handleCopyText(qrStr, "LPA QR")}
                            title="Copy LPA QR string"
                          >
                            <Copy size={12} /> LPA
                          </button>
                        )}
                        <span className="badge badge-warning">
                          {String(item.status) === "pending_provider" || String(item.status) === "pending_quote"
                            ? tr("pendingQuoteStatus")
                            : String(item.status)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
