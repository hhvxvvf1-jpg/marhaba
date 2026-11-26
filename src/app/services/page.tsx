"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { WorkspacePageSkeleton } from "@/components/BrandSkeletons";
import {
  AlertTriangle,
  CreditCard,
  LayoutGrid,
  Luggage,
  PhoneCall,
  Plane,
  ShieldAlert,
  ShieldCheck,
  Train,
  Wifi,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { BrandLogo } from "@/components/BrandLogo";
import { TransportBusExperience } from "@/components/TransportBusExperience";
import { FlightsExperience } from "@/components/FlightsExperience";
import { EsimExperience } from "@/components/EsimExperience";
import { ServicesDirectory } from "@/components/ServicesDirectory";
import type { SeatClass } from "@/lib/transport-engine";
import type {
  CorridorQueryResult,
  OfferCarrierType,
} from "@/lib/transport-offers";

function ServicesContent() {
  const sp = useSearchParams();
  const { lang, user, tr } = useApp();
  const isAr = lang === "ar";
  const isFr = lang === "fr";

  const initialTab = sp.get("tab") || "all";
  const [tab, setTab] = useState(initialTab);

  const switchTab = (next: string) => {
    setTab(next);
    if (typeof window !== "undefined") {
      const nextUrl = next === "all" ? "/services" : `/services?tab=${encodeURIComponent(next)}`;
      window.history.replaceState(null, "", nextUrl);
    }
  };

  // Flights history
  const [flightHistory, setFlightHistory] = useState<Array<Record<string, unknown>>>([]);

  // MARHABA Smart Mobility Verified Offers Transport state
  const [tVehicleType, setTVehicleType] = useState<"bus" | "train" | "tram">("bus");
  const tMode: "intercity" | "intracity" = tVehicleType === "tram" ? "intracity" : "intercity";
  const setTMode = (m: "intercity" | "intracity") => {
    setTVehicleType(m === "intracity" ? "tram" : "bus");
  };
  const [tCarrierFilter, setTCarrierFilter] = useState<"all" | OfferCarrierType>("all");
  const [tBrandFilter, setTBrandFilter] = useState<string>("all");
  const [tSort, setTSort] = useState<"best" | "earliest" | "cheapest" | "fastest">("best");
  const [tSeatClass, setTSeatClass] = useState<SeatClass>("standard");
  const [tOrigin, setTOrigin] = useState("Casablanca");
  const [tDest, setTDest] = useState("Marrakech");
  const [tDate, setTDate] = useState(() => new Date(Date.now() + 3 * 86400_000).toISOString().slice(0, 10));
  const [tPax, setTPax] = useState(1);
  const [tPhone, setTPhone] = useState("");
  const [corridorData, setCorridorData] = useState<CorridorQueryResult>({
    offers: [],
    summary: { activeCount: 0, soldOutHiddenCount: 0, cheapestMad: null, fastestMins: null, earliestDep: null, lastVerifiedAt: null },
    externalSearchLinks: [],
  });
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [verifyingLive, setVerifyingLive] = useState(false);
  const [watchdogMsg, setWatchdogMsg] = useState<string | null>(null);
  const [transHistory, setTransHistory] = useState<Array<Record<string, unknown>>>([]);

  // Guide & eSIM state
  const [madAmount, setMadAmount] = useState(500);
  const [esimHistory, setEsimHistory] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    const tParam = sp.get("tab");
    setTab(tParam || "all");
  }, [sp]);

  useEffect(() => {
    if (user && !tPhone && user.phone) {
      setTPhone(user.phone);
    }
  }, [user, tPhone]);

  const loadHistories = async () => {
    const [fh, th, eh] = await Promise.all([
      fetch("/api/v1/services/flights").then((r) => r.json()).catch(() => ({ requests: [] })),
      fetch("/api/v1/services/transport").then((r) => r.json()).catch(() => ({ requests: [] })),
      fetch("/api/v1/services/esim").then((r) => r.json()).catch(() => ({ requests: [] })),
    ]);
    setFlightHistory(fh.requests || []);
    setTransHistory(th.requests || []);
    setEsimHistory(eh.requests || []);
  };

  useEffect(() => {
    loadHistories();
  }, [user]);

  const loadCorridorOffers = async () => {
    setLoadingOffers(true);
    try {
      const qs = new URLSearchParams({
        origin: tOrigin,
        destination: tMode === "intracity" ? tOrigin : tDest,
        mode: tMode,
        carrier: tCarrierFilter,
        vehicleType: tVehicleType,
        brand: tBrandFilter,
      });
      const res = await fetch(`/api/v1/services/transport/offers?${qs.toString()}`, { cache: "no-store" });
      if (res.ok) {
        const data: CorridorQueryResult = await res.json();
        setCorridorData(data);
      }
    } finally {
      setLoadingOffers(false);
    }
  };

  useEffect(() => {
    loadCorridorOffers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tOrigin, tDest, tMode, tCarrierFilter, tVehicleType, tBrandFilter]);

  const runLiveVerification = async () => {
    setVerifyingLive(true);
    setWatchdogMsg(null);
    try {
      const res = await fetch("/api/v1/services/transport/offers", { method: "POST" });
      if (res.ok) {
        const report = await res.json();
        const upCount = (report.portals || []).filter((p: { reachable: boolean }) => p.reachable).length;
        setWatchdogMsg(
          `Watchdog: ${report.activeCount} active · ${report.soldOutCount} sold-out hidden · ${report.prunedCount} removed · ${upCount}/${(report.portals || []).length} portals online`
        );
        await loadCorridorOffers();
      }
    } finally {
      setVerifyingLive(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: 28, paddingBottom: 48 }}>
      <div className="card card-body brand-zellige" style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span className="badge badge-primary" style={{ gap: 5 }}>
              <LayoutGrid size={13} /> {tr("navServices")}
            </span>
            <span className="badge badge-success" style={{ gap: 4 }}>
              <ShieldCheck size={13} /> {tr("verifiedOfficialLabel")}
            </span>
          </div>
          <h1 style={{ margin: "8px 0 4px", fontSize: "1.6rem" }}>{tr("servicesTitle")}</h1>
          <p style={{ color: "var(--text-muted)", margin: 0 }}>{tr("servicesSubtitle")}</p>
        </div>
        <BrandLogo size="md" showArabic={false} />
      </div>

      <div className="tabs">
        <button type="button" className={`tab-btn ${tab === "all" ? "active" : ""}`} onClick={() => switchTab("all")}>
          <LayoutGrid size={16} />
          <span>{tr("allCategories")}</span>
        </button>
        <button type="button" className={`tab-btn ${tab === "transport" ? "active" : ""}`} onClick={() => switchTab("transport")}>
          <Train size={16} />
          <span>{tr("transportTab")}</span>
        </button>
        <button type="button" className={`tab-btn ${tab === "flights" ? "active" : ""}`} onClick={() => switchTab("flights")}>
          <Plane size={16} />
          <span>{tr("flightsTab")}</span>
        </button>
        <button type="button" className={`tab-btn ${tab === "esim" ? "active" : ""}`} onClick={() => switchTab("esim")}>
          <Wifi size={16} />
          <span>{tr("esimTab")}</span>
        </button>
        <button type="button" className={`tab-btn ${tab === "guide" ? "active" : ""}`} onClick={() => switchTab("guide")}>
          <ShieldAlert size={16} />
          <span>{tr("guideTab")}</span>
        </button>
      </div>

      {/* TAB 0: ALL SERVICES ORGANIZED DIRECTORY */}
      {tab === "all" && (
        <ServicesDirectory
          onSelectTab={(nextTab) => {
            switchTab(nextTab);
            if (typeof window !== "undefined") {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
        />
      )}

      {/* TAB 1: TRANSPORT (MARHABA Smart Mobility: ONCF / CTM / Supratours & Regional Coaches) */}
      {tab === "transport" && (
        <TransportBusExperience
          tOrigin={tOrigin}
          setTOrigin={setTOrigin}
          tDest={tDest}
          setTDest={setTDest}
          tDate={tDate}
          setTDate={setTDate}
          tPax={tPax}
          setTPax={setTPax}
          tPhone={tPhone}
          setTPhone={setTPhone}
          tMode={tMode}
          setTMode={setTMode}
          tVehicleType={tVehicleType}
          setTVehicleType={setTVehicleType}
          tCarrierFilter={tCarrierFilter}
          setTCarrierFilter={setTCarrierFilter}
          tBrandFilter={tBrandFilter}
          setTBrandFilter={setTBrandFilter}
          tSort={tSort}
          setTSort={setTSort}
          tSeatClass={tSeatClass}
          setTSeatClass={setTSeatClass}
          corridorData={corridorData}
          loadingOffers={loadingOffers}
          verifyingLive={verifyingLive}
          watchdogMsg={watchdogMsg}
          onRunLiveVerify={runLiveVerification}
          onReloadHistory={loadHistories}
          transHistory={transHistory}
        />
      )}

      {/* TAB 2: FLIGHTS (MARHABA Sky & Air Mobility Hub) */}
      {tab === "flights" && (
        <FlightsExperience
          flightHistory={flightHistory}
          onReloadHistory={loadHistories}
        />
      )}

      {/* TAB 3: eSIM & TELECOM (Maroc Telecom / Orange / inwi) */}
      {tab === "esim" && (
        <EsimExperience
          esimHistory={esimHistory}
          onReloadHistory={loadHistories}
        />
      )}

      {/* TAB 4: TRAVEL GUIDE & SOS (VisitMorocco, Office des Changes, ONDA, ONCF) */}
      {tab === "guide" && (
        <div style={{ display: "grid", gap: 18 }}>
          <div className="grid-2">
            {/* Click-to-call SOS Emergency Numbers */}
            <div className="card card-body" style={{ display: "grid", gap: 12, borderTop: "3px solid var(--danger)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8, color: "var(--danger)" }}>
                  <PhoneCall size={18} /> {tr("sosTitle")}
                </h3>
                <span className="badge badge-danger" dir="ltr">24/7 SOS</span>
              </div>

              <div className="guide-sos-grid">
                {[
                  {
                    num: "19",
                    label: isAr ? "الشرطة (المدن)" : isFr ? "Police (Villes)" : "Police (Cities)",
                  },
                  {
                    num: "177",
                    label: isAr ? "الدرك الملكي (الطرق)" : isFr ? "Gendarmerie Royale" : "Royal Gendarmerie",
                  },
                  {
                    num: "15",
                    label: isAr ? "الإسعاف والوقاية المدنية" : isFr ? "SAMU & Pompiers (15/150)" : "SAMU Medical & Fire",
                  },
                  {
                    num: "112",
                    label: isAr ? "طوارئ الهاتف المحمول" : isFr ? "Urgence GSM Universelle" : "Universal GSM SOS",
                  },
                  {
                    num: "2255",
                    label: isAr ? "خدمة قطارات ONCF" : isFr ? "Service Client ONCF" : "ONCF Rail Hotline",
                  },
                  {
                    num: "0890000800",
                    display: "08 90 00 08 00",
                    label: isAr ? "مطارات المغرب ONDA" : isFr ? "Aéroports ONDA" : "ONDA Airports Info",
                  },
                ].map((sos) => (
                  <a key={sos.num} href={`tel:${sos.num}`} className="guide-sos-item">
                    <span style={{ fontSize: "0.83rem", fontWeight: 600, color: "var(--text)" }}>{sos.label}</span>
                    <span className="badge badge-primary" dir="ltr" style={{ fontWeight: 800 }}>
                      {sos.display || sos.num}
                    </span>
                  </a>
                ))}
              </div>
            </div>

            {/* Interactive MAD Currency & Tipping Calculator */}
            <div className="card card-body" style={{ display: "grid", gap: 10, borderTop: "3px solid var(--primary)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <CreditCard size={18} color="var(--primary)" /> {tr("currencyCalcTitle")}
                </h3>
                <span className="badge badge-primary" dir="ltr">MAD</span>
              </div>

              <div dir="ltr" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[100, 500, 1000, 2000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={`marhaba-quiet-chip ${madAmount === preset ? "active" : ""}`}
                    onClick={() => setMadAmount(preset)}
                  >
                    {preset} MAD
                  </button>
                ))}
              </div>

              <input
                type="number"
                min={0}
                step={50}
                className="input"
                value={madAmount}
                onChange={(e) => setMadAmount(Math.max(0, Number(e.target.value) || 0))}
              />

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }} dir="ltr">
                <span className="badge badge-primary">≈ {(madAmount * 0.092).toFixed(2)} EUR</span>
                <span className="badge badge-gold">≈ {(madAmount * 0.1).toFixed(2)} USD</span>
                <span className="badge badge-success">≈ {(madAmount * 0.079).toFixed(2)} GBP</span>
                <span className="badge badge-muted">≈ {(madAmount * 0.375).toFixed(0)} SAR</span>
                <span className="badge badge-muted">
                  {isAr ? "إكرامية 10%:" : isFr ? "Pourboire 10% :" : "10% Tip:"} {Math.round(madAmount * 0.1)} MAD
                </span>
              </div>

              <p style={{ color: "var(--text-muted)", fontSize: "0.83rem", margin: 0, lineHeight: 1.55 }}>
                {isAr
                  ? "مكتب الصرف (oc.gov.ma): الحد الأقصى لحمل الدرهم نقداً عند الدخول أو المغادرة هو 2,000 درهم. احتفظ بوصل الصرف (bordereau de change) لإعادة تحويل الدرهم المتبقي بالمطار."
                  : isFr
                  ? "Office des Changes (oc.gov.ma) : le Dirham marocain est limité à 2 000 MAD en espèces à l’entrée/sortie. Conservez votre bordereau de change pour reconvertir au départ."
                  : "Office des Changes (oc.gov.ma): Moroccan Dirham (MAD) cash import/export is capped at 2,000 MAD. Keep bank exchange receipts (bordereau de change) to reconvert at departure."}
              </p>
            </div>

            {/* Visa, Health & Etiquette */}
            <div className="card card-body" style={{ display: "grid", gap: 10 }}>
              <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle size={18} color="var(--gold-dark)" /> {tr("visaHealthTitle")}
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.87rem", margin: 0, lineHeight: 1.6 }}>
                {isAr
                  ? "إعفاء من التأشيرة لمدة تصل إلى 90 يوماً لمواطني الاتحاد الأوروبي والمملكة المتحدة والولايات المتحدة وكندا وأستراليا ودول الخليج (جواز سفر ساري المفعول). القابس الكهربائي في المغرب: Type C / E (220V)."
                  : isFr
                  ? "Entrée sans visa jusqu’à 90 jours pour UE, Royaume-Uni, USA, Canada, Australie et pays du Golfe (passeport valide). Prises électriques au Maroc : Type C & E (220V / 50Hz)."
                  : "Up to 90 days visa-free entry for EU, UK, US, Canada, Australia & GCC passports (valid throughout stay). Power sockets in Morocco: Type C & E (220V / 50Hz)."}
              </p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }} dir="ltr">
                <span className="badge badge-success">90 Days Visa-Free</span>
                <span className="badge badge-muted">220V · Type C / E</span>
                <span className="badge badge-muted">GMT+1</span>
              </div>
            </div>

            {/* Airport Transfers & ONCF Rail */}
            <div className="card card-body" style={{ display: "grid", gap: 10 }}>
              <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <Luggage size={18} color="var(--primary)" /> {tr("airportTransfersTitle")}
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.87rem", margin: 0, lineHeight: 1.6 }}>
                {isAr
                  ? "محطة قطار ONCF مباشرة داخل مطار محمد الخامس CMN (30 دقيقة إلى الدار البيضاء)، وحافلات سريعة في RAK وRBA وTNG وAGA وFEZ، ورحلات داخلية نحو العيون EUN والداخلة VIL."
                  : isFr
                  ? "Gare ONCF directe au terminal CMN Mohammed V (30 min vers Casablanca), navettes express à RAK, RBA, TNG, AGA, FEZ et vols intérieurs vers Laâyoune (EUN) & Dakhla (VIL)."
                  : "Direct ONCF rail link inside CMN Mohammed V Terminal (30m to Casablanca); express shuttles at RAK, RBA, TNG, AGA, FEZ; domestic links to Laâyoune (EUN) & Dakhla (VIL)."}
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="btn btn-sm btn-primary" onClick={() => switchTab("transport")}>
                  <Train size={14} /> {tr("intracityTransferBtn")}
                </button>
                <button type="button" className="btn btn-sm btn-outline" onClick={() => switchTab("esim")}>
                  <Wifi size={14} /> {tr("esimTab")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<WorkspacePageSkeleton />}>
      <ServicesContent />
    </Suspense>
  );
}
