"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Gem,
  Heart,
  Info,
  Languages,
  LocateFixed,
  Lock,
  MapPin,
  MessageSquare,
  Minus,
  Plus,
  Printer,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Users,
  X,
} from "lucide-react";
import { useApp } from "./AppProvider";
import { BrandLogo } from "./BrandLogo";
import { AmenityIcon, CategoryIcon } from "./BrandIcons";
import { tAmenity, tCategory, tCity, tRegion, tUnit } from "@/lib/i18n";
import { BrandDateRangePicker } from "./BrandDateRangePicker";
import { getFirstImage, PropertyCard, type PropertyItem } from "./PropertyCard";
import type { ExactCoords } from "./MoroccoMap";

const MoroccoMap = dynamic(() => import("./MoroccoMap").then((m) => m.MoroccoMap), {
  ssr: false,
  loading: () => <div style={{ height: 320, display: "grid", placeItems: "center", background: "var(--surface-muted)" }}>Loading map...</div>,
});

interface RoomType {
  id: number;
  name: string;
  description: string;
  max_adults: number;
  max_children: number;
  total_units: number;
  base_price_mad: number;
  amenities: string[];
}

interface ReviewItem {
  id: number;
  overall_rating: number;
  comment: string;
  author_name: string;
  partner_reply?: string | null;
  created_at: string;
}

interface DuplicateBookingConflict {
  bookingId: number;
  bookingRef: string;
  propertyId: number;
  propertyTitle: string;
  propertySlug: string;
  city: string;
  category: string;
  categoryLabel: string;
  checkIn: string;
  checkOut: string;
  status: string;
  sameProperty: boolean;
}

interface QuoteResult {
  available: boolean;
  unavailableReason?: string;
  duplicateConflict?: DuplicateBookingConflict;
  nights: number;
  minAvailableUnits: number;
  subtotalMad: number;
  discountMad: number;
  promoApplied?: { code: string; name: string; discountMad: number };
  promoError?: string;
  taxesMad: number;
  serviceFeeMad: number;
  totalMad: number;
}

export function PropertyDetailClient({
  property,
  rooms,
  reviews: initialReviews,
  similar,
  initialCheckIn,
  initialCheckOut,
  initialAdults,
  initialChildren,
  initialRoomsCount,
}: {
  property: PropertyItem & {
    description: string;
    description_fr?: string;
    description_ar?: string;
    gallery?: string[];
    amenities?: string[];
    check_in_time: string;
    check_out_time: string;
    partner_name: string;
    partner_verified: string;
    partner_user_id: number;
    address: string;
    latitude?: number;
    longitude?: number;
  };
  rooms: RoomType[];
  reviews: ReviewItem[];
  similar: PropertyItem[];
  initialCheckIn: string;
  initialCheckOut: string;
  initialAdults: number;
  initialChildren: number;
  initialRoomsCount: number;
}) {
  const { lang, user, money, wishlistIds, toggleWishlist, trackRecentlyViewed, openAuthModal, tr } = useApp();
  const isSaved = wishlistIds.includes(property.id);

  useEffect(() => {
    trackRecentlyViewed(property.id);
  }, [property.id, trackRecentlyViewed]);

  const images = property.gallery?.length ? property.gallery : [getFirstImage(property.images_json)];
  const [activeImg, setActiveImg] = useState(images[0]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [userCoords, setUserCoords] = useState<ExactCoords | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const propLat = Number(property.latitude || 31.63);
  const propLng = Number(property.longitude || -8.0);
  const exactDistanceKm = userCoords
    ? Math.round(
        6371 *
          2 *
          Math.atan2(
            Math.sqrt(
              Math.sin(((propLat - userCoords.lat) * Math.PI) / 360) ** 2 +
                Math.cos((userCoords.lat * Math.PI) / 180) *
                  Math.cos((propLat * Math.PI) / 180) *
                  Math.sin(((propLng - userCoords.lng) * Math.PI) / 360) ** 2
            ),
            Math.sqrt(
              1 -
                (Math.sin(((propLat - userCoords.lat) * Math.PI) / 360) ** 2 +
                  Math.cos((userCoords.lat * Math.PI) / 180) *
                    Math.cos((propLat * Math.PI) / 180) *
                    Math.sin(((propLng - userCoords.lng) * Math.PI) / 360) ** 2)
            )
          ) *
          10
      ) / 10
    : null;

  const detectExactUserGps = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        });
        setGpsLoading(false);
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const activeImgIdx = Math.max(0, images.indexOf(activeImg));
  const stepPhoto = useCallback(
    (delta: number) => {
      if (images.length <= 1) return;
      const next = (activeImgIdx + delta + images.length) % images.length;
      setActiveImg(images[next]);
    },
    [activeImgIdx, images]
  );

  useEffect(() => {
    if (!lightboxOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxOpen(false);
      else if (e.key === "ArrowRight") stepPhoto(1);
      else if (e.key === "ArrowLeft") stepPhoto(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, stepPhoto]);

  const [selectedRoomId, setSelectedRoomId] = useState<number>(rooms[0]?.id || 0);
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [adults, setAdults] = useState(initialAdults);
  const [children, setChildren] = useState(initialChildren);
  const [roomsCount, setRoomsCount] = useState(initialRoomsCount);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedPromo = localStorage.getItem("marhaba_active_promo");
      if (savedPromo && !promoCode && !appliedPromo) {
        setPromoCode(savedPromo);
        setAppliedPromo(savedPromo);
      }
    } catch {
      // ignore
    }
  }, []);
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [quoting, setQuoting] = useState(false);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [payTiming, setPayTiming] = useState<"now" | "later">("now");
  const [showOriginal, setShowOriginal] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [editingGuests, setEditingGuests] = useState(false);
  const [guestName, setGuestName] = useState(user?.full_name || "");
  const [guestEmail, setGuestEmail] = useState(user?.email || "");
  const [guestPhone, setGuestPhone] = useState(user?.phone || "+212600000000");
  const [specialRequests, setSpecialRequests] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [paymentProvider, setPaymentProvider] = useState<"cmi" | "paypal" | "sandbox_card" | "pay_at_property">("sandbox_card");
  const [bookingBusy, setBookingBusy] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [confirmedBooking, setConfirmedBooking] = useState<{
    id: number;
    bookingRef: string;
    status: string;
    totalMad: number;
    providerMode?: string;
    roomName: string;
  } | null>(null);

  const [msgText, setMsgText] = useState("");
  const [msgStatus, setMsgStatus] = useState("");

  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [eligibleBookingId, setEligibleBookingId] = useState<number | null>(null);
  const [revRating, setRevRating] = useState(5);
  const [revComment, setRevComment] = useState("");
  const [revStatus, setRevStatus] = useState("");

  const isCar = property.marketplace_type === "car";
  const isFood = property.marketplace_type === "food";
  const isExp = property.marketplace_type === "exp";

  const dateStartLabel = isCar ? tr("pickupDate") : isExp || isFood ? tr("sessionDate") : tr("search.checkIn");
  const dateEndLabel = isCar ? tr("returnDate") : isExp || isFood ? tr("endDate") : tr("search.checkOut");
  const unitLabel = isCar ? "vehicle(s)" : isExp || isFood ? "guest package(s)" : "room(s)";

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];

  useEffect(() => {
    if (user) {
      if (!guestName) setGuestName(user.full_name);
      if (!guestEmail) setGuestEmail(user.email);
      if (!guestPhone) setGuestPhone(user.phone || "+212600000000");
      fetch("/api/v1/bookings", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          const match = (d?.bookings || []).find(
            (b: { property_id: number; status: string; has_review: number; id: number }) =>
              b.property_id === property.id && ["confirmed", "completed"].includes(b.status) && !b.has_review
          );
          if (match) setEligibleBookingId(match.id);
        })
        .catch(() => {});
    }
  }, [user, guestName, guestEmail, guestPhone, property.id]);

  const fetchQuote = useCallback(async () => {
    if (!selectedRoomId || !checkIn || !checkOut) return;
    setQuoting(true);
    try {
      const res = await fetch("/api/v1/bookings/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property.id,
          roomTypeId: selectedRoomId,
          checkIn,
          checkOut,
          adults,
          children,
          units: roomsCount,
          promoCode: appliedPromo || undefined,
          guestEmail: guestEmail || user?.email || undefined,
        }),
      });
      const data = await res.json();
      if (data.quote) setQuote(data.quote);
      else setQuote(null);
    } finally {
      setQuoting(false);
    }
  }, [property.id, selectedRoomId, checkIn, checkOut, adults, children, roomsCount, appliedPromo, guestEmail, user?.email]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    setBookingError("");
    if (!user) {
      openAuthModal("login");
      return;
    }
    if (!termsAccepted) {
      setBookingError("Please accept the provider cancellation and marketplace terms.");
      return;
    }
    setBookingBusy(true);
    try {
      const refCode = typeof window !== "undefined" ? sessionStorage.getItem("marhaba_ref") || undefined : undefined;
      const createRes = await fetch("/api/v1/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property.id,
          roomTypeId: selectedRoomId,
          checkIn,
          checkOut,
          adults,
          children,
          units: roomsCount,
          guestName,
          guestEmail,
          guestPhone,
          specialRequests,
          promoCode: appliedPromo || undefined,
          currency: "MAD",
          affiliateCode: refCode,
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) {
        setBookingError(createData.error || "Could not create reservation hold");
        return;
      }

      const payRes = await fetch(`/api/v1/bookings/${createData.bookingId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: paymentProvider, holderName: guestName }),
      });
      const payData = await payRes.json();
      if (!payRes.ok) {
        setBookingError(payData.error || "Payment step failed");
        return;
      }

      setConfirmedBooking({
        id: createData.bookingId,
        bookingRef: createData.bookingRef,
        status: payData.status,
        totalMad: createData.quote.totalMad,
        providerMode: payData.providerMode,
        roomName: selectedRoom?.name || "Standard Option",
      });
      setEligibleBookingId(createData.bookingId);
      fetchQuote();
    } catch {
      setBookingError("Network error while confirming reservation");
    } finally {
      setBookingBusy(false);
    }
  }

  async function sendMessageToHost(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      openAuthModal("login");
      return;
    }
    if (!msgText.trim()) return;
    const res = await fetch("/api/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId: property.id,
        subject: `Inquiry: ${property.title}`,
        body: msgText.trim(),
      }),
    });
    if (res.ok) {
      setMsgText("");
      setMsgStatus("Message sent to partner! View replies in Account -> Messages.");
    } else {
      const d = await res.json();
      setMsgStatus(d.error || "Failed to send message");
    }
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      openAuthModal("login");
      return;
    }
    if (!eligibleBookingId) {
      setRevStatus("Only guests with a confirmed/completed booking for this property can publish a verified review.");
      return;
    }
    setRevStatus("");
    const res = await fetch("/api/v1/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId: eligibleBookingId,
        overallRating: revRating,
        comment: revComment,
      }),
    });
    const d = await res.json();
    if (res.ok) {
      setReviews((prev) => [
        {
          id: d.reviewId || Date.now(),
          overall_rating: revRating,
          comment: revComment,
          author_name: user.full_name,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setRevComment("");
      setEligibleBookingId(null);
      setRevStatus("Thank you! Your verified review is published.");
    } else {
      setRevStatus(d.error || "Review submission failed.");
    }
  }

  const localizedTitle =
    showOriginal
      ? property.title
      : lang === "ar" && property.title_ar
      ? property.title_ar
      : lang === "fr" && property.title_fr
      ? property.title_fr
      : property.title;
  const localizedDesc =
    showOriginal
      ? property.description
      : lang === "ar" && property.description_ar
      ? property.description_ar
      : lang === "fr" && property.description_fr
      ? property.description_fr
      : property.description;
  const hasLocalizedTranslation =
    (lang === "ar" && Boolean(property.description_ar || property.title_ar)) ||
    (lang === "fr" && Boolean(property.description_fr || property.title_fr));

  const sideImages = [images[1] || images[0], images[2] || images[0]];

  return (
    <div className="container" style={{ paddingTop: 22, paddingBottom: 56 }}>
      {/* Breadcrumb + Action Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ fontSize: "0.84rem", color: "var(--text-muted)", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <Link href="/" style={{ fontWeight: 600 }}>MARHABA</Link>
          <span>/</span>
          <Link href={`/search?city=${encodeURIComponent(property.city)}`} style={{ fontWeight: 600 }}>{property.city}</Link>
          <span>/</span>
          <span style={{ color: "var(--text)" }}>{localizedTitle}</span>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={() => {
              if (typeof navigator !== "undefined" && navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href).catch(() => {});
                setShareCopied(true);
                setTimeout(() => setShareCopied(false), 2000);
              }
            }}
          >
            <Share2 size={14} />
            <span>{shareCopied ? tr("copiedBtn") : tr("shareBtn")}</span>
          </button>
          <button type="button" className="btn btn-sm btn-outline" onClick={() => toggleWishlist(property.id)}>
            <Heart size={14} fill={isSaved ? "#dc2626" : "none"} color={isSaved ? "#dc2626" : "currentColor"} />
            <span>{isSaved ? tr("savedBtn") : tr("saveBtn")}</span>
          </button>
        </div>
      </div>

      {/* Editorial Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          <span className="badge badge-primary">
            <CategoryIcon category={property.category} size={14} />
            <span>{tCategory(lang, property.category)}</span>
          </span>
          {property.verified === 1 && (
            <span className="badge badge-success">
              <ShieldCheck size={13} /> {tr("verifiedBadge")} · {property.partner_name}
            </span>
          )}
          {property.cancellation_policy === "flexible" && <span className="badge badge-success">{tr("prop.freeCancel")}</span>}
        </div>
        <h1 style={{ margin: "0 0 8px", fontSize: "clamp(1.6rem, 3.2vw, 2.35rem)", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em" }}>
          {localizedTitle}
        </h1>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: "0.9rem", color: "var(--text-muted)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <MapPin size={15} style={{ color: "var(--primary)" }} /> {property.address || `${tCity(lang, property.city)}, ${tRegion(lang, property.region)}`}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 700, color: "var(--text)" }}>
            <Star size={15} fill="#f2b705" color="#f2b705" /> {(property.rating_avg || 0).toFixed(1)}
            <span style={{ fontWeight: 500, color: "var(--text-muted)" }}>({reviews.length} {tr("reviewsWord")})</span>
          </span>
        </div>
      </div>

      {/* Bento Photo Gallery */}
      <div className="bento-gallery" style={{ marginBottom: 28 }}>
        <div className="bento-main" onClick={() => setLightboxOpen(true)}>
          <img src={activeImg} alt={localizedTitle} />
          <span
            className="badge"
            style={{
              position: "absolute",
              bottom: 14,
              insetInlineStart: 14,
              background: "rgba(18, 25, 54, 0.78)",
              color: "#fff",
              backdropFilter: "blur(6px)",
            }}
          >
            {tr("clickToExpand")} ({images.length} {tr("photosWord")})
          </span>
        </div>
        <div className="bento-side">
          {sideImages.map((img, i) => (
            <button
              key={i}
              type="button"
              className="bento-thumb"
              onClick={() => {
                setActiveImg(img);
                if (images.length === 1) setLightboxOpen(true);
              }}
            >
              <img src={img} alt={`${localizedTitle} view ${i + 2}`} />
            </button>
          ))}
        </div>
      </div>

      <div className="detail-layout">
        {/* Left Column: Rich Experience Details */}
        <div style={{ display: "grid", gap: 22 }}>
          {/* Quick Highlights Bar */}
          <div className="grid-3">
            <div className="card card-body" style={{ display: "flex", gap: 10, alignItems: "center", padding: 14 }}>
              <ShieldCheck size={20} style={{ color: "var(--success)", flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>{tr("protectedHold")}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{tr("protectedHoldSub")}</div>
              </div>
            </div>
            <div className="card card-body" style={{ display: "flex", gap: 10, alignItems: "center", padding: 14 }}>
              <Clock size={20} style={{ color: "var(--primary)", flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>{isCar ? tr("handoverReturn") : tr("checkinOut")}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{property.check_in_time} · {property.check_out_time}</div>
              </div>
            </div>
            <div className="card card-body" style={{ display: "flex", gap: 10, alignItems: "center", padding: 14 }}>
              <Sparkles size={20} style={{ color: "var(--gold)", flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>{tr("transparentPricing")}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{tr("transparentPricingSub")}</div>
              </div>
            </div>
          </div>

          {/* Airbnb-style Hosted By Trust Card */}
          <section className="card card-body" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--primary), var(--navy))",
                  color: "var(--gold)",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 900,
                  fontSize: "1.2rem",
                  flexShrink: 0,
                }}
              >
                {property.partner_name.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "1.02rem", color: "var(--text)" }}>
                  {tr("hostedBy")} {property.partner_name}
                </div>
                <div style={{ fontSize: "0.84rem", color: "var(--text-muted)" }}>
                  {property.partner_verified === "verified" ? tr("verifiedPartner") : tr("verificationPending")} · {tCity(lang, property.city)}, {tr("moroccoLabel")}
                </div>
              </div>
            </div>
            <span className="badge badge-primary">
              <ShieldCheck size={14} /> {tr("directSupport")}
            </span>
          </section>

          {/* Overview, Auto-Translation Banner, Highlights & Category Rules */}
          <section className="card card-body">
            {hasLocalizedTranslation && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8,
                  padding: "9px 12px",
                  borderRadius: 10,
                  background: "var(--surface-muted)",
                  fontSize: "0.82rem",
                  marginBottom: 14,
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-muted)" }}>
                  <Languages size={14} style={{ color: "var(--primary)" }} />
                  <span>{tr("autoTranslatedNote")}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowOriginal((v) => !v)}
                  style={{
                    background: "transparent",
                    border: 0,
                    padding: 0,
                    color: "var(--text)",
                    fontWeight: 700,
                    textDecoration: "underline",
                    cursor: "pointer",
                    fontSize: "0.82rem",
                  }}
                >
                  {showOriginal ? tr("autoTranslatedNote") : tr("showOriginalBtn")}
                </button>
              </div>
            )}

            <h2 style={{ margin: "0 0 10px", fontSize: "1.25rem", color: "var(--text)" }}>{tr("aboutThisListing")}</h2>
            <p
              style={{
                margin: "0 0 10px",
                color: "var(--text-muted)",
                lineHeight: 1.65,
                display: descExpanded ? "block" : "-webkit-box",
                WebkitLineClamp: descExpanded ? undefined : 3,
                WebkitBoxOrient: descExpanded ? undefined : "vertical",
                overflow: descExpanded ? "visible" : "hidden",
              }}
            >
              {localizedDesc}
            </p>
            {localizedDesc && localizedDesc.length > 140 && (
              <button
                type="button"
                className="btn btn-sm btn-outline"
                style={{ marginBottom: 14, borderRadius: 10 }}
                onClick={() => setDescExpanded((v) => !v)}
              >
                {descExpanded ? tr("showLessBtn") : tr("showMoreBtn")}
              </button>
            )}

            {/* City Location & Proximity Highlights */}
            <div style={{ display: "grid", gap: 6, marginBottom: 16, fontSize: "0.86rem", color: "var(--text)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}>
                <MapPin size={14} style={{ color: "#e11d48" }} />
                <span>{tCity(lang, property.city)} · {tRegion(lang, property.region)}</span>
              </div>
              <div style={{ display: "grid", gap: 4, paddingInlineStart: 4, color: "var(--text-muted)" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Check size={14} style={{ color: "var(--success)" }} />
                  {property.address || `${tCity(lang, property.city)} Center`}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Check size={14} style={{ color: "var(--success)" }} />
                  {property.cancellation_policy === "flexible" ? tr("freeCancelBefore") : tr("protectedHoldSub")}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {(property.amenities || []).map((a) => (
                <span key={a} className="badge badge-muted" style={{ padding: "6px 12px" }}>
                  <AmenityIcon label={a} size={13} /> {tAmenity(lang, a)}
                </span>
              ))}
            </div>

            <div style={{ padding: 14, borderRadius: 12, background: "var(--surface-muted)", fontSize: "0.86rem", display: "grid", gap: 6 }}>
              <strong>{tr("providerTerms")}</strong>
              {isCar ? (
                <span style={{ color: "var(--text-muted)" }}>{tr("carTerms")}</span>
              ) : isExp ? (
                <span style={{ color: "var(--text-muted)" }}>{tr("expTerms")}</span>
              ) : isFood ? (
                <span style={{ color: "var(--text-muted)" }}>{tr("foodTerms")}</span>
              ) : (
                <span style={{ color: "var(--text-muted)" }}>
                  {property.check_in_time} → {property.check_out_time} · {tr("stayTerms")}
                </span>
              )}
            </div>
          </section>

          {/* Where you'll sleep / Photo Room Preview */}
          {!isCar && !isExp && !isFood && rooms.length > 0 && (
            <section className="card card-body">
              <h2 style={{ margin: "0 0 12px", fontSize: "1.22rem", color: "var(--text)" }}>{tr("whereYouSleep")}</h2>
              <div className="grid-2" style={{ gap: 12 }}>
                {rooms.slice(0, 4).map((rm, idx) => {
                  const roomImg = images[idx % images.length] || images[0];
                  const isActive = rm.id === selectedRoomId;
                  return (
                    <button
                      key={`sleep-${rm.id}`}
                      type="button"
                      onClick={() => setSelectedRoomId(rm.id)}
                      style={{
                        textAlign: "start",
                        padding: 0,
                        borderRadius: 14,
                        overflow: "hidden",
                        border: isActive ? "2px solid var(--primary)" : "1px solid var(--border)",
                        background: "var(--surface)",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ aspectRatio: "16/10", overflow: "hidden", background: "var(--surface-muted)" }}>
                        <img src={roomImg} alt={rm.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      </div>
                      <div style={{ padding: 12, display: "grid", gap: 3 }}>
                        <div style={{ fontWeight: 800, fontSize: "0.94rem", color: "var(--text)" }}>{rm.name}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                          <BedDouble size={14} style={{ color: "var(--primary)" }} />
                          <span>
                            {rm.max_adults} {tr("adultsLabel")}
                            {rm.max_children > 0 ? ` · ${rm.max_children} ${tr("childrenLabel")}` : ""}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Interactive Room / Package Selector */}
          <section className="card card-body">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h2 style={{ margin: 0, fontSize: "1.25rem", color: "var(--text)" }}>
                {isCar ? tr("selectVehicleTier") : isExp ? tr("selectExperiencePkg") : isFood ? tr("selectMenuOption") : tr("selectRoomSuite")}
              </h2>
              <span className="badge badge-muted">{rooms.length} {tr("optionsCount")}</span>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {rooms.map((room) => {
                const selected = room.id === selectedRoomId;
                return (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRoomId(room.id)}
                    style={{
                      border: selected ? "2px solid var(--primary)" : "1px solid var(--border)",
                      borderRadius: 14,
                      padding: 16,
                      background: selected ? "var(--primary-light)" : "var(--surface)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 14,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <div style={{ fontWeight: 800, fontSize: "1.02rem", color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}>
                        {room.name}
                        {selected && <span className="badge badge-primary">{tr("selectedLabel")}</span>}
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: 3 }}>{room.description}</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                        <span className="badge badge-muted">
                          <Users size={12} /> {tr("upToAdults")} {room.max_adults} {tr("adultsLabel")}
                        </span>
                        <span className="badge badge-muted">{room.total_units} {tr("unitsTotal")}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "end" }}>
                      <div style={{ fontWeight: 800, fontSize: "1.2rem", color: "var(--primary)" }}>{money(room.base_price_mad)}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 8 }}>/{tUnit(lang, property.unit_type)}</div>
                      <button
                        type="button"
                        className={`btn btn-sm ${selected ? "btn-primary" : "btn-outline"}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRoomId(room.id);
                        }}
                      >
                        {selected ? tr("selectedLabel") : tr("chooseOption")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Direct Host Messaging */}
          <section className="card card-body">
            <h3 style={{ margin: "0 0 10px", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: 8 }}>
              <MessageSquare size={18} style={{ color: "var(--primary)" }} /> {tr("askPartner")} {property.partner_name}
            </h3>
            <form onSubmit={sendMessageToHost} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                className="input"
                style={{ flex: 1, minWidth: 220 }}
                placeholder="Ask about airport pickup, flexible check-in, child seats, or halal/dietary needs..."
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
              />
              <button type="submit" className="btn btn-outline">
                Send Inquiry
              </button>
            </form>
            {msgStatus && <div style={{ marginTop: 8, fontSize: "0.84rem", color: "var(--success)" }}>{msgStatus}</div>}
          </section>

          {/* Verified Reviews */}
          <section className="card card-body">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
              <h2 style={{ margin: 0, fontSize: "1.25rem", color: "var(--text)" }}>
                {tr("verifiedGuestReviews")} ({reviews.length})
              </h2>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    background: "var(--primary)",
                    color: "#fff",
                    fontWeight: 800,
                    padding: "5px 10px",
                    borderRadius: "9px 9px 9px 2px",
                  }}
                >
                  {(Math.min(10, (property.rating_avg || 4.5) * 2)).toFixed(1)} / 10
                </span>
                <span style={{ fontSize: "0.86rem", fontWeight: 700, color: "var(--text)" }}>
                  {(property.rating_avg || 0) >= 4.7 ? tr("exceptional") : (property.rating_avg || 0) >= 4.3 ? tr("superb") : tr("veryGood")}
                </span>
              </div>
            </div>

            {/* Booking.com-style Sub-Score Breakdown Bars */}
            <div className="grid-2" style={{ gap: 12, marginBottom: 18, padding: 14, borderRadius: 12, background: "var(--surface-muted)" }}>
              {[
                { label: tr("cleanliness"), score: Math.min(10, (property.rating_avg || 4.6) * 2) },
                { label: tr("locationScore"), score: Math.min(10, ((property.rating_avg || 4.6) + 0.1) * 2) },
                { label: tr("valueScore"), score: Math.min(10, ((property.rating_avg || 4.5) - 0.1) * 2) },
                { label: tr("communicationScore"), score: Math.min(10, ((property.rating_avg || 4.7) + 0.05) * 2) },
              ].map((bar) => (
                <div key={bar.label} style={{ display: "grid", gap: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 600 }}>
                    <span>{bar.label}</span>
                    <span>{bar.score.toFixed(1)}</span>
                  </div>
                  <div style={{ height: 7, borderRadius: 999, background: "var(--border)", overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(100, bar.score * 10)}%`, height: "100%", background: "var(--primary)", borderRadius: 999 }} />
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={submitReview} style={{ background: "var(--surface-muted)", padding: 14, borderRadius: 12, marginBottom: 18, display: "grid", gap: 10 }}>
              <strong style={{ fontSize: "0.9rem" }}>
                {tr("shareYourReview")} ({eligibleBookingId ? tr("verifiedBookingEligible") : tr("requiresConfirmedBooking")})
              </strong>
              <div className="star-picker-row" role="radiogroup" aria-label="Select rating">
                {[
                  { val: 5, label: tr("exceptional") },
                  { val: 4, label: tr("superb") },
                  { val: 3, label: tr("good") },
                  { val: 2, label: "2★" },
                  { val: 1, label: "1★" },
                ].map((opt) => {
                  const active = revRating === opt.val;
                  return (
                    <button
                      key={opt.val}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      className={`star-picker-btn ${active ? "active" : ""}`}
                      onClick={() => setRevRating(opt.val)}
                    >
                      <Star size={14} fill={active ? "#f2b705" : "none"} color={active ? "#f2b705" : "var(--text-muted)"} />
                      <span>{opt.val}</span>
                      <span style={{ fontSize: "0.74rem", fontWeight: 600, color: "var(--text-muted)" }}>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
              <textarea
                className="textarea"
                rows={2}
                placeholder="Tell future travelers about your stay or experience (min 8 chars)..."
                value={revComment}
                onChange={(e) => setRevComment(e.target.value)}
                required
                minLength={8}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{revStatus}</span>
                <button type="submit" className="btn btn-sm btn-primary">
                  Publish Review
                </button>
              </div>
            </form>

            {reviews.length === 0 ? (
              <p style={{ color: "var(--text-muted)", margin: 0 }}>No verified reviews yet for this listing.</p>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {reviews.map((rev) => (
                  <div key={rev.id} style={{ padding: 14, border: "1px solid var(--border)", borderRadius: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <strong>{rev.author_name}</strong>
                      <span className="badge badge-gold">★ {rev.overall_rating.toFixed(1)}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-muted)" }}>{rev.comment}</p>
                    {rev.partner_reply && (
                      <div style={{ marginTop: 8, padding: 10, borderRadius: 8, background: "var(--primary-light)", fontSize: "0.83rem" }}>
                        <strong>Partner Reply:</strong> {rev.partner_reply}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Exact Location & Interactive Map */}
          <section className="card" style={{ overflow: "hidden" }}>
            <div className="card-body" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.18rem", display: "flex", alignItems: "center", gap: 7 }}>
                  <MapPin size={17} color="var(--primary)" /> {tCity(lang, property.city)} · {tRegion(lang, property.region)}
                </h2>
                <div style={{ fontSize: "0.84rem", color: "var(--text-muted)", marginTop: 3 }}>
                  {property.address} · <span dir="ltr">{propLat.toFixed(5)}, {propLng.toFixed(5)}</span>
                  {exactDistanceKm !== null ? (
                    <strong style={{ color: "var(--primary)", marginInlineStart: 8 }}>
                      · {exactDistanceKm} {tr("kmAway")}
                    </strong>
                  ) : null}
                </div>
              </div>
              <button type="button" className="btn btn-sm btn-outline" onClick={detectExactUserGps} disabled={gpsLoading}>
                <LocateFixed size={14} />
                <span>{gpsLoading ? tr("detectingGps") : tr("exactLocationBtn")}</span>
              </button>
            </div>
            <MoroccoMap
              items={[{ ...property, latitude: propLat, longitude: propLng }]}
              selectedId={property.id}
              onSelect={() => {}}
              userCoords={userCoords}
              onRequestGps={detectExactUserGps}
              gpsLoading={gpsLoading}
              height={320}
            />
          </section>
        </div>

        {/* Right Column: Interactive 3-Step Guided Reservation Checkout */}
        <aside id="booking-panel" className="card" style={{ position: "sticky", top: 84, boxShadow: "var(--shadow-lg)" }}>
          <div className="card-body" style={{ padding: 20 }}>
            {confirmedBooking ? (
              <div className="voucher-card" style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <BrandLogo size="sm" showArabic={false} />
                  <span className="badge badge-success">
                    <CheckCircle2 size={14} /> {confirmedBooking.status.toUpperCase()}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: "0.76rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>
                    Digital Reservation Voucher
                  </div>
                  <h3 style={{ margin: "2px 0 0", color: "var(--text)", fontSize: "1.3rem" }}>{confirmedBooking.bookingRef}</h3>
                </div>
                <div style={{ fontSize: "0.86rem", display: "grid", gap: 4, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                  <div><strong>Listing:</strong> {localizedTitle}</div>
                  <div><strong>Option:</strong> {confirmedBooking.roomName}</div>
                  <div><strong>Dates:</strong> {checkIn} → {checkOut}</div>
                  <div><strong>Guest:</strong> {guestName}</div>
                  <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--primary)", marginTop: 4 }}>
                    Total: {money(confirmedBooking.totalMad)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                  <Link href="/account" className="btn btn-primary" style={{ flex: 1 }}>
                    Manage in My Account
                  </Link>
                  <button type="button" className="btn btn-outline" onClick={() => window.print()}>
                    <Printer size={15} /> Print
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Price Banner with Brand Emblem */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <img src="/brand/emblem-only.png" alt="MARHABA" className="brand-img-light" style={{ height: 22, width: "auto" }} />
                    <img src="/brand/emblem-only-dark.png" alt="MARHABA" className="brand-img-dark" style={{ height: 22, width: "auto" }} />
                    <div>
                      <span style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--primary)" }}>
                        {quote?.available ? money(Math.round(quote.subtotalMad / Math.max(1, quote.nights))) : money(selectedRoom?.base_price_mad || property.base_price_mad)}
                      </span>
                      <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}> / {tUnit(lang, property.unit_type)}</span>
                    </div>
                  </div>
                  {quote?.available && <span className="badge badge-success">{quote.minAvailableUnits} available</span>}
                </div>

                {/* Rare find scarcity banner */}
                {(property.rating_avg >= 4.7 || (quote && quote.minAvailableUnits <= 2)) && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "9px 12px",
                      borderRadius: 12,
                      background: "rgba(225, 29, 72, 0.08)",
                      border: "1px solid rgba(225, 29, 72, 0.2)",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: "var(--text)",
                      marginBottom: 12,
                    }}
                  >
                    <Gem size={16} style={{ color: "#e11d48", flexShrink: 0 }} />
                    <span>{tr("rareFindLabel")}</span>
                  </div>
                )}

                {/* 3-Step Reservation Stepper (Screenshot 2 flow) */}
                <div className="stepper-bar" role="tablist" aria-label="Reservation steps">
                  <button type="button" className={`step-pill ${step === 1 ? "active" : step > 1 ? "done" : ""}`} onClick={() => setStep(1)}>
                    {tr("chooseWhenToPay")}
                  </button>
                  <button
                    type="button"
                    className={`step-pill ${step === 2 ? "active" : step > 2 ? "done" : ""}`}
                    onClick={() => quote?.available && !quote?.duplicateConflict && setStep(2)}
                  >
                    {tr("addPaymentMethod")}
                  </button>
                  <button
                    type="button"
                    className={`step-pill ${step === 3 ? "active" : ""}`}
                    onClick={() => quote?.available && !quote?.duplicateConflict && guestName && guestEmail && setStep(3)}
                  >
                    {tr("reviewReservation")}
                  </button>
                </div>

                {/* STEP 1: Choose When to Pay + Dates, Guests & Price Details */}
                {step === 1 && (
                  <div style={{ display: "grid", gap: 12 }}>
                    <BrandDateRangePicker
                      mode="range"
                      align="end"
                      startDate={checkIn}
                      endDate={checkOut}
                      onChangeStart={setCheckIn}
                      onChangeEnd={setCheckOut}
                      startLabel={dateStartLabel}
                      endLabel={dateEndLabel}
                    />

                    {/* Compact Guests Row with Change toggle */}
                    <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>{tr("guestsLabel")}</div>
                          <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>
                            {adults} {tr("adultsLabel")}
                            {children > 0 ? ` · ${children} ${tr("childrenLabel")}` : ""} · {roomsCount} {unitLabel}
                          </div>
                        </div>
                        <button type="button" className="btn btn-sm btn-outline" onClick={() => setEditingGuests((v) => !v)}>
                          {editingGuests ? tr("doneBtn") : tr("changeBtn")}
                        </button>
                      </div>

                      {editingGuests && (
                        <div style={{ display: "grid", gap: 8, marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                          <div className="counter-box">
                            <span style={{ fontSize: "0.84rem", fontWeight: 600 }}>{tr("adultsLabel")}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <button type="button" className="counter-btn" onClick={() => setAdults((a) => Math.max(1, a - 1))}>
                                <Minus size={13} />
                              </button>
                              <strong>{adults}</strong>
                              <button type="button" className="counter-btn" onClick={() => setAdults((a) => Math.min(12, a + 1))}>
                                <Plus size={13} />
                              </button>
                            </div>
                          </div>

                          <div className="counter-box">
                            <span style={{ fontSize: "0.84rem", fontWeight: 600 }}>{tr("childrenLabel")}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <button type="button" className="counter-btn" onClick={() => setChildren((c) => Math.max(0, c - 1))}>
                                <Minus size={13} />
                              </button>
                              <strong>{children}</strong>
                              <button type="button" className="counter-btn" onClick={() => setChildren((c) => Math.min(8, c + 1))}>
                                <Plus size={13} />
                              </button>
                            </div>
                          </div>

                          <div className="counter-box">
                            <span style={{ fontSize: "0.84rem", fontWeight: 600, textTransform: "capitalize" }}>{tr("roomsUnitsLabel")}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <button type="button" className="counter-btn" onClick={() => setRoomsCount((u) => Math.max(1, u - 1))}>
                                <Minus size={13} />
                              </button>
                              <strong>{roomsCount}</strong>
                              <button type="button" className="counter-btn" onClick={() => setRoomsCount((u) => Math.min(8, u + 1))}>
                                <Plus size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Choose When to Pay Radio Options (Screenshot 2) */}
                    {quote?.available && (
                      <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
                        <label
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 10,
                            padding: "11px 13px",
                            cursor: "pointer",
                            background: payTiming === "now" ? "var(--primary-light)" : "var(--surface)",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 800, fontSize: "0.88rem", color: "var(--text)" }}>
                              {tr("payFullNow")} · {money(quote.totalMad)}
                            </div>
                          </div>
                          <input
                            type="radio"
                            name="payTiming"
                            checked={payTiming === "now"}
                            onChange={() => {
                              setPayTiming("now");
                              if (paymentProvider === "pay_at_property") setPaymentProvider("sandbox_card");
                            }}
                          />
                        </label>

                        {property.cancellation_policy === "flexible" && (
                          <label
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              gap: 10,
                              padding: "11px 13px",
                              borderTop: "1px solid var(--border)",
                              cursor: "pointer",
                              background: payTiming === "later" ? "var(--primary-light)" : "var(--surface)",
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 800, fontSize: "0.88rem", color: "var(--text)" }}>
                                {tr("payZeroNow")}
                              </div>
                              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>
                                {money(quote.totalMad)} · {tr("payLaterNote")}
                              </div>
                            </div>
                            <input
                              type="radio"
                              name="payTiming"
                              checked={payTiming === "later"}
                              onChange={() => {
                                setPayTiming("later");
                                setPaymentProvider("pay_at_property");
                              }}
                              style={{ marginTop: 3 }}
                            />
                          </label>
                        )}
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 6 }}>
                      <input className="input" placeholder={`${tr("promoCodeLabel")} (MARHABA10)`} value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => setAppliedPromo(promoCode.trim().toUpperCase())}>
                        <Tag size={14} /> {tr("applyBtn")}
                      </button>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>Promo:</span>
                      {["MARHABA10", "SAHARA15", "FIRST200"].map((code) => (
                        <button
                          key={code}
                          type="button"
                          className={`btn btn-sm ${appliedPromo === code ? "btn-primary" : "btn-outline"}`}
                          style={{ padding: "2px 8px", fontSize: "0.72rem", borderRadius: 999 }}
                          onClick={() => {
                            setPromoCode(code);
                            setAppliedPromo(code);
                          }}
                        >
                          {code}
                        </button>
                      ))}
                    </div>
                    {quote?.promoError && <div style={{ fontSize: "0.8rem", color: "var(--danger)" }}>{quote.promoError}</div>}

                    {quoting ? (
                      <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Checking live availability & taxes...</div>
                    ) : quote && !quote.available ? (
                      <div className="badge badge-danger" style={{ padding: 10, borderRadius: 10 }}>
                        {quote.unavailableReason || "Unavailable for selected dates/occupancy"}
                      </div>
                    ) : quote ? (
                      <div style={{ background: "var(--surface-muted)", padding: 14, borderRadius: 12, fontSize: "0.86rem", display: "grid", gap: 6 }}>
                        <strong style={{ fontSize: "0.84rem", marginBottom: 2 }}>{tr("priceDetailsLabel")}</strong>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span>
                            {quote.nights} {property.unit_type || "night"}(s) × {roomsCount}
                          </span>
                          <strong>{money(quote.subtotalMad)}</strong>
                        </div>
                        {quote.discountMad > 0 && (
                          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--success)" }}>
                            <span>Promo {quote.promoApplied ? `(${quote.promoApplied.code})` : ""}</span>
                            <strong>-{money(quote.discountMad)}</strong>
                          </div>
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span>VAT & Tourist Taxes</span>
                          <span>{money(quote.taxesMad)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span>Platform Service Fee</span>
                          <span>{money(quote.serviceFeeMad)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: 8, fontSize: "1.06rem", fontWeight: 800, color: "var(--text)" }}>
                          <span>{tr("estimatedTotal")}</span>
                          <span style={{ color: "var(--primary)" }}>{money(quote.totalMad)}</span>
                        </div>
                      </div>
                    ) : null}

                    {quote?.duplicateConflict && (
                      <div
                        style={{
                          padding: 12,
                          borderRadius: 12,
                          border: "1.5px solid var(--warning)",
                          background: "var(--warning-bg)",
                          display: "grid",
                          gap: 8,
                          fontSize: "0.84rem",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, color: "var(--text)" }}>
                          <ShieldAlert size={17} style={{ color: "var(--warning)", flexShrink: 0 }} />
                          <span>{tr("duplicateBlocked")}</span>
                        </div>
                        <div style={{ color: "var(--text)" }}>
                          <strong>{quote.duplicateConflict.bookingRef}</strong> ({quote.duplicateConflict.propertyTitle},{" "}
                          {quote.duplicateConflict.checkIn} → {quote.duplicateConflict.checkOut})
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <Link href="/account" className="btn btn-sm btn-primary">
                            {tr("manageInAccount")}
                          </Link>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline"
                            onClick={() => {
                              const nextStart = quote.duplicateConflict!.checkOut;
                              const stayLen = Math.max(1, quote.nights || 2);
                              const endDt = new Date(new Date(`${nextStart}T00:00:00Z`).getTime() + stayLen * 86400000)
                                .toISOString()
                                .slice(0, 10);
                              setCheckIn(nextStart);
                              setCheckOut(endDt);
                            }}
                          >
                            {tr("shiftDatesPast")} {quote.duplicateConflict.checkOut}
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={!quote?.available || Boolean(quote?.duplicateConflict) || quoting}
                      style={{ width: "100%", paddingBlock: 12 }}
                      onClick={() => {
                        if (!user) {
                          openAuthModal("login");
                          return;
                        }
                        setStep(2);
                      }}
                    >
                      <span>
                        {quote?.duplicateConflict
                          ? tr("duplicateBlocked")
                          : user
                          ? tr("nextBtn")
                          : tr("signInToReserve")}
                      </span>
                      <ArrowRight size={16} />
                    </button>

                    <div style={{ fontSize: "0.78rem", color: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <Check size={14} />
                      <span>
                        {property.cancellation_policy === "flexible"
                          ? tr("freeCancelBefore")
                          : `${tr("protectedHold")} · ${tr("transparentPricing")}`}
                      </span>
                    </div>
                  </div>
                )}

                {/* STEP 2: Add Payment Method & Guest Details */}
                {step === 2 && (
                  <div style={{ display: "grid", gap: 11 }}>
                    <div style={{ display: "grid", gap: 7 }}>
                      {[
                        { id: "sandbox_card", title: "Card Checkout (Sandbox)", sub: "Visa / Mastercard · Instant confirmation" },
                        { id: "cmi", title: "CMI Morocco (Sandbox)", sub: "Moroccan local bank card" },
                        { id: "paypal", title: "PayPal Express (Sandbox)", sub: "International wallet" },
                        { id: "pay_at_property", title: "Pay at Property", sub: "Pay 0 now · Settle upon arrival" },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          className={`pay-option-card ${paymentProvider === opt.id ? "selected" : ""}`}
                          onClick={() => setPaymentProvider(opt.id as typeof paymentProvider)}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "0.86rem", color: "var(--text)" }}>{opt.title}</div>
                            <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>{opt.sub}</div>
                          </div>
                          <CreditCard size={17} style={{ color: paymentProvider === opt.id ? "var(--primary)" : "var(--text-muted)" }} />
                        </button>
                      ))}
                    </div>

                    <div>
                      <label className="field-label">{tr("leadGuestName")}</label>
                      <input className="input" value={guestName} onChange={(e) => setGuestName(e.target.value)} required />
                    </div>
                    <div>
                      <label className="field-label">{tr("confirmEmail")}</label>
                      <input className="input" type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} required />
                    </div>
                    <div>
                      <label className="field-label">{tr("phoneWhatsapp")}</label>
                      <input className="input" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} required />
                    </div>
                    <div>
                      <label className="field-label">{tr("specialRequests")}</label>
                      <textarea className="textarea" rows={2} placeholder="..." value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} />
                    </div>
                    <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: "0.82rem", color: "var(--text-muted)" }}>
                      <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} style={{ marginTop: 3 }} />
                      <span>
                        {tr("acceptTerms")} (<Link href="/legal/terms" style={{ color: "var(--primary)", textDecoration: "underline" }}>{tr("providerTerms")}</Link>)
                      </span>
                    </label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>
                        <ArrowLeft size={15} /> {tr("backBtn")}
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ flex: 1 }}
                        disabled={!guestName.trim() || !guestEmail.trim() || !guestPhone.trim() || !termsAccepted}
                        onClick={() => setStep(3)}
                      >
                        <span>{tr("nextBtn")}</span>
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Review Your Reservation & Confirm */}
                {step === 3 && (
                  <form onSubmit={handleBook} style={{ display: "grid", gap: 11 }}>
                    {/* Compact Property Summary Card (Screenshot 2 right card) */}
                    <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 12, display: "grid", gap: 10 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <img
                          src={images[0]}
                          alt={localizedTitle}
                          style={{ width: 64, height: 64, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "var(--text)" }}>{localizedTitle}</div>
                          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                            <Star size={12} fill="#f2b705" color="#f2b705" />
                            <span>{(property.rating_avg || 4.8).toFixed(1)} ({reviews.length})</span>
                            <span>· {selectedRoom?.name}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: "0.8rem", borderTop: "1px solid var(--border)", paddingTop: 8, display: "grid", gap: 6 }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--text-muted)" }}>{tr("search.checkIn")} → {tr("search.checkOut")}</span>
                          <strong>{checkIn} → {checkOut}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--text-muted)" }}>{tr("guestsLabel")}</span>
                          <strong>{adults} {tr("adultsLabel")}{children > 0 ? `, ${children} ${tr("childrenLabel")}` : ""}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--text-muted)" }}>{tr("estimatedTotal")}</span>
                          <strong style={{ color: "var(--primary)" }}>{quote?.available ? money(quote.totalMad) : "..."}</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: 10, borderRadius: 10, background: "var(--warning-bg)", fontSize: "0.8rem", display: "flex", gap: 8 }}>
                      <Info size={15} style={{ flexShrink: 0, marginTop: 2 }} />
                      <span>{tr("sandboxNotice")}</span>
                    </div>

                    {bookingError && (
                      <div className="badge badge-danger" style={{ padding: 9, borderRadius: 9 }}>
                        {bookingError}
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      <button type="button" className="btn btn-outline" onClick={() => setStep(2)}>
                        <ArrowLeft size={15} /> {tr("backBtn")}
                      </button>
                      <button type="submit" className="btn btn-gold" disabled={bookingBusy || !quote?.available} style={{ flex: 1, paddingBlock: 12 }}>
                        <Lock size={15} />
                        <span>
                          {bookingBusy
                            ? tr("feedbackSubmitting")
                            : `${tr("confirmPayBtn")} (${payTiming === "later" ? money(0) : quote?.available ? money(quote.totalMad) : "..."})`}
                        </span>
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </aside>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div className="modal-backdrop" onClick={() => setLightboxOpen(false)}>
          <div className="modal-panel" style={{ maxWidth: 920, padding: 14 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <strong>{localizedTitle}</strong>
                <span className="badge badge-muted">
                  {activeImgIdx + 1} / {images.length}
                </span>
              </div>
              <button type="button" className="btn btn-sm btn-outline" onClick={() => setLightboxOpen(false)} aria-label="Close gallery">
                <X size={16} />
              </button>
            </div>
            <div style={{ position: "relative" }}>
              <img src={activeImg} alt={`${localizedTitle} photo ${activeImgIdx + 1}`} style={{ width: "100%", maxHeight: "66vh", objectFit: "cover", borderRadius: 12 }} />
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous photo"
                    className="btn btn-sm btn-outline"
                    onClick={() => stepPhoto(-1)}
                    style={{ position: "absolute", top: "50%", insetInlineStart: 12, transform: "translateY(-50%)", borderRadius: "50%", width: 38, height: 38, padding: 0, background: "rgba(17,26,53,0.78)", color: "#fff", borderColor: "rgba(255,255,255,0.25)" }}
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label="Next photo"
                    className="btn btn-sm btn-outline"
                    onClick={() => stepPhoto(1)}
                    style={{ position: "absolute", top: "50%", insetInlineEnd: 12, transform: "translateY(-50%)", borderRadius: "50%", width: 38, height: 38, padding: 0, background: "rgba(17,26,53,0.78)", color: "#fff", borderColor: "rgba(255,255,255,0.25)" }}
                  >
                    <ArrowRight size={16} />
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="no-scrollbar" style={{ display: "flex", gap: 8, overflowX: "auto", marginTop: 10, paddingBottom: 2 }}>
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImg(img)}
                    style={{
                      padding: 0,
                      borderRadius: 8,
                      overflow: "hidden",
                      border: idx === activeImgIdx ? "2px solid var(--primary)" : "2px solid transparent",
                      flexShrink: 0,
                      cursor: "pointer",
                      background: "transparent",
                    }}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} style={{ width: 72, height: 52, objectFit: "cover", display: "block" }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {similar.length > 0 && (
        <section style={{ marginTop: 44 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: "1.35rem", fontWeight: 800, color: "var(--text)" }}>
            Similar Verified Options in {tCity(lang, property.city)}
          </h2>
          <div className="grid-3">
            {similar.map((s) => (
              <PropertyCard key={s.id} item={s} />
            ))}
          </div>
        </section>
      )}

      {/* Mobile Sticky Quick-Reserve Dock */}
      {!confirmedBooking && (
        <div className="mobile-reserve-dock">
          <div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>{tr("fromPrice")}</div>
            <div style={{ fontWeight: 800, fontSize: "1.06rem", color: "var(--text)" }}>
              {quote?.available ? money(quote.totalMad) : money(selectedRoom?.base_price_mad || property.base_price_mad)}{" "}
              <span style={{ fontSize: "0.74rem", fontWeight: 500, color: "var(--text-muted)" }}>
                {quote?.available ? `(${quote.nights})` : `/ ${tUnit(lang, property.unit_type)}`}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-gold btn-sm"
            onClick={() => document.getElementById("booking-panel")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          >
            {tr("reserveNow")}
          </button>
        </div>
      )}
    </div>
  );
}
