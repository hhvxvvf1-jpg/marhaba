"use client";

import React, { useCallback, useEffect, useState } from "react";
import { BarChart3, Building2, CreditCard, FileCode, Plane, Server, ShieldCheck, Ticket, Users } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { BrandLogo } from "@/components/BrandLogo";
import { BrandSelect } from "@/components/BrandSelect";
import { WorkspacePageSkeleton } from "@/components/BrandSkeletons";
import { getIntegrationReadiness } from "@/lib/providers";

export default function AdminPanelPage() {
  const { lang, user, loadingUser, openAuthModal, money } = useApp();
  const isAr = lang === "ar";
  const isFr = lang === "fr";
  const readiness = getIntegrationReadiness();
  const [tab, setTab] = useState("overview");
  const [overview, setOverview] = useState<any>(null);
  const [usersData, setUsersData] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [finance, setFinance] = useState<any>(null);
  const [cmsData, setCmsData] = useState<any>(null);
  const [travelServices, setTravelServices] = useState<{
    flights: any[];
    transport: any[];
    esims: any[];
    itineraries: any[];
    transportOffers?: any[];
  }>({
    flights: [],
    transport: [],
    esims: [],
    itineraries: [],
    transportOffers: [],
  });
  const [newOffer, setNewOffer] = useState({
    carrierBrand: "MARHABA Express",
    originCity: "Casablanca",
    destinationCity: "Marrakech",
    originStation: "Casablanca Centre",
    destinationStation: "Marrakech Guéliz",
    depTime: "10:00",
    arrTime: "13:00",
    durationMins: 180,
    fareMad: 120,
    seatsLeft: 20,
  });
  const [betaFeedback, setBetaFeedback] = useState<any[]>([]);
  const [feedback, setFeedback] = useState("");
  const [forbidden, setForbidden] = useState(false);

  const [commissionPctInput, setCommissionPctInput] = useState("15");
  const [promoCode, setPromoCode] = useState("");
  const [promoName, setPromoName] = useState("");
  const [promoPct, setPromoPct] = useState("10");

  const loadAll = useCallback(async () => {
    if (!user) return;
    const ovRes = await fetch("/api/v1/admin/overview", { cache: "no-store" });
    if (ovRes.status === 403) {
      setForbidden(true);
      return;
    }
    setForbidden(false);
    setOverview(await ovRes.json());

    const [uRes, pRes, bRes, fRes, cRes, sRes, fbRes] = await Promise.all([
      fetch("/api/v1/admin/users", { cache: "no-store" }),
      fetch("/api/v1/admin/properties", { cache: "no-store" }),
      fetch("/api/v1/admin/bookings", { cache: "no-store" }),
      fetch("/api/v1/admin/finance", { cache: "no-store" }),
      fetch("/api/v1/admin/cms", { cache: "no-store" }),
      fetch("/api/v1/admin/services", { cache: "no-store" }),
      fetch("/api/v1/feedback", { cache: "no-store" }),
    ]);

    if (uRes.ok) setUsersData(await uRes.json());
    if (pRes.ok) setProperties((await pRes.json()).properties || []);
    if (bRes.ok) setBookings((await bRes.json()).bookings || []);
    if (fRes.ok) {
      const fd = await fRes.json();
      setFinance(fd);
      setCommissionPctInput(String(fd.defaultCommissionPct ?? 15));
    }
    if (cRes.ok) setCmsData(await cRes.json());
    if (sRes.ok) setTravelServices(await sRes.json());
    if (fbRes.ok) setBetaFeedback((await fbRes.json()).items || []);
  }, [user]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function updateProperty(propertyId: number, patch: Record<string, unknown>) {
    const res = await fetch("/api/v1/admin/properties", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId, ...patch }),
    });
    if (res.ok) {
      setFeedback(`Property #${propertyId} updated.`);
      loadAll();
    }
  }

  async function updatePartnerVerification(partnerId: number, verificationStatus: string) {
    const res = await fetch("/api/v1/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partnerId, verificationStatus }),
    });
    if (res.ok) {
      setFeedback(`Partner #${partnerId} set to ${verificationStatus}.`);
      loadAll();
    }
  }

  async function updateUserRoleOrStatus(userId: number, patch: Record<string, unknown>) {
    const res = await fetch("/api/v1/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...patch }),
    });
    if (res.ok) {
      setFeedback(`User #${userId} updated.`);
      loadAll();
    }
  }

  async function adminRefundBooking(bookingId: number) {
    const res = await fetch("/api/v1/admin/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, action: "cancel_refund", forceFullRefund: true, reason: "Admin dispute resolution refund" }),
    });
    if (res.ok) {
      setFeedback(`Booking #${bookingId} refunded.`);
      loadAll();
    }
  }

  async function saveCommissionPct(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/v1/admin/finance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_default_commission", commissionPct: Number(commissionPctInput) }),
    });
    if (res.ok) {
      setFeedback(`Global default commission updated to ${commissionPctInput}%.`);
      loadAll();
    }
  }

  async function updatePayoutStatus(payoutId: number, status: string) {
    const res = await fetch("/api/v1/admin/finance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_payout", payoutId, status, bankReference: status === "paid" ? `VIR-${Date.now()}` : undefined }),
    });
    if (res.ok) {
      setFeedback(`Payout #${payoutId} marked ${status}.`);
      loadAll();
    }
  }

  async function createPromo(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/v1/admin/finance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_promotion", code: promoCode, name: promoName, discountPct: Number(promoPct) }),
    });
    if (res.ok) {
      setPromoCode("");
      setPromoName("");
      setFeedback("Promotion created.");
      loadAll();
    }
  }

  async function resolveTicket(ticketId: number, status: string) {
    const res = await fetch("/api/v1/admin/cms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "support_ticket", ticketId, status, adminNotes: `Updated by ${user?.full_name}` }),
    });
    if (res.ok) {
      setFeedback(`Support ticket #${ticketId} updated to ${status}.`);
      loadAll();
    }
  }

  if (loadingUser) return <WorkspacePageSkeleton />;

  if (!user || forbidden) {
    return (
      <div className="container" style={{ padding: 48, textAlign: "center" }}>
        <div className="card" style={{ maxWidth: 500, marginInline: "auto" }}>
          <div className="card-body" style={{ padding: 32 }}>
            <h2>MARHABA Super Admin Control Center</h2>
            <p style={{ color: "var(--text-muted)" }}>Authorized administrator credentials are required to access this workspace.</p>
            <button type="button" className="btn btn-primary" onClick={() => openAuthModal("login")}>
              Sign In as Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 26, paddingBottom: 48 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <BrandLogo size="sm" showArabic={false} />
          <div>
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--text)" }}>MARHABA Super Admin Panel</h1>
            <div style={{ fontSize: "0.86rem", color: "var(--text-muted)" }}>
              Signed in as {user.full_name} ({user.role}) · Sandbox Card Mode:{" "}
              <strong>{overview?.paymentProviders?.sandbox_card?.mode || "sandbox"}</strong>
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
          { id: "overview", label: isAr ? "نظرة عامة" : isFr ? "Vue d’ensemble" : "Overview", icon: BarChart3 },
          { id: "properties", label: `${isAr ? "العقارات" : isFr ? "Établissements" : "Properties"} (${properties.length})`, icon: Building2 },
          { id: "users", label: isAr ? "المستخدمون والشركاء" : isFr ? "Utilisateurs & Partenaires" : "Users & Partners", icon: Users },
          { id: "bookings", label: `${isAr ? "الحجوزات" : isFr ? "Réservations" : "Bookings"} (${bookings.length})`, icon: Ticket },
          { id: "services", label: `${isAr ? "الطيران / النقل / eSIM" : isFr ? "Vols / Train / eSIM" : "Flights/Train/eSIM"} (${travelServices.flights.length + travelServices.transport.length + travelServices.esims.length})`, icon: Plane },
          { id: "finance", label: isAr ? "المالية والعمولات" : isFr ? "Finances & Commissions" : "Finance & Commissions", icon: CreditCard },
          { id: "cms", label: isAr ? "المحتوى والدعم" : isFr ? "CMS & Support" : "CMS & Support", icon: FileCode },
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
              <div className="kpi-label">{isAr ? "إجمالي المبيعات (GMV)" : isFr ? "Volume brut (GMV)" : "Gross Merchandise Value"}</div>
              <div className="kpi-value">{money(overview.financials?.gmv_mad || 0)}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">{isAr ? "عائدات العمولات" : isFr ? "Revenus commissions" : "Commission Revenue"}</div>
              <div className="kpi-value" style={{ color: "var(--success)" }}>{money(overview.financials?.commission_revenue_mad || 0)}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">{isAr ? "رسوم الخدمة" : isFr ? "Frais de service" : "Service Fee Revenue"}</div>
              <div className="kpi-value">{money(overview.financials?.service_fee_revenue_mad || 0)}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">{isAr ? "العقارات النشطة / المعلقة" : isFr ? "Actifs / En attente" : "Active / Pending Properties"}</div>
              <div className="kpi-value">{overview.metrics.activeProperties} / {overview.metrics.pendingProperties}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">{isAr ? "مدفوعات قيد التحويل" : isFr ? "Paiements en attente" : "Pending Payouts"}</div>
              <div className="kpi-value" style={{ color: "var(--warning)" }}>{money(overview.pendingPayouts || 0)}</div>
            </div>
          </div>

          <div className="card card-body" style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <Server size={18} color="var(--primary)" />
                {isAr ? "جاهزية الربط الإنتاجي (Production APIs)" : isFr ? "État des intégrations Production" : "Production Integration Readiness"}
              </h3>
              <span className="badge badge-primary" dir="ltr">
                {readiness.liveCount} Live · {readiness.sandboxCount} Sandbox
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 10 }}>
              {readiness.items.map((item) => (
                <div key={item.id} style={{ padding: 10, borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface-muted)", display: "grid", gap: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                    <strong style={{ fontSize: "0.84rem" }}>{item.name}</strong>
                    <span className={`badge ${item.mode === "live" ? "badge-success" : "badge-warning"}`}>
                      {item.mode === "live" ? "LIVE" : "SANDBOX"}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>{item.description}</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }} dir="ltr">
                    ENV: <code>{item.envKeys.join(", ")}</code>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-body">
                <h3 style={{ margin: "0 0 12px" }}>Geographic Distribution</h3>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>City</th>
                        <th>Properties</th>
                        <th>Bookings</th>
                        <th>GMV</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(overview.geoDistribution || []).map((g: any) => (
                        <tr key={g.city}>
                          <td><strong>{g.city}</strong></td>
                          <td>{g.properties}</td>
                          <td>{g.bookings}</td>
                          <td>{money(g.revenue_mad)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <h3 style={{ margin: "0 0 12px" }}>Recent Security & Audit Trail</h3>
                <div style={{ display: "grid", gap: 8, maxHeight: 360, overflowY: "auto" }}>
                  {(overview.auditLogs || []).map((log: any) => (
                    <div key={log.id} style={{ padding: 9, borderRadius: 8, background: "var(--surface-muted)", fontSize: "0.82rem" }}>
                      <strong>{log.action}</strong> · {log.entity_type} #{log.entity_id}
                      <div style={{ color: "var(--text-muted)" }}>{log.actor_email || "System"} · {log.created_at}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "properties" && (
        <div className="card">
          <div className="card-body">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Partner</th>
                    <th>City</th>
                    <th>Base Rate</th>
                    <th>Status</th>
                    <th>Badges</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((p) => (
                    <tr key={p.id}>
                      <td><strong>{p.title}</strong></td>
                      <td>{p.partner_name}</td>
                      <td>{p.city}</td>
                      <td>{money(p.base_price_mad)}</td>
                      <td><span className={`badge ${p.status === "active" ? "badge-success" : "badge-warning"}`}>{p.status}</span></td>
                      <td>
                        <button type="button" className={`btn btn-sm ${p.verified ? "btn-primary" : "btn-outline"}`} onClick={() => updateProperty(p.id, { verified: !p.verified })}>
                          <ShieldCheck size={13} /> {p.verified ? "Verified" : "Verify"}
                        </button>
                      </td>
                      <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {p.status !== "active" && (
                          <button type="button" className="btn btn-sm btn-primary" onClick={() => updateProperty(p.id, { status: "active", verified: true })}>
                            Approve
                          </button>
                        )}
                        {p.status === "active" && (
                          <button type="button" className="btn btn-sm btn-outline" onClick={() => updateProperty(p.id, { status: "suspended" })}>
                            Suspend
                          </button>
                        )}
                        <button type="button" className="btn btn-sm btn-outline" onClick={() => updateProperty(p.id, { featured: !p.featured })}>
                          {p.featured ? "Unfeature" : "Feature"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "users" && usersData && (
        <div style={{ display: "grid", gap: 20 }}>
          <div className="card">
            <div className="card-body">
              <h3 style={{ margin: "0 0 12px" }}>Partner KYC & Verification</h3>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Business</th>
                      <th>Owner</th>
                      <th>City</th>
                      <th>ICE / Tax</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(usersData.partners || []).map((pa: any) => (
                      <tr key={pa.id}>
                        <td><strong>{pa.business_name}</strong></td>
                        <td>{pa.full_name} ({pa.email})</td>
                        <td>{pa.city}</td>
                        <td>{pa.ice_number || "—"}</td>
                        <td><span className="badge badge-muted">{pa.verification_status}</span></td>
                        <td style={{ display: "flex", gap: 6 }}>
                          <button type="button" className="btn btn-sm btn-primary" onClick={() => updatePartnerVerification(pa.id, "verified")}>
                            Verify
                          </button>
                          <button type="button" className="btn btn-sm btn-danger" onClick={() => updatePartnerVerification(pa.id, "rejected")}>
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h3 style={{ margin: "0 0 12px" }}>Platform Users & RBAC Roles</h3>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(usersData.users || []).map((u: any) => (
                      <tr key={u.id}>
                        <td><strong>{u.full_name}</strong></td>
                        <td>{u.email}</td>
                        <td>
                          <BrandSelect
                            compact
                            value={u.role}
                            ariaLabel={`Role for ${u.full_name}`}
                            onChange={(val) => updateUserRoleOrStatus(u.id, { role: val })}
                            options={[
                              "traveler",
                              "partner_owner",
                              "partner_manager",
                              "partner_staff",
                              "affiliate",
                              "support",
                              "finance",
                              "content_manager",
                              "admin",
                              "super_admin",
                            ].map((r) => ({ value: r, label: r }))}
                          />
                        </td>
                        <td><span className="badge badge-muted">{u.status}</span></td>
                        <td>
                          <button type="button" className="btn btn-sm btn-outline" onClick={() => updateUserRoleOrStatus(u.id, { status: u.status === "active" ? "suspended" : "active" })}>
                            {u.status === "active" ? "Suspend" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "bookings" && (
        <div className="card">
          <div className="card-body">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Ref</th>
                    <th>Property</th>
                    <th>Guest</th>
                    <th>Dates</th>
                    <th>Total</th>
                    <th>Commission</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td><strong>{b.booking_ref}</strong></td>
                      <td>{b.property_title}<br /><small>{b.city}</small></td>
                      <td>{b.guest_name}<br /><small>{b.guest_email}</small></td>
                      <td>{b.check_in} → {b.check_out}</td>
                      <td>{money(b.total_mad)}</td>
                      <td>{money(b.commission_mad)}</td>
                      <td><span className="badge badge-muted">{b.status}</span></td>
                      <td>
                        {["confirmed", "pending_payment", "pending"].includes(b.status) && (
                          <button type="button" className="btn btn-sm btn-danger" onClick={() => adminRefundBooking(b.id)}>
                            Force Refund
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

      {tab === "finance" && finance && (
        <div style={{ display: "grid", gap: 20 }}>
          <div className="grid-2">
            <div className="card">
              <div className="card-body">
                <h3 style={{ margin: "0 0 10px" }}>Global Commission Rate</h3>
                <form onSubmit={saveCommissionPct} style={{ display: "flex", gap: 10 }}>
                  <input className="input" type="number" min={0} max={40} value={commissionPctInput} onChange={(e) => setCommissionPctInput(e.target.value)} />
                  <button type="submit" className="btn btn-primary">Update %</button>
                </form>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <h3 style={{ margin: "0 0 10px" }}>Create Global Promo Code</h3>
                <form onSubmit={createPromo} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input className="input" style={{ flex: 1 }} placeholder="Code (MOROCCO20)" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} required />
                  <input className="input" style={{ flex: 1 }} placeholder="Label" value={promoName} onChange={(e) => setPromoName(e.target.value)} required />
                  <input className="input" style={{ width: 90 }} type="number" placeholder="%" value={promoPct} onChange={(e) => setPromoPct(e.target.value)} required />
                  <button type="submit" className="btn btn-primary">Add Promo</button>
                </form>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h3 style={{ margin: "0 0 12px" }}>Partner Payout Requests</h3>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Partner</th>
                      <th>Amount</th>
                      <th>Bank / RIB</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(finance.payouts || []).map((po: any) => (
                      <tr key={po.id}>
                        <td><strong>{po.business_name}</strong></td>
                        <td>{money(po.amount_mad)}</td>
                        <td>{po.bank_name} · {po.rib_iban}</td>
                        <td><span className="badge badge-muted">{po.status}</span></td>
                        <td style={{ display: "flex", gap: 6 }}>
                          {po.status === "requested" && (
                            <button type="button" className="btn btn-sm btn-outline" onClick={() => updatePayoutStatus(po.id, "approved")}>
                              Approve
                            </button>
                          )}
                          {["requested", "approved"].includes(po.status) && (
                            <button type="button" className="btn btn-sm btn-primary" onClick={() => updatePayoutStatus(po.id, "paid")}>
                              Mark Paid
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

          <div className="card">
            <div className="card-body">
              <h3 style={{ margin: "0 0 12px" }}>Double-Entry Financial Ledger</h3>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Partner</th>
                      <th>Type</th>
                      <th>Direction</th>
                      <th>Amount</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(finance.ledger || []).slice(0, 20).map((le: any) => (
                      <tr key={le.id}>
                        <td>#{le.id}</td>
                        <td>{le.business_name || "Platform"}</td>
                        <td>{le.entry_type}</td>
                        <td><span className={`badge ${le.direction === "credit" ? "badge-success" : "badge-warning"}`}>{le.direction}</span></td>
                        <td>{money(le.amount_mad)}</td>
                        <td>{le.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "cms" && cmsData && (
        <div className="grid-2">
          <div className="card">
            <div className="card-body">
              <h3 style={{ margin: "0 0 12px" }}>Support Tickets & Disputes</h3>
              <div style={{ display: "grid", gap: 10 }}>
                {(cmsData.tickets || []).map((tk: any) => (
                  <div key={tk.id} style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong>{tk.subject}</strong>
                      <span className="badge badge-muted">{tk.status}</span>
                    </div>
                    <div style={{ fontSize: "0.84rem", color: "var(--text-muted)", margin: "4px 0 8px" }}>
                      {tk.user_name || "Guest"} · {tk.description}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button type="button" className="btn btn-sm btn-primary" onClick={() => resolveTicket(tk.id, "resolved")}>
                        Resolve
                      </button>
                      <button type="button" className="btn btn-sm btn-outline" onClick={() => resolveTicket(tk.id, "in_progress")}>
                        In Progress
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h3 style={{ margin: "0 0 12px" }}>Public Beta Feedback ({betaFeedback.length})</h3>
              <div style={{ display: "grid", gap: 10 }}>
                {betaFeedback.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", margin: 0 }}>No beta feedback submitted yet.</p>
                ) : (
                  betaFeedback.map((fb: any) => (
                    <div key={fb.id} style={{ padding: 10, border: "1px solid var(--border)", borderRadius: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                        <strong>{fb.feedback_ref} · {fb.category} ({fb.severity})</strong>
                        <span className="badge badge-warning">{fb.status}</span>
                      </div>
                      <div style={{ fontSize: "0.84rem", color: "var(--text-muted)", margin: "4px 0 8px" }}>
                        {fb.description}
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={async () => {
                            await fetch("/api/v1/feedback", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: fb.id, status: "resolved" }),
                            });
                            loadAll();
                          }}
                        >
                          Resolve
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          onClick={async () => {
                            await fetch("/api/v1/feedback", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: fb.id, status: "triaged" }),
                            });
                            loadAll();
                          }}
                        >
                          Triage
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h3 style={{ margin: "0 0 12px" }}>CMS Blocks & Feature Flags</h3>
              <div style={{ display: "grid", gap: 10 }}>
                {(cmsData.cmsBlocks || []).map((blk: any) => (
                  <div key={blk.id} style={{ padding: 10, border: "1px solid var(--border)", borderRadius: 10 }}>
                    <strong>{blk.key}</strong> — {blk.title}
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>FR: {blk.title_fr} · AR: {blk.title_ar}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "services" && (
        <div style={{ display: "grid", gap: 18 }}>
          <div className="card card-body">
            <h3 style={{ marginTop: 0 }}>Flight Requests ({travelServices.flights.length})</h3>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Ref</th><th>Route</th><th>Date</th><th>Phone</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {travelServices.flights.map((f) => (
                    <tr key={f.id}>
                      <td><strong>{f.request_ref}</strong></td>
                      <td>{f.origin} → {f.destination}</td>
                      <td>{f.departure_date}</td>
                      <td>{f.contact_phone}</td>
                      <td><span className="badge badge-warning">{f.status}</span></td>
                      <td style={{ display: "flex", gap: 6 }}>
                        <button type="button" className="btn btn-sm btn-primary" onClick={async () => {
                          await fetch("/api/v1/admin/services", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "flight", id: f.id, status: "confirmed" }) });
                          loadAll();
                        }}>Confirm</button>
                        <button type="button" className="btn btn-sm btn-outline" onClick={async () => {
                          await fetch("/api/v1/admin/services", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "flight", id: f.id, status: "cancelled" }) });
                          loadAll();
                        }}>Cancel</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card card-body">
            <h3 style={{ marginTop: 0 }}>Train & Bus Transport Requests ({travelServices.transport.length})</h3>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Ref</th><th>Route</th><th>Carrier</th><th>Indicative</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {travelServices.transport.map((tItem) => (
                    <tr key={tItem.id}>
                      <td><strong>{tItem.request_ref}</strong></td>
                      <td>{tItem.origin_city} → {tItem.destination_city}</td>
                      <td>{tItem.carrier_type}</td>
                      <td>{money(tItem.indicative_price_mad)}</td>
                      <td><span className="badge badge-warning">{tItem.status}</span></td>
                      <td style={{ display: "flex", gap: 6 }}>
                        <button type="button" className="btn btn-sm btn-primary" onClick={async () => {
                          await fetch("/api/v1/admin/services", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "transport", id: tItem.id, status: "confirmed" }) });
                          loadAll();
                        }}>Confirm</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card card-body">
            <h3 style={{ marginTop: 0 }}>eSIM Requests ({travelServices.esims.length})</h3>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Ref</th><th>Package</th><th>Email</th><th>Price</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {travelServices.esims.map((eItem) => (
                    <tr key={eItem.id}>
                      <td><strong>{eItem.request_ref}</strong></td>
                      <td>{eItem.data_gb} GB / {eItem.duration_days}d</td>
                      <td>{eItem.customer_email}</td>
                      <td>{money(eItem.price_mad)}</td>
                      <td><span className="badge badge-warning">{eItem.status}</span></td>
                      <td>
                        <button type="button" className="btn btn-sm btn-primary" onClick={async () => {
                          await fetch("/api/v1/admin/services", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "esim", id: eItem.id, status: "qr_issued" }) });
                          loadAll();
                        }}>Mark QR Issued</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card card-body" style={{ display: "grid", gap: 14 }}>
            <h3 style={{ margin: 0 }}>Live Transport Offers Inventory ({(travelServices.transportOffers || []).length})</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const res = await fetch("/api/v1/admin/services", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(newOffer),
                });
                if (res.ok) {
                  setFeedback(`Added live transport offer ${newOffer.originCity} → ${newOffer.destinationCity}.`);
                  loadAll();
                }
              }}
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, alignItems: "end", padding: 12, borderRadius: 12, background: "var(--surface-muted)" }}
            >
              <div>
                <label className="field-label">Carrier</label>
                <input className="input" value={newOffer.carrierBrand} onChange={(e) => setNewOffer({ ...newOffer, carrierBrand: e.target.value })} required />
              </div>
              <div>
                <label className="field-label">Origin</label>
                <input className="input" value={newOffer.originCity} onChange={(e) => setNewOffer({ ...newOffer, originCity: e.target.value })} required />
              </div>
              <div>
                <label className="field-label">Destination</label>
                <input className="input" value={newOffer.destinationCity} onChange={(e) => setNewOffer({ ...newOffer, destinationCity: e.target.value })} required />
              </div>
              <div>
                <label className="field-label">Dep Time</label>
                <input className="input" value={newOffer.depTime} onChange={(e) => setNewOffer({ ...newOffer, depTime: e.target.value })} required />
              </div>
              <div>
                <label className="field-label">Fare (MAD)</label>
                <input type="number" className="input" value={newOffer.fareMad} onChange={(e) => setNewOffer({ ...newOffer, fareMad: Number(e.target.value) || 100 })} required />
              </div>
              <div>
                <label className="field-label">Seats</label>
                <input type="number" className="input" value={newOffer.seatsLeft} onChange={(e) => setNewOffer({ ...newOffer, seatsLeft: Number(e.target.value) || 10 })} required />
              </div>
              <button type="submit" className="btn btn-primary">+ Publish Offer</button>
            </form>

            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Code</th><th>Carrier</th><th>Route</th><th>Time</th><th>Fare</th><th>Seats</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {(travelServices.transportOffers || []).slice(0, 40).map((of: any) => (
                    <tr key={of.id}>
                      <td><strong dir="ltr">{of.offer_code}</strong></td>
                      <td>{of.carrier_brand}</td>
                      <td>{of.origin_city} → {of.destination_city}</td>
                      <td dir="ltr">{of.dep_time}–{of.arr_time}</td>
                      <td dir="ltr">{money(of.fare_mad)}</td>
                      <td dir="ltr">{of.seats_left}</td>
                      <td>
                        <span className={`badge ${of.status === "active" ? "badge-success" : "badge-danger"}`}>
                          {of.status}
                        </span>
                      </td>
                      <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {of.status === "active" ? (
                          <button type="button" className="btn btn-sm btn-outline" onClick={async () => {
                            await fetch("/api/v1/admin/services", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "transport_offer", id: of.id, status: "sold_out", seatsLeft: 0 }) });
                            loadAll();
                          }}>Sold Out</button>
                        ) : (
                          <button type="button" className="btn btn-sm btn-primary" onClick={async () => {
                            await fetch("/api/v1/admin/services", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "transport_offer", id: of.id, status: "active", seatsLeft: 15 }) });
                            loadAll();
                          }}>Activate</button>
                        )}
                        <button type="button" className="btn btn-sm btn-danger" onClick={async () => {
                          await fetch("/api/v1/admin/services", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "transport_offer", id: of.id, status: "removed" }) });
                          loadAll();
                        }}>Remove</button>
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
  );
}
