"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Building2, CalendarDays, CreditCard, LayoutDashboard, RefreshCw, Sliders, Tag } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { BrandLogo } from "@/components/BrandLogo";
import { BrandSelect } from "@/components/BrandSelect";
import { BrandDateRangePicker } from "@/components/BrandDateRangePicker";
import { WorkspacePageSkeleton } from "@/components/BrandSkeletons";
import { MOROCCO_CITY_SELECT_OPTIONS } from "@/lib/morocco-cities";

export default function PartnerPortalPage() {
  const { lang, tr, user, loadingUser, openAuthModal, activateDemoAccount, activatingDemo, money, refreshUser } = useApp();
  const isAr = lang === "ar";
  const isFr = lang === "fr";

  const [tab, setTab] = useState("overview");
  const [overview, setOverview] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [pricingRules, setPricingRules] = useState<any[]>([]);
  const [payoutData, setPayoutData] = useState<any>(null);
  const [channelsData, setChannelsData] = useState<any>(null);
  const [calendarData, setCalendarData] = useState<any>(null);
  const [feedback, setFeedback] = useState("");
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const [bizName, setBizName] = useState("");
  const [bizCity, setBizCity] = useState("Marrakech");
  const [bizIce, setBizIce] = useState("");
  const [bizRib, setBizRib] = useState("");

  const [pTitle, setPTitle] = useState("");
  const [pCity, setPCity] = useState("Marrakech");
  const [pAddress, setPAddress] = useState("Medina Quarter");
  const [pCategory, setPCategory] = useState("riad");
  const [pPrice, setPPrice] = useState("950");
  const [pDesc, setPDesc] = useState("");
  const [pRoomName, setPRoomName] = useState("Standard Suite");
  const [pUnits, setPUnits] = useState("4");

  const [calRoomId, setCalRoomId] = useState("");
  const [calStart, setCalStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [calEnd, setCalEnd] = useState(() => new Date(Date.now() + 14 * 86400_000).toISOString().slice(0, 10));
  const [calBlocked, setCalBlocked] = useState(false);
  const [calPriceOverride, setCalPriceOverride] = useState("");
  const [calMinStay, setCalMinStay] = useState("1");

  const [prPropId, setPrPropId] = useState("");
  const [prName, setPrName] = useState("");
  const [prType, setPrType] = useState("seasonal");
  const [prAdj, setPrAdj] = useState("20");
  const [prStart, setPrStart] = useState("2026-12-15");
  const [prEnd, setPrEnd] = useState("2027-01-05");

  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutNotes, setPayoutNotes] = useState("");

  const [chPropId, setChPropId] = useState("");
  const [chProvider, setChProvider] = useState("ical");
  const [chImportUrl, setChImportUrl] = useState("");

  const loadAll = useCallback(async () => {
    if (!user) return;
    const ovRes = await fetch("/api/v1/partner/overview", { cache: "no-store" });
    if (ovRes.status === 403 || ovRes.status === 404) {
      setNeedsOnboarding(true);
      return;
    }
    setNeedsOnboarding(false);
    const ov = await ovRes.json();
    setOverview(ov);

    const [pRes, resRes, prRes, payRes, chRes] = await Promise.all([
      fetch("/api/v1/partner/properties", { cache: "no-store" }),
      fetch("/api/v1/partner/reservations", { cache: "no-store" }),
      fetch("/api/v1/partner/pricing-rules", { cache: "no-store" }),
      fetch("/api/v1/partner/payouts", { cache: "no-store" }),
      fetch("/api/v1/partner/channels", { cache: "no-store" }),
    ]);
    if (pRes.ok) {
      const pd = await pRes.json();
      const props = pd.properties || [];
      setProperties(props);
      if (props[0]) {
        if (!prPropId) setPrPropId(String(props[0].id));
        if (!chPropId) setChPropId(String(props[0].id));
        if (!calRoomId && props[0].rooms?.[0]) setCalRoomId(String(props[0].rooms[0].id));
      }
    }
    if (resRes.ok) setReservations((await resRes.json()).reservations || []);
    if (prRes.ok) setPricingRules((await prRes.json()).rules || []);
    if (payRes.ok) setPayoutData(await payRes.json());
    if (chRes.ok) setChannelsData(await chRes.json());
  }, [user, prPropId, chPropId, calRoomId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const loadCalendar = useCallback(async () => {
    if (!calRoomId) return;
    const res = await fetch(`/api/v1/partner/calendar?roomTypeId=${calRoomId}&startDate=${calStart}&days=21`, {
      cache: "no-store",
    });
    if (res.ok) setCalendarData(await res.json());
  }, [calRoomId, calStart]);

  useEffect(() => {
    if (tab === "calendar") loadCalendar();
  }, [tab, loadCalendar]);

  async function onboardPartner(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/v1/partner/overview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessName: bizName, city: bizCity, taxIdIce: bizIce, ribIban: bizRib }),
    });
    const d = await res.json();
    if (res.ok) {
      setFeedback("Partner account created! Pending admin KYC verification.");
      await refreshUser();
      loadAll();
    } else {
      setFeedback(d.error || "Failed to register partner");
    }
  }

  async function createProperty(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/v1/partner/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: pTitle,
        city: pCity,
        address: pAddress,
        category: pCategory,
        basePriceMad: Number(pPrice),
        description: pDesc,
        roomName: pRoomName,
        totalUnits: Number(pUnits),
      }),
    });
    const d = await res.json();
    if (res.ok) {
      setPTitle("");
      setPDesc("");
      setFeedback("Property submitted! Status: pending_approval (ready for Admin verification).");
      loadAll();
    } else {
      setFeedback(d.error || "Failed");
    }
  }

  async function saveCalendarBulk(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/v1/partner/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomTypeId: Number(calRoomId),
        startDate: calStart,
        endDate: calEnd,
        isBlackout: calBlocked,
        priceOverrideMad: calPriceOverride ? Number(calPriceOverride) : null,
        minStay: Number(calMinStay || 1),
      }),
    });
    if (res.ok) {
      setFeedback("Inventory calendar updated!");
      loadCalendar();
    }
  }

  async function createPricingRule(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/v1/partner/pricing-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId: Number(prPropId),
        name: prName,
        ruleType: prType,
        adjustmentPct: Number(prAdj),
        startDate: prStart,
        endDate: prEnd,
      }),
    });
    if (res.ok) {
      setPrName("");
      setFeedback("Dynamic pricing rule saved!");
      loadAll();
    }
  }

  async function updateReservation(bookingId: number, action: string) {
    const res = await fetch("/api/v1/partner/reservations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, action }),
    });
    if (res.ok) {
      setFeedback(`Reservation ${action} applied.`);
      loadAll();
    }
  }

  async function requestPayout(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/v1/partner/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountMad: Number(payoutAmount), notes: payoutNotes }),
    });
    const d = await res.json();
    if (res.ok) {
      setPayoutAmount("");
      setPayoutNotes("");
      setFeedback("Payout request submitted for Admin Finance approval.");
      loadAll();
    } else {
      setFeedback(d.error || "Failed");
    }
  }

  async function addChannel(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/v1/partner/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId: Number(chPropId), provider: chProvider, icalImportUrl: chImportUrl }),
    });
    if (res.ok) {
      setChImportUrl("");
      setFeedback("Channel integration & iCal export token created!");
      loadAll();
    }
  }

  async function triggerSync(integrationId: number) {
    const res = await fetch("/api/v1/partner/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sync_now", integrationId }),
    });
    const d = await res.json();
    if (res.ok) {
      setFeedback(d.message || "Sync logged.");
      loadAll();
    }
  }

  if (loadingUser) return <WorkspacePageSkeleton />;

  if (!user) {
    return (
      <div className="container" style={{ padding: 48, textAlign: "center" }}>
        <div className="card" style={{ maxWidth: 540, marginInline: "auto" }}>
          <div className="card-body" style={{ padding: 32, display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0 }}>{isAr ? "بوابة شركاء MARHABA" : isFr ? "Portail Partenaires MARHABA" : "MARHABA Hotel Partner Portal"}</h2>
            <p style={{ color: "var(--text-muted)", margin: 0 }}>
              {isAr
                ? "فعّل حساب الشريك التجريبي بنقرة واحدة أو سجّل الدخول لإدارة العقارات والغرف والمدفوعات."
                : isFr
                ? "Activez le compte partenaire démo en 1 clic ou connectez-vous pour gérer vos établissements, stocks et versements."
                : "Activate the verified Partner demo account in 1 click or sign in to list properties, manage room inventory, and track payouts."}
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
              <button type="button" className="btn btn-primary" disabled={!!activatingDemo} onClick={() => activateDemoAccount("partner")}>
                {activatingDemo === "partner" ? (isAr ? "جاري التفعيل..." : isFr ? "Activation..." : "Activating...") : isAr ? "تفعيل حساب الشريك التجريبي" : isFr ? "Activer Démo Partenaire" : "Activate Partner Demo"}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => openAuthModal("login")}>
                {isAr ? "تسجيل الدخول / حساب شريك" : isFr ? "Connexion / Inscription Partenaire" : "Sign In / Partner Registration"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (needsOnboarding) {
    return (
      <div className="container" style={{ padding: 40, maxWidth: 580 }}>
        <div className="card">
          <div className="card-body">
            <h1 style={{ margin: "0 0 8px", color: "var(--text)" }}>{isAr ? "انضم كشريك في MARHABA" : isFr ? "Devenir Partenaire MARHABA" : "Become a MARHABA Hospitality Partner"}</h1>
            <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>
              {isAr
                ? "سجّل فندقك أو رياضك أو مخيمك الصحراوي أو وكالة السيارات للوصول لإدارة الحجوزات والمدفوعات."
                : isFr
                ? "Enregistrez votre hôtel, riad, campement, agence de location ou d’excursions pour accéder à l’inventaire et aux paiements."
                : "Register your hotel, riad, desert camp, car rental fleet, or tour agency to access inventory, pricing rules, and payouts."}
            </p>
            {feedback && <div className="badge badge-primary" style={{ marginBottom: 12 }}>{feedback}</div>}
            <form onSubmit={onboardPartner} style={{ display: "grid", gap: 12 }}>
              <input className="input" placeholder={isAr ? "الاسم التجاري للمؤسسة" : isFr ? "Raison sociale de l’entreprise" : "Business Legal Name"} value={bizName} onChange={(e) => setBizName(e.target.value)} required />
              <input className="input" placeholder={isAr ? "المدينة" : isFr ? "Ville" : "City"} value={bizCity} onChange={(e) => setBizCity(e.target.value)} required />
              <input className="input" placeholder={isAr ? "التعريف الموحد للمقاولة ICE" : isFr ? "Identifiant Commun (ICE / IF)" : "ICE / Tax ID (Morocco)"} value={bizIce} onChange={(e) => setBizIce(e.target.value)} />
              <input className="input" placeholder={isAr ? "رقم الحساب البنكي RIB / IBAN" : isFr ? "RIB bancaire / IBAN (pour virements)" : "Bank RIB / IBAN (for payouts)"} value={bizRib} onChange={(e) => setBizRib(e.target.value)} />
              <button type="submit" className="btn btn-primary">
                {isAr ? "تسجيل مساحة الشريك" : isFr ? "Créer l’espace partenaire" : "Register Partner Workspace"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const allRooms = properties.flatMap((p) => (p.rooms || []).map((r: any) => ({ ...r, propTitle: p.title })));

  return (
    <div className="container" style={{ paddingTop: 26, paddingBottom: 48 }}>
      <div className="card card-body brand-zellige" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <BrandLogo size="sm" showArabic={false} />
          <div>
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--text)" }}>
              {tr("partnerTitle")} · {overview?.partner?.business_name || ""}
            </h1>
            <div style={{ fontSize: "0.84rem", color: "var(--text-muted)", marginTop: 2 }}>{tr("partnerSubtitle")}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <span className={`badge ${overview?.partner?.verification_status === "verified" ? "badge-success" : "badge-warning"}`}>
                {overview?.partner?.verification_status === "verified" ? tr("verifiedPartner") : tr("verificationPending")}
              </span>
              <span className="badge badge-muted">{overview?.partner?.city}</span>
            </div>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="badge badge-primary" style={{ display: "block", padding: "10px 14px", borderRadius: 10, marginBottom: 16 }}>
          {feedback}
        </div>
      )}

      <div className="tabs">
        {[
          { id: "overview", label: tr("partnerOverview"), icon: LayoutDashboard },
          { id: "properties", label: `${tr("partnerListings")} (${properties.length})`, icon: Building2 },
          { id: "calendar", label: tr("partnerCalendar"), icon: CalendarDays },
          { id: "pricing", label: isAr ? "التسعير الديناميكي" : isFr ? "Tarifs dynamiques" : "Dynamic Pricing", icon: Tag },
          { id: "reservations", label: `${tr("partnerReservations")} (${reservations.length})`, icon: Sliders },
          { id: "payouts", label: tr("partnerPayouts"), icon: CreditCard },
          { id: "channels", label: isAr ? "القنوات و iCal" : isFr ? "Canaux & iCal" : "Channel & iCal", icon: RefreshCw },
        ].map((tItem) => (
          <button key={tItem.id} type="button" className={`tab-btn ${tab === tItem.id ? "active" : ""}`} onClick={() => setTab(tItem.id)}>
            <tItem.icon size={15} />
            <span>{tItem.label}</span>
          </button>
        ))}
      </div>

      {tab === "overview" && overview && (
        <div style={{ display: "grid", gap: 20 }}>
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-label">{isAr ? "العقارات / الوحدات" : isFr ? "Établissements / Unités" : "Properties / Units"}</div>
              <div className="kpi-value">{overview.propertyCount || 0} / {overview.totalUnits || 0}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">{isAr ? "الحجوزات المؤكدة" : isFr ? "Réservations confirmées" : "Confirmed Bookings"}</div>
              <div className="kpi-value">{overview.stats?.confirmed_bookings || 0}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">{isAr ? "إجمالي المبيعات" : isFr ? "Revenu brut" : "Gross Revenue"}</div>
              <div className="kpi-value">{money(overview.stats?.gross_revenue_mad || 0)}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">{isAr ? "صافي أرباح الشريك" : isFr ? "Revenu net partenaire" : "Net Partner Earnings"}</div>
              <div className="kpi-value" style={{ color: "var(--success)" }}>{money(overview.stats?.net_revenue_mad || 0)}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">{isAr ? "الرصيد المتاح للسحب" : isFr ? "Solde disponible" : "Available Balance"}</div>
              <div className="kpi-value" style={{ color: "var(--primary)" }}>{money(overview.payableSummary?.available_balance_mad || 0)}</div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h3 style={{ margin: "0 0 12px" }}>Upcoming Arrivals</h3>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Ref</th>
                      <th>Property</th>
                      <th>Guest</th>
                      <th>Dates</th>
                      <th>Status</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(overview.upcomingArrivals || []).map((b: any) => (
                      <tr key={b.id}>
                        <td><strong>{b.booking_ref}</strong></td>
                        <td>{b.property_title}</td>
                        <td>{b.guest_name}</td>
                        <td>{b.check_in} → {b.check_out}</td>
                        <td><span className="badge badge-muted">{b.status}</span></td>
                        <td>{money(b.total_mad)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "properties" && (
        <div className="grid-2">
          <div className="card">
            <div className="card-body">
              <h3 style={{ margin: "0 0 12px" }}>Add New Property & Initial Room</h3>
              <form onSubmit={createProperty} style={{ display: "grid", gap: 10 }}>
                <input className="input" placeholder="Property Title" value={pTitle} onChange={(e) => setPTitle(e.target.value)} required minLength={3} />
                <div className="grid-2" style={{ gap: 8 }}>
                  <BrandSelect
                    value={pCity}
                    ariaLabel="Property City"
                    onChange={setPCity}
                    options={MOROCCO_CITY_SELECT_OPTIONS}
                  />
                  <input className="input" placeholder="Street / Medina Address" value={pAddress} onChange={(e) => setPAddress(e.target.value)} required />
                </div>
                <div className="grid-2" style={{ gap: 8 }}>
                  <BrandSelect
                    value={pCategory}
                    ariaLabel="Property Category"
                    onChange={setPCategory}
                    options={[
                      { value: "riad", label: "Riad" },
                      { value: "hotel", label: "Hotel" },
                      { value: "resort", label: "Resort" },
                      { value: "villa", label: "Villa" },
                      { value: "apartment", label: "Apartment" },
                      { value: "car", label: "Car Rental" },
                      { value: "experience", label: "Experience" },
                      { value: "restaurant", label: "Restaurant" },
                    ]}
                  />
                  <input className="input" type="number" placeholder="Base MAD/night" value={pPrice} onChange={(e) => setPPrice(e.target.value)} required />
                </div>
                <div className="grid-2" style={{ gap: 8 }}>
                  <input className="input" placeholder="Initial Room Category" value={pRoomName} onChange={(e) => setPRoomName(e.target.value)} required />
                  <input className="input" type="number" placeholder="Total Units" value={pUnits} onChange={(e) => setPUnits(e.target.value)} required />
                </div>
                <textarea className="textarea" rows={3} placeholder="Description (min 10 chars)" value={pDesc} onChange={(e) => setPDesc(e.target.value)} required minLength={10} />
                <button type="submit" className="btn btn-primary">
                  Submit Property for Approval
                </button>
              </form>
            </div>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {properties.map((p) => (
              <div key={p.id} className="card">
                <div className="card-body">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong>{p.title}</strong>
                    <span className={`badge ${p.status === "active" ? "badge-success" : "badge-warning"}`}>{p.status}</span>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 8 }}>
                    {p.city} · {p.category} · Base {money(p.base_price_mad)}
                  </div>
                  <div style={{ fontSize: "0.82rem", display: "grid", gap: 4 }}>
                    {(p.rooms || []).map((r: any) => (
                      <div key={r.id} style={{ padding: "6px 8px", background: "var(--surface-muted)", borderRadius: 8 }}>
                        {r.name} — {r.total_units} units @ {money(r.base_price_mad)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "calendar" && (
        <div style={{ display: "grid", gap: 16 }}>
          <div className="card">
            <div className="card-body">
              <h3 style={{ margin: "0 0 12px" }}>Bulk Availability, Blackout & Rate Overrides</h3>
              <form onSubmit={saveCalendarBulk} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, alignItems: "end" }}>
                <div>
                  <label className="field-label">Room Category</label>
                  <BrandSelect
                    value={calRoomId}
                    ariaLabel="Room Category"
                    onChange={setCalRoomId}
                    options={allRooms.map((r: any) => ({ value: String(r.id), label: `${r.propTitle} — ${r.name}` }))}
                  />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <BrandDateRangePicker
                    mode="range"
                    startDate={calStart}
                    endDate={calEnd}
                    onChangeStart={setCalStart}
                    onChangeEnd={setCalEnd}
                    startLabel="From"
                    endLabel="To"
                  />
                </div>
                <div>
                  <label className="field-label">Rate Override (MAD)</label>
                  <input className="input" type="number" placeholder="Optional" value={calPriceOverride} onChange={(e) => setCalPriceOverride(e.target.value)} />
                </div>
                <div>
                  <label className="field-label">Min Stay</label>
                  <input className="input" type="number" min={1} value={calMinStay} onChange={(e) => setCalMinStay(e.target.value)} />
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 6, paddingBottom: 8 }}>
                  <input type="checkbox" checked={calBlocked} onChange={(e) => setCalBlocked(e.target.checked)} />
                  <span>Blackout / Block</span>
                </label>
                <button type="submit" className="btn btn-primary">
                  Apply Range
                </button>
              </form>
            </div>
          </div>

          {calendarData && (
            <div className="card">
              <div className="card-body">
                <h4 style={{ margin: "0 0 10px" }}>Daily Inventory Grid ({calendarData.room?.name})</h4>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Booked</th>
                        <th>Remaining</th>
                        <th>Rate</th>
                        <th>Min Stay</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(calendarData.calendar || []).map((d: any) => (
                        <tr key={d.date}>
                          <td>{d.date}</td>
                          <td>{d.bookedUnits}</td>
                          <td>{d.remainingUnits}</td>
                          <td>{money(d.priceMad)}</td>
                          <td>{d.minStay}</td>
                          <td>
                            <span className={`badge ${d.isBlackout ? "badge-danger" : d.remainingUnits > 0 ? "badge-success" : "badge-warning"}`}>
                              {d.isBlackout ? "Blackout" : d.remainingUnits > 0 ? "Open" : "Sold Out"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "pricing" && (
        <div className="grid-2">
          <div className="card">
            <div className="card-body">
              <h3 style={{ margin: "0 0 12px" }}>Create Dynamic Pricing Rule</h3>
              <form onSubmit={createPricingRule} style={{ display: "grid", gap: 10 }}>
                <BrandSelect
                  value={prPropId}
                  ariaLabel="Select property"
                  onChange={setPrPropId}
                  options={properties.map((p) => ({ value: String(p.id), label: p.title }))}
                />
                <input className="input" placeholder="Rule Name (e.g. New Year Peak +25%)" value={prName} onChange={(e) => setPrName(e.target.value)} required />
                <div className="grid-2" style={{ gap: 8 }}>
                  <BrandSelect
                    value={prType}
                    ariaLabel="Pricing Rule Type"
                    onChange={setPrType}
                    options={[
                      { value: "seasonal", label: "Seasonal Peak" },
                      { value: "weekend", label: "Weekend Surge" },
                      { value: "holiday", label: "Holiday" },
                      { value: "long_stay", label: "Long Stay Discount" },
                      { value: "early_bird", label: "Early Bird Discount" },
                      { value: "last_minute", label: "Last Minute" },
                    ]}
                  />
                  <input className="input" type="number" placeholder="Adjustment % (e.g. 20 or -15)" value={prAdj} onChange={(e) => setPrAdj(e.target.value)} required />
                </div>
                <BrandDateRangePicker
                  mode="range"
                  startDate={prStart}
                  endDate={prEnd}
                  onChangeStart={setPrStart}
                  onChangeEnd={setPrEnd}
                  startLabel="Rule Start"
                  endLabel="Rule End"
                />
                <button type="submit" className="btn btn-primary">
                  Save Pricing Rule
                </button>
              </form>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h3 style={{ margin: "0 0 12px" }}>Active Pricing Rules</h3>
              <div style={{ display: "grid", gap: 8 }}>
                {pricingRules.map((r) => (
                  <div key={r.id} style={{ padding: 10, border: "1px solid var(--border)", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong>{r.name}</strong> ({r.property_title})
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        {r.rule_type} · {r.adjustment_pct > 0 ? `+${r.adjustment_pct}%` : `${r.adjustment_pct}%`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "reservations" && (
        <div className="card">
          <div className="card-body">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>All Property Reservations</h3>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => {
                  const rows = [
                    ["Ref", "Property", "Room", "Guest", "Email", "CheckIn", "CheckOut", "NetMAD", "Status"],
                    ...reservations.map((b) => [
                      b.booking_ref,
                      b.property_title,
                      b.room_name,
                      b.guest_name,
                      b.guest_email,
                      b.check_in,
                      b.check_out,
                      String(b.partner_net_mad),
                      b.status,
                    ]),
                  ];
                  const csv = rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "marhaba-partner-reservations.csv";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Export CSV
              </button>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Ref</th>
                    <th>Property / Room</th>
                    <th>Guest</th>
                    <th>Dates</th>
                    <th>Net Payout</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((b) => (
                    <tr key={b.id}>
                      <td><strong>{b.booking_ref}</strong></td>
                      <td>{b.property_title}<br /><small>{b.room_name}</small></td>
                      <td>{b.guest_name}<br /><small>{b.guest_email}</small></td>
                      <td>{b.check_in} → {b.check_out}</td>
                      <td>{money(b.partner_net_mad)}</td>
                      <td><span className="badge badge-muted">{b.status}</span></td>
                      <td style={{ display: "flex", gap: 6 }}>
                        {b.status === "pending" && (
                          <button type="button" className="btn btn-sm btn-primary" onClick={() => updateReservation(b.id, "confirm")}>
                            Confirm
                          </button>
                        )}
                        {b.status === "confirmed" && (
                          <button type="button" className="btn btn-sm btn-outline" onClick={() => updateReservation(b.id, "complete")}>
                            Complete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "payouts" && payoutData && (
        <div className="grid-2">
          <div className="card">
            <div className="card-body">
              <h3 style={{ margin: "0 0 10px" }}>Request Payout</h3>
              <p style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>
                Eligible Balance: <strong>{money(payoutData.eligibleBalanceMad || 0)}</strong>
              </p>
              <form onSubmit={requestPayout} style={{ display: "grid", gap: 10 }}>
                <input className="input" type="number" min={100} placeholder="Amount (min 100 MAD)" value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)} required />
                <input className="input" placeholder="Payout Note (optional)" value={payoutNotes} onChange={(e) => setPayoutNotes(e.target.value)} />
                <button type="submit" className="btn btn-primary">
                  Submit Payout Request
                </button>
              </form>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h3 style={{ margin: "0 0 10px" }}>Payout History</h3>
              <div style={{ display: "grid", gap: 8 }}>
                {(payoutData.payouts || []).map((po: any) => (
                  <div key={po.id} style={{ padding: 10, border: "1px solid var(--border)", borderRadius: 10, display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <strong>{money(po.amount_mad)}</strong>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{po.notes || po.created_at}</div>
                    </div>
                    <span className="badge badge-muted">{po.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "channels" && channelsData && (
        <div className="grid-2">
          <div className="card">
            <div className="card-body">
              <h3 style={{ margin: "0 0 12px" }}>Connect Channel / iCal Sync</h3>
              <form onSubmit={addChannel} style={{ display: "grid", gap: 10 }}>
                <BrandSelect
                  value={chPropId}
                  ariaLabel="Select Property"
                  onChange={setChPropId}
                  options={properties.map((p) => ({ value: String(p.id), label: p.title }))}
                />
                <BrandSelect
                  value={chProvider}
                  ariaLabel="Channel Provider"
                  onChange={setChProvider}
                  options={[
                    { value: "ical", label: "Standard iCal Feed (.ics)" },
                    { value: "siteminder", label: "SiteMinder Channel Manager" },
                    { value: "cloudbeds", label: "Cloudbeds PMS" },
                    { value: "beds24", label: "Beds24 PMS" },
                    { value: "hotelbeds", label: "Hotelbeds" },
                  ]}
                />
                <input className="input" placeholder="External iCal Import URL (optional)" value={chImportUrl} onChange={(e) => setChImportUrl(e.target.value)} />
                <button type="submit" className="btn btn-primary">
                  Create Channel Integration
                </button>
              </form>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h3 style={{ margin: "0 0 12px" }}>Active Integrations & Live iCal Exports</h3>
              <div style={{ display: "grid", gap: 10 }}>
                {(channelsData.integrations || []).map((ch: any) => (
                  <div key={ch.id} style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong>{ch.property_title} — {ch.provider}</strong>
                      <button type="button" className="btn btn-sm btn-outline" onClick={() => triggerSync(ch.id)}>
                        <RefreshCw size={13} /> Sync Now
                      </button>
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 6 }}>
                      Export Feed: <a href={`/api/v1/ical/${ch.ical_export_token}`} target="_blank" rel="noreferrer" style={{ color: "var(--primary)" }}>/api/v1/ical/{ch.ical_export_token}</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
