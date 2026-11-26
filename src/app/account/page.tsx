"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { WorkspacePageSkeleton } from "@/components/BrandSkeletons";
import {
  Bell,
  Calendar,
  Check,
  Copy,
  FileText,
  Heart,
  LifeBuoy,
  MessageSquare,
  Printer,
  Search,
  Share2,
  Sparkles,
  Star,
  Tag,
  User as UserIcon,
  X,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { BrandLogo } from "@/components/BrandLogo";
import { BrandSelect } from "@/components/BrandSelect";
import { BrandDateRangePicker } from "@/components/BrandDateRangePicker";
import { PropertyCard, getFirstImage, type PropertyItem } from "@/components/PropertyCard";
import { tCity } from "@/lib/i18n";
import { generateBookingIcs } from "@/lib/providers";

interface BookingRow {
  id: number;
  booking_ref: string;
  property_title: string;
  property_slug: string;
  city: string;
  images_json?: string;
  room_name: string;
  check_in: string;
  check_out: string;
  nights: number;
  adults: number;
  children: number;
  units_booked: number;
  status: string;
  subtotal_mad: number;
  discount_mad: number;
  taxes_mad: number;
  service_fee_mad: number;
  total_mad: number;
  guest_name: string;
  guest_email: string;
  cancellation_policy: string;
  created_at: string;
}

interface ConversationRow {
  id: number;
  subject: string;
  property_title?: string;
  partner_name?: string;
  last_message_at: string;
  messages: Array<{ id: number; sender_name: string; body: string; created_at: string }>;
}

interface NotificationRow {
  id: number;
  title: string;
  body: string;
  link_url?: string;
  is_read: number;
  created_at: string;
}

interface SupportTicketRow {
  id: number;
  subject: string;
  category: string;
  priority: string;
  status: string;
  description: string;
  admin_notes?: string;
  created_at: string;
}

interface PromoVoucher {
  id: number;
  code: string;
  name: string;
  discount_pct: number;
  discount_fixed_mad: number;
  min_booking_mad: number;
}

const DEFAULT_BETA_PROMOS: PromoVoucher[] = [
  { id: 1, code: "MARHABA10", name: "Welcome to Morocco 10% Off", discount_pct: 10, discount_fixed_mad: 0, min_booking_mad: 300 },
  { id: 2, code: "SAHARA15", name: "Desert & Southern Escape 15% Off", discount_pct: 15, discount_fixed_mad: 0, min_booking_mad: 800 },
  { id: 3, code: "FIRST200", name: "200 MAD Off First Luxury Stay", discount_pct: 0, discount_fixed_mad: 200, min_booking_mad: 1500 },
];

function AccountClient() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "bookings";
  const { lang, tr, user, loadingUser, openAuthModal, activateDemoAccount, activatingDemo, money, refreshUser } = useApp();
  const isAr = lang === "ar";
  const isFr = lang === "fr";

  const downloadBookingCalendar = (b: BookingRow) => {
    const ics = generateBookingIcs({
      bookingRef: b.booking_ref,
      title: b.property_title,
      city: b.city,
      roomName: b.room_name,
      checkIn: b.check_in,
      checkOut: b.check_out,
      guestName: b.guest_name,
      status: b.status,
    });
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MARHABA-${b.booking_ref}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const [tab, setTab] = useState(initialTab);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [wishlist, setWishlist] = useState<PropertyItem[]>([]);
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [tickets, setTickets] = useState<SupportTicketRow[]>([]);
  const [affiliate, setAffiliate] = useState<{ code: string; commission_pct: number; total_earned_mad: number; status: string } | null>(null);
  const [promos, setPromos] = useState<PromoVoucher[]>(DEFAULT_BETA_PROMOS);
  const [copiedPromo, setCopiedPromo] = useState<string | null>(null);
  const [activePromo, setActivePromo] = useState<string>("");

  const [invoiceBooking, setInvoiceBooking] = useState<BookingRow | null>(null);
  const [modifyTarget, setModifyTarget] = useState<BookingRow | null>(null);
  const [modCheckIn, setModCheckIn] = useState("");
  const [modCheckOut, setModCheckOut] = useState("");
  const [bookingFilter, setBookingFilter] = useState<string>("all");
  const [bookingQuery, setBookingQuery] = useState<string>("");
  const [reviewTarget, setReviewTarget] = useState<BookingRow | null>(null);
  const [revRating, setRevRating] = useState<number>(5);
  const [revComment, setRevComment] = useState<string>("");
  const [revBusy, setRevBusy] = useState<boolean>(false);
  const [feedback, setFeedback] = useState("");

  const [replyTexts, setReplyTexts] = useState<Record<number, string>>({});

  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketCategory, setTicketCategory] = useState("general");
  const [ticketMsg, setTicketMsg] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (searchParams.get("tab")) setTab(searchParams.get("tab")!);
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
      setPhone(user.phone || "");
    }
  }, [user]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setActivePromo(localStorage.getItem("marhaba_active_promo") || "");
    } catch {
      // ignore
    }
  }, []);

  const applyAndCopyPromo = (code: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code).catch(() => {});
    }
    try {
      localStorage.setItem("marhaba_active_promo", code);
    } catch {
      // ignore
    }
    setActivePromo(code);
    setCopiedPromo(code);
    setFeedback(`Promo code ${code} copied & armed! It will auto-apply at checkout.`);
    setTimeout(() => setCopiedPromo((cur) => (cur === code ? null : cur)), 2200);
  };

  const loadData = useCallback(async () => {
    if (!user) return;
    const [bRes, wRes, mRes, nRes, sRes, aRes, pRes] = await Promise.all([
      fetch("/api/v1/bookings", { cache: "no-store" }),
      fetch("/api/v1/wishlists", { cache: "no-store" }),
      fetch("/api/v1/messages", { cache: "no-store" }),
      fetch("/api/v1/notifications", { cache: "no-store" }),
      fetch("/api/v1/support", { cache: "no-store" }),
      fetch("/api/v1/affiliates", { cache: "no-store" }),
      fetch("/api/v1/marketplace/home", { cache: "no-store" }),
    ]);
    if (bRes.ok) setBookings((await bRes.json()).bookings || []);
    if (wRes.ok) setWishlist((await wRes.json()).items || []);
    if (mRes.ok) setConversations((await mRes.json()).conversations || []);
    if (nRes.ok) setNotifications((await nRes.json()).notifications || []);
    if (sRes.ok) setTickets((await sRes.json()).tickets || []);
    if (aRes.ok) setAffiliate((await aRes.json()).affiliate || null);
    if (pRes.ok) {
      const homeJson = await pRes.json();
      if (Array.isArray(homeJson?.promotions) && homeJson.promotions.length > 0) {
        setPromos(homeJson.promotions);
      }
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!invoiceBooking && !modifyTarget && !reviewTarget) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setInvoiceBooking(null);
        setModifyTarget(null);
        setReviewTarget(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [invoiceBooking, modifyTarget, reviewTarget]);

  async function handleSandboxPay(bookingId: number) {
    setFeedback("");
    const res = await fetch(`/api/v1/bookings/${bookingId}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: "sandbox_card", methodSummary: "sandbox_card •••• 4242" }),
    });
    const d = await res.json();
    if (res.ok) {
      setFeedback(`Booking confirmed (Sandbox Checkout).`);
      loadData();
    } else {
      setFeedback(d.error || "Payment failed");
    }
  }

  async function handleCancel(bookingId: number) {
    setFeedback("");
    const res = await fetch(`/api/v1/bookings/${bookingId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Customer requested cancellation from account" }),
    });
    const d = await res.json();
    if (res.ok) {
      setFeedback(`Booking cancelled. Refund processed: ${money(d.refundAmountMad || 0)}. ${d.explanation || ""}`);
      loadData();
    } else {
      setFeedback(d.error || "Cancellation failed");
    }
  }

  async function handleModify(e: React.FormEvent) {
    e.preventDefault();
    if (!modifyTarget) return;
    setFeedback("");
    const res = await fetch(`/api/v1/bookings/${modifyTarget.id}/modify`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkIn: modCheckIn, checkOut: modCheckOut }),
    });
    const d = await res.json();
    if (res.ok) {
      setFeedback(`Booking ${modifyTarget.booking_ref} updated!`);
      setModifyTarget(null);
      loadData();
    } else {
      setFeedback(d.error || "Modification failed");
    }
  }

  async function sendReply(conversationId: number) {
    const body = (replyTexts[conversationId] || "").trim();
    if (!body) return;
    const res = await fetch("/api/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, body }),
    });
    if (res.ok) {
      setReplyTexts((p) => ({ ...p, [conversationId]: "" }));
      loadData();
    }
  }

  async function markAllRead() {
    await fetch("/api/v1/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    await refreshUser();
    loadData();
  }

  async function createTicket(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/v1/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: ticketSubject, category: ticketCategory, description: ticketMsg }),
    });
    if (res.ok) {
      setTicketSubject("");
      setTicketMsg("");
      setFeedback("Support ticket submitted.");
      loadData();
    }
  }

  async function joinAffiliate() {
    const res = await fetch("/api/v1/affiliates", { method: "POST" });
    if (res.ok) {
      setFeedback("Affiliate account activated!");
      loadData();
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/v1/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullName, phone }),
    });
    if (!res.ok) {
      const d = await res.json();
      setFeedback(d.error || "Update failed");
      return;
    }
    if (newPassword && currentPassword) {
      const pRes = await fetch("/api/v1/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change_password", currentPassword, newPassword }),
      });
      if (!pRes.ok) {
        const pd = await pRes.json();
        setFeedback(pd.error || "Password change failed");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
    }
    setFeedback("Profile updated.");
    await refreshUser();
  }

  if (loadingUser) return <WorkspacePageSkeleton />;

  if (!user) {
    return (
      <div className="container" style={{ padding: 48, textAlign: "center" }}>
        <div className="card" style={{ maxWidth: 520, marginInline: "auto" }}>
          <div className="card-body" style={{ padding: 32, display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0 }}>{tr("signInRequired")}</h2>
            <p style={{ color: "var(--text-muted)", margin: 0 }}>{tr("accountSubtitle")}</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
              <button type="button" className="btn btn-primary" disabled={!!activatingDemo} onClick={() => activateDemoAccount("traveler")}>
                {activatingDemo === "traveler" ? "..." : tr("demoTraveler")}
              </button>
              <button type="button" className="btn btn-outline" disabled={!!activatingDemo} onClick={() => activateDemoAccount("affiliate")}>
                {activatingDemo === "affiliate" ? "..." : tr("demoAffiliate")}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => openAuthModal("login")}>
                {tr("signIn")} / {tr("register")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 26, paddingBottom: 48 }}>
      <div className="card card-body brand-zellige" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <div>
          <span className="badge badge-primary">{tr("accountTitle")}</span>
          <h1 style={{ margin: "6px 0 4px", fontSize: "1.6rem", fontWeight: 800, color: "var(--text)" }}>{user.full_name}</h1>
          <div style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>
            {user.email} · <strong>{user.role}</strong> · <strong>{user.loyalty_points}</strong> pts
          </div>
        </div>
        {user.referral_code && (
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={() => {
              if (typeof navigator !== "undefined" && navigator.clipboard) {
                navigator.clipboard.writeText(user.referral_code).catch(() => {});
              }
              setFeedback(`${user.referral_code} ${tr("copiedBtn")}`);
            }}
          >
            <Share2 size={14} /> <strong>{user.referral_code}</strong> ({tr("copiedBtn").replace("!", "")})
          </button>
        )}
      </div>

      {/* Loyalty Tier Progress Card */}
      {(() => {
        const pts = user.loyalty_points || 0;
        const tier = pts >= 1500 ? "Atlas Royal VIP" : pts >= 500 ? "Gold Nomad" : "Atlas Explorer";
        const nextGoal = pts >= 1500 ? 1500 : pts >= 500 ? 1500 : 500;
        const pct = Math.min(100, Math.round((pts / nextGoal) * 100));
        return (
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-body" style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="badge badge-gold">{tier}</span>
                <span style={{ fontSize: "0.84rem", color: "var(--text-muted)" }}>
                  <strong>{pts}</strong> pts {pts < 1500 ? `· ${nextGoal - pts} pts to ${pts >= 500 ? "Atlas Royal VIP" : "Gold Nomad"}` : "· Top VIP Tier Unlocked"}
                </span>
              </div>
              <div style={{ width: 210, maxWidth: "100%", height: 8, borderRadius: 999, background: "var(--surface-muted)", overflow: "hidden", border: "1px solid var(--border)" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, var(--primary), var(--gold))", borderRadius: 999 }} />
              </div>
            </div>
          </div>
        );
      })()}

      {feedback && (
        <div className="badge badge-primary" style={{ display: "block", padding: "10px 14px", borderRadius: 10, marginBottom: 16 }}>
          {feedback}
        </div>
      )}

      {/* MARHABA Beta Deals & Instant Promo Codes Wallet */}
      <section
        className="card"
        style={{
          marginBottom: 18,
          border: "1px solid rgba(31, 64, 197, 0.22)",
          background: "linear-gradient(135deg, rgba(31,64,197,0.05), rgba(242,183,5,0.08))",
        }}
      >
        <div className="card-body" style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <BrandLogo size="sm" showArabic={false} />
              <div>
                <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "var(--text)", display: "flex", alignItems: "center", gap: 6 }}>
                  <Tag size={15} style={{ color: "var(--primary)" }} /> Beta Deals &amp; Instant Promo Codes
                </h2>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Click any code to copy &amp; auto-apply at checkout{activePromo ? ` · Armed: ${activePromo}` : ""}
                </div>
              </div>
            </div>
            <Link href="/search" className="btn btn-sm btn-primary">
              <Sparkles size={14} /> {tr("prop.bookNow")}
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10 }}>
            {promos.slice(0, 3).map((promo) => {
              const isCopied = copiedPromo === promo.code;
              const isArmed = activePromo === promo.code;
              return (
                <div
                  key={promo.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 14px",
                    borderRadius: 12,
                    background: "var(--surface)",
                    border: isArmed ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "var(--text)" }}>{promo.name}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      {promo.discount_pct > 0 ? `${promo.discount_pct}% off` : `${money(promo.discount_fixed_mad)} off`}
                      {promo.min_booking_mad > 0 ? ` · Min ${money(promo.min_booking_mad)}` : " · No minimum"}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`btn btn-sm ${isCopied || isArmed ? "btn-primary" : "btn-outline"}`}
                    onClick={() => applyAndCopyPromo(promo.code)}
                    style={{ borderStyle: isArmed ? "solid" : "dashed", fontWeight: 800, flexShrink: 0 }}
                  >
                    {isCopied || isArmed ? <Check size={13} /> : <Copy size={13} />}
                    <span>{isCopied ? "Copied!" : isArmed ? `${promo.code} ✓` : promo.code}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="tabs">
        {[
          { id: "bookings", label: tr("myBookings"), icon: Calendar },
          { id: "promos", label: `${tr("promoWallet")} (${promos.length})`, icon: Tag },
          { id: "wishlist", label: `${tr("savedWishlist")} (${wishlist.length})`, icon: Heart },
          { id: "messages", label: `${tr("askPartner")} (${conversations.length})`, icon: MessageSquare },
          { id: "notifications", label: "Alerts", icon: Bell },
          { id: "affiliate", label: "Affiliate", icon: Share2 },
          { id: "support", label: "Support", icon: LifeBuoy },
          { id: "profile", label: tr("accountTitle").split("&")[0].trim(), icon: UserIcon },
        ].map((tItem) => (
          <button key={tItem.id} type="button" className={`tab-btn ${tab === tItem.id ? "active" : ""}`} onClick={() => setTab(tItem.id)}>
            <tItem.icon size={15} />
            <span>{tItem.label}</span>
          </button>
        ))}
      </div>

      {tab === "bookings" && (() => {
        const filteredBookings = bookings.filter((b) => {
          const matchesStatus =
            bookingFilter === "all" ||
            (bookingFilter === "active" && ["confirmed", "pending_payment", "pending"].includes(b.status)) ||
            (bookingFilter === "completed" && b.status === "completed") ||
            (bookingFilter === "cancelled" && ["cancelled", "refunded"].includes(b.status));
          const qLower = bookingQuery.trim().toLowerCase();
          const matchesQuery =
            !qLower ||
            b.booking_ref.toLowerCase().includes(qLower) ||
            b.property_title.toLowerCase().includes(qLower) ||
            b.city.toLowerCase().includes(qLower);
          return matchesStatus && matchesQuery;
        });

        return (
        <div style={{ display: "grid", gap: 14 }}>
          {bookings.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[
                  { id: "all", label: `${tr("allStatuses")} (${bookings.length})` },
                  { id: "active", label: tr("confirmedStatus") },
                  { id: "completed", label: tr("completedStatus") },
                  { id: "cancelled", label: tr("cancelledStatus") },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`btn btn-sm ${bookingFilter === f.id ? "btn-primary" : "btn-outline"}`}
                    onClick={() => setBookingFilter(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div style={{ position: "relative", minWidth: 220, flex: "0 1 280px" }}>
                <Search size={14} style={{ position: "absolute", top: "50%", insetInlineStart: 10, transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  className="input"
                  style={{ paddingInlineStart: 32 }}
                  placeholder={tr("searchBookingsPlaceholder")}
                  value={bookingQuery}
                  onChange={(e) => setBookingQuery(e.target.value)}
                />
              </div>
            </div>
          )}
          {filteredBookings.length === 0 ? (
            <div className="card">
              <div className="card-body">
                {bookings.length === 0 ? (
                  <>
                    No bookings yet. <Link href="/search" style={{ color: "var(--primary)", fontWeight: 700 }}>Explore Morocco Marketplace</Link>
                  </>
                ) : (
                  "No bookings match your current filter."
                )}
              </div>
            </div>
          ) : (
            filteredBookings.map((b) => (
              <div key={b.id} className="card">
                <div className="card-body" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 240 }}>
                    <img
                      src={getFirstImage(b.images_json)}
                      alt={b.property_title}
                      style={{ width: 88, height: 70, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
                    />
                    <div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                        <strong>{b.booking_ref}</strong>
                        <span className={`badge ${b.status === "confirmed" || b.status === "completed" ? "badge-success" : b.status === "cancelled" || b.status === "refunded" ? "badge-danger" : "badge-warning"}`}>
                          {b.status}
                        </span>
                      </div>
                      <Link href={`/properties/${b.property_slug}`} style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text)" }}>
                        {b.property_title}
                      </Link>
                      <div style={{ fontSize: "0.86rem", color: "var(--text-muted)" }}>
                        {tCity(lang, b.city)} · {b.room_name} · {b.check_in} → {b.check_out} ({b.nights} {b.nights === 1 ? tr("nightSingular") : tr("nightPlural")})
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "end", display: "grid", gap: 8 }}>
                    <div style={{ fontWeight: 800, fontSize: "1.15rem", color: "var(--primary)" }}>{money(b.total_mad)}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {b.status === "pending_payment" && (
                        <button type="button" className="btn btn-sm btn-gold" onClick={() => handleSandboxPay(b.id)}>
                          {tr("confirmPayBtn")}
                        </button>
                      )}
                      <Link href={`/properties/${b.property_slug}`} className="btn btn-sm btn-outline">
                        {tr("seeAvailability")}
                      </Link>
                      <button type="button" className="btn btn-sm btn-outline" onClick={() => setInvoiceBooking(b)}>
                        <FileText size={14} /> PDF
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => downloadBookingCalendar(b)}
                        title={isAr ? "إضافة إلى التقويم" : isFr ? "Ajouter au calendrier" : "Add to Calendar (.ics)"}
                      >
                        <Calendar size={14} /> .ics
                      </button>
                      {["confirmed", "completed"].includes(b.status) && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          onClick={() => {
                            setReviewTarget(b);
                            setRevRating(5);
                            setRevComment("");
                          }}
                        >
                          <Star size={14} /> {tr("leaveReview")}
                        </button>
                      )}
                      {["confirmed", "pending_payment", "pending"].includes(b.status) && (
                        <>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline"
                            onClick={() => {
                              setModifyTarget(b);
                              setModCheckIn(b.check_in);
                              setModCheckOut(b.check_out);
                            }}
                          >
                            {tr("modifyDates")}
                          </button>
                          <button type="button" className="btn btn-sm btn-danger" onClick={() => handleCancel(b.id)}>
                            {tr("cancelBooking")}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        );
      })()}

      {tab === "promos" && (
        <div style={{ display: "grid", gap: 14 }}>
          <div className="card">
            <div className="card-body">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
                <div>
                  <h3 style={{ margin: 0, color: "var(--text)" }}>Your MARHABA Vouchers &amp; Beta Promo Codes</h3>
                  <p style={{ margin: "4px 0 0", fontSize: "0.86rem", color: "var(--text-muted)" }}>
                    Tap any voucher to copy the code and arm it for automatic checkout savings across Riads, Hotels, Desert Camps, Cars &amp; Experiences.
                  </p>
                </div>
                {activePromo && <span className="badge badge-gold">Armed for checkout: {activePromo}</span>}
              </div>
              <div className="grid-3" style={{ gap: 12 }}>
                {promos.map((promo) => {
                  const isCopied = copiedPromo === promo.code;
                  const isArmed = activePromo === promo.code;
                  return (
                    <div key={promo.id} className="voucher-card" style={{ padding: 16, display: "grid", gap: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="badge badge-primary">
                          {promo.discount_pct > 0 ? `${promo.discount_pct}% OFF` : `${money(promo.discount_fixed_mad)} OFF`}
                        </span>
                        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                          {promo.min_booking_mad > 0 ? `Min ${money(promo.min_booking_mad)}` : "No minimum"}
                        </span>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text)" }}>{promo.name}</div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <button
                          type="button"
                          className={`btn btn-sm ${isCopied || isArmed ? "btn-primary" : "btn-outline"}`}
                          style={{ flex: 1, fontWeight: 800, borderStyle: isArmed ? "solid" : "dashed" }}
                          onClick={() => applyAndCopyPromo(promo.code)}
                        >
                          {isCopied || isArmed ? <Check size={14} /> : <Copy size={14} />}
                          <span>{isCopied ? "Copied & Armed!" : isArmed ? `Armed: ${promo.code}` : `Copy ${promo.code}`}</span>
                        </button>
                        <Link href="/search" className="btn btn-sm btn-gold">
                          Use
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "wishlist" && (
        <div className="grid-3">
          {wishlist.length === 0 ? (
            <div className="card">
              <div className="card-body">Your wishlist is empty. Tap the heart icon on any property to save it.</div>
            </div>
          ) : (
            wishlist.map((item) => <PropertyCard key={item.id} item={item} />)
          )}
        </div>
      )}

      {tab === "messages" && (
        <div style={{ display: "grid", gap: 14 }}>
          {conversations.length === 0 ? (
            <div className="card">
              <div className="card-body">No messages yet. Message any property partner from their listing page.</div>
            </div>
          ) : (
            conversations.map((c) => (
              <div key={c.id} className="card">
                <div className="card-body">
                  <div style={{ fontWeight: 800, marginBottom: 4 }}>{c.subject}</div>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 10 }}>
                    {c.property_title} · Partner: {c.partner_name}
                  </div>
                  <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
                    {c.messages.map((m) => (
                      <div key={m.id} style={{ padding: 10, borderRadius: 10, background: "var(--surface-muted)", fontSize: "0.86rem" }}>
                        <strong>{m.sender_name}:</strong> {m.body}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      className="input"
                      placeholder="Write a reply..."
                      value={replyTexts[c.id] || ""}
                      onChange={(e) => setReplyTexts((p) => ({ ...p, [c.id]: e.target.value }))}
                    />
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => sendReply(c.id)}>
                      Send
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "notifications" && (
        <div className="card">
          <div className="card-body">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <strong>Notifications</strong>
              <button type="button" className="btn btn-sm btn-outline" onClick={markAllRead}>
                Mark all read
              </button>
            </div>
            {notifications.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>No notifications yet.</p>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {notifications.map((n) => (
                  <div key={n.id} style={{ padding: 12, borderRadius: 10, border: "1px solid var(--border)", background: n.is_read ? "var(--surface)" : "var(--primary-light)" }}>
                    <div style={{ fontWeight: 700, color: "var(--text)" }}>{n.title}</div>
                    <div style={{ fontSize: "0.86rem", color: "var(--text-muted)" }}>{n.body}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "affiliate" && (
        <div className="card">
          <div className="card-body">
            {affiliate ? (
              <div style={{ display: "grid", gap: 14 }}>
                <h3 style={{ margin: 0 }}>MARHABA Affiliate Dashboard</h3>
                <div className="kpi-grid">
                  <div className="kpi-card">
                    <div className="kpi-label">Referral Code</div>
                    <div className="kpi-value">{affiliate.code}</div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-label">Commission Rate</div>
                    <div className="kpi-value">{affiliate.commission_pct}%</div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-label">Total Earnings</div>
                    <div className="kpi-value">{money(affiliate.total_earned_mad)}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: "0.86rem", color: "var(--text-muted)" }}>
                  <span>Share link:</span>
                  <code>{typeof window !== "undefined" ? `${window.location.origin}/?ref=${affiliate.code}` : ""}</code>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => {
                      if (typeof window !== "undefined" && navigator.clipboard) {
                        navigator.clipboard.writeText(`${window.location.origin}/?ref=${affiliate.code}`).catch(() => {});
                      }
                      setFeedback(`Affiliate link copied (${affiliate.code})!`);
                    }}
                  >
                    <Copy size={13} /> Copy Link
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3 style={{ margin: "0 0 8px" }}>Earn 5% Commission Referring Travelers to MARHABA</h3>
                <p style={{ color: "var(--text-muted)" }}>Activate your affiliate partner code to earn commissions on verified completed bookings.</p>
                <button type="button" className="btn btn-primary" onClick={joinAffiliate}>
                  Activate Affiliate Account
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "support" && (
        <div className="grid-2">
          <div className="card">
            <div className="card-body">
              <h3 style={{ margin: "0 0 12px" }}>{isAr ? "فتح تذكرة دعم" : isFr ? "Ouvrir un ticket d’assistance" : "Open a Support Ticket"}</h3>
              <form onSubmit={createTicket} style={{ display: "grid", gap: 10 }}>
                <input className="input" placeholder={isAr ? "الموضوع" : isFr ? "Sujet" : "Subject"} value={ticketSubject} onChange={(e) => setTicketSubject(e.target.value)} required minLength={4} />
                <BrandSelect
                  value={ticketCategory}
                  ariaLabel="Support Category"
                  onChange={setTicketCategory}
                  options={[
                    { value: "general", label: isAr ? "مساعدة عامة" : isFr ? "Aide générale" : "General Help" },
                    { value: "booking", label: isAr ? "مشكلة في الحجز" : isFr ? "Problème de réservation" : "Booking Issue" },
                    { value: "refund", label: isAr ? "استرداد / نزاع" : isFr ? "Remboursement / Litige" : "Refund / Dispute" },
                    { value: "partner", label: isAr ? "مساعدة الشركاء" : isFr ? "Assistance partenaire" : "Partner Assistance" },
                  ]}
                />
                <textarea className="textarea" rows={3} placeholder={isAr ? "اشرح المشكلة (10 أحرف على الأقل)..." : isFr ? "Décrivez votre demande (min 10 caractères)..." : "Describe your issue (min 10 chars)..."} value={ticketMsg} onChange={(e) => setTicketMsg(e.target.value)} required minLength={10} />
                <button type="submit" className="btn btn-primary">
                  {isAr ? "إرسال التذكرة" : isFr ? "Envoyer le ticket" : "Submit Ticket"}
                </button>
              </form>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h3 style={{ margin: "0 0 12px" }}>{isAr ? "تذاكرك" : isFr ? "Vos tickets" : "Your Tickets"}</h3>
              {tickets.length === 0 ? (
                <p style={{ color: "var(--text-muted)" }}>{isAr ? "لا توجد تذاكر دعم." : isFr ? "Aucun ticket d’assistance." : "No support tickets."}</p>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {tickets.map((tk) => (
                    <div key={tk.id} style={{ padding: 10, border: "1px solid var(--border)", borderRadius: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <strong>{tk.subject}</strong>
                        <span className="badge badge-muted">{tk.status}</span>
                      </div>
                      <div style={{ fontSize: "0.84rem", color: "var(--text-muted)", marginTop: 4 }}>{tk.description}</div>
                      {tk.admin_notes && <div style={{ fontSize: "0.82rem", color: "var(--primary)", marginTop: 4 }}>Admin: {tk.admin_notes}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "profile" && (
        <div className="card" style={{ maxWidth: 520 }}>
          <div className="card-body">
            <h3 style={{ margin: "0 0 12px" }}>{isAr ? "الملف الشخصي والأمان" : isFr ? "Profil & Sécurité" : "Profile & Security"}</h3>
            <form onSubmit={saveProfile} style={{ display: "grid", gap: 12 }}>
              <div>
                <label className="field-label">{isAr ? "الاسم الكامل" : isFr ? "Nom complet" : "Full Name"}</label>
                <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div>
                <label className="field-label">{isAr ? "رقم الهاتف" : isFr ? "Téléphone" : "Phone"}</label>
                <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <label className="field-label">{isAr ? "كلمة المرور الحالية (لتغييرها فقط)" : isFr ? "Mot de passe actuel" : "Current Password (only to change password)"}</label>
                <input className="input" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div>
                <label className="field-label">{isAr ? "كلمة المرور الجديدة (اختياري)" : isFr ? "Nouveau mot de passe (optionnel)" : "New Password (optional)"}</label>
                <input className="input" type="password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={isAr ? "8 أحرف على الأقل" : isFr ? "Min 8 caractères" : "Min 8 chars"} />
              </div>
              <button type="submit" className="btn btn-primary">
                {isAr ? "حفظ التغييرات" : isFr ? "Enregistrer" : "Save Changes"}
              </button>
            </form>

            {user.role !== "super_admin" && (
              <div style={{ marginTop: 22, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                <h4 style={{ margin: "0 0 6px", color: "var(--danger)" }}>{isAr ? "الخصوصية وحذف الحساب" : isFr ? "Confidentialité & Suppression" : "Privacy & Account Deletion"}</h4>
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "0 0 10px" }}>
                  {isAr
                    ? "إخفاء بياناتك الشخصية وتسجيل الخروج من جميع الجلسات مع حفظ سجلات الفوترة القانونية."
                    : isFr
                    ? "Anonymisez vos informations personnelles et déconnectez toutes vos sessions."
                    : "Anonymize your personal profile details and sign out across all sessions. Financial/booking audit records remain protected."}
                </p>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={async () => {
                    if (!window.confirm(isAr ? "إغلاق وإخفاء حسابك على MARHABA؟" : isFr ? "Anonymiser et fermer votre compte MARHABA ?" : "Anonymize and close your MARHABA account?")) return;
                    const res = await fetch("/api/v1/account", { method: "DELETE" });
                    if (res.ok) await refreshUser();
                  }}
                >
                  {isAr ? "حذف / إخفاء حسابي" : isFr ? "Supprimer / Anonymiser mon compte" : "Delete / Anonymize My Account"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {invoiceBooking && (
        <div className="modal-backdrop" onClick={() => setInvoiceBooking(null)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <BrandLogo size="sm" showArabic={false} />
                <h3 style={{ margin: 0 }}>{tr("bookingReceiptTitle")}</h3>
              </div>
              <button type="button" className="btn btn-sm btn-outline no-print" onClick={() => setInvoiceBooking(null)}>
                <X size={15} />
              </button>
            </div>
            <div style={{ display: "grid", gap: 8, fontSize: "0.9rem" }}>
              <div><strong>{tr("bookingRefLabel")}:</strong> {invoiceBooking.booking_ref}</div>
              <div><strong>{tr("guestLabel")}:</strong> {invoiceBooking.guest_name} ({invoiceBooking.guest_email})</div>
              <div><strong>{tr("listingCol")}:</strong> {invoiceBooking.property_title} — {tCity(lang, invoiceBooking.city)}</div>
              <div><strong>{tr("categoryLabel")}:</strong> {invoiceBooking.room_name} ({invoiceBooking.units_booked})</div>
              <div><strong>{tr("datesLabel")}:</strong> {invoiceBooking.check_in} → {invoiceBooking.check_out} ({invoiceBooking.nights} {tr("nightsLabel")})</div>
              <div><strong>{tr("statusCol")}:</strong> {invoiceBooking.status}</div>
              <hr style={{ border: "none", borderTop: "1px solid var(--border)", width: "100%" }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>{tr("subtotal")}</span><span>{money(invoiceBooking.subtotal_mad)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>{tr("discountLabel")}</span><span>-{money(invoiceBooking.discount_mad)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>{tr("taxesAndFees")}</span><span>{money(invoiceBooking.taxes_mad)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>{tr("serviceFeeLabel")}</span><span>{money(invoiceBooking.service_fee_mad)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1.1rem" }}>
                <span>{tr("total")}</span><span>{money(invoiceBooking.total_mad)}</span>
              </div>
            </div>
            <button type="button" className="btn btn-primary no-print" style={{ marginTop: 18, width: "100%" }} onClick={() => window.print()}>
              <Printer size={15} /> {tr("printReceiptBtn")}
            </button>
          </div>
        </div>
      )}

      {modifyTarget && (
        <div className="modal-backdrop" onClick={() => setModifyTarget(null)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ margin: 0 }}>Modify Dates — {modifyTarget.booking_ref}</h3>
              <button type="button" className="btn btn-sm btn-outline" onClick={() => setModifyTarget(null)}>
                <X size={15} />
              </button>
            </div>
            <form onSubmit={handleModify} style={{ display: "grid", gap: 12 }}>
              <BrandDateRangePicker
                mode="range"
                startDate={modCheckIn}
                endDate={modCheckOut}
                onChangeStart={setModCheckIn}
                onChangeEnd={setModCheckOut}
                startLabel="New Check-in"
                endLabel="New Check-out"
              />
              <button type="submit" className="btn btn-primary">
                Recalculate & Save Modification
              </button>
            </form>
          </div>
        </div>
      )}

      {reviewTarget && (
        <div className="modal-backdrop" onClick={() => setReviewTarget(null)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ margin: 0 }}>Review {reviewTarget.property_title}</h3>
              <button type="button" className="btn btn-sm btn-outline" onClick={() => setReviewTarget(null)}>
                <X size={15} />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setRevBusy(true);
                try {
                  const res = await fetch("/api/v1/reviews", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      bookingId: reviewTarget.id,
                      overallRating: revRating,
                      cleanlinessRating: revRating,
                      locationRating: revRating,
                      valueRating: revRating,
                      serviceRating: revRating,
                      comment: revComment,
                    }),
                  });
                  const d = await res.json();
                  if (!res.ok) {
                    setFeedback(d.error || "Could not submit review");
                  } else {
                    setFeedback(`Verified review published for ${reviewTarget.property_title}!`);
                    setReviewTarget(null);
                  }
                } finally {
                  setRevBusy(false);
                }
              }}
              style={{ display: "grid", gap: 12 }}
            >
              <div style={{ display: "flex", gap: 6 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`btn btn-sm ${revRating === n ? "btn-primary" : "btn-outline"}`}
                    onClick={() => setRevRating(n)}
                  >
                    <Star size={14} fill={revRating >= n ? "#f2b705" : "none"} color="#f2b705" /> {n}
                  </button>
                ))}
              </div>
              <textarea
                className="textarea"
                rows={4}
                required
                minLength={8}
                placeholder="Share what stood out about cleanliness, host hospitality, and value..."
                value={revComment}
                onChange={(e) => setRevComment(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" disabled={revBusy || revComment.trim().length < 8}>
                {revBusy ? "Publishing..." : "Publish Verified Review"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<WorkspacePageSkeleton />}>
      <AccountClient />
    </Suspense>
  );
}
