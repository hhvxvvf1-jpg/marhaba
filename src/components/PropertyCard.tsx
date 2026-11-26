"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, Coffee, Eye, Heart, MapPin, Scale, ShieldCheck, Sparkles, Star, X } from "lucide-react";
import { useApp } from "./AppProvider";
import { AmenityIcon, CategoryIcon } from "./BrandIcons";
import { TraceImage } from "./TraceImage";
import { tAmenity, tCategory, tCity, tRegion, tUnit } from "@/lib/i18n";
import { getStayCategoryMeta } from "@/lib/stay-categories";

export interface PropertyItem {
  id: number;
  slug: string;
  title: string;
  title_fr?: string;
  title_ar?: string;
  city: string;
  region?: string;
  category: string;
  marketplace_type?: string;
  rating_avg: number;
  review_count: number;
  base_price_mad: number;
  unit_type?: string;
  images_json: string;
  amenities_json?: string;
  cancellation_policy?: string;
  verified: number;
  featured?: number;
  distance_km?: number;
}

export function getAllImages(imagesJson?: string): string[] {
  if (!imagesJson) return ["/images/hero-morocco.jpg"];
  try {
    const arr = JSON.parse(imagesJson);
    if (Array.isArray(arr) && arr.length > 0) return arr.map(String).filter(Boolean);
  } catch {
    // ignore
  }
  return ["/images/hero-morocco.jpg"];
}

export function getFirstImage(imagesJson?: string): string {
  return getAllImages(imagesJson)[0];
}

function getTopAmenities(amenitiesJson?: string): string[] {
  if (!amenitiesJson) return [];
  try {
    const arr = JSON.parse(amenitiesJson);
    if (Array.isArray(arr)) return arr.slice(0, 3).map(String);
  } catch {
    // ignore
  }
  return [];
}

function ratingLabelKey(avg: number): string {
  if (avg >= 4.8) return "exceptional";
  if (avg >= 4.5) return "superb";
  if (avg >= 4.0) return "veryGood";
  return "good";
}

export function PropertyCard({
  item,
  querySuffix = "",
  layout = "grid",
  nightsCount = 1,
  isHighlighted = false,
}: {
  item: PropertyItem;
  querySuffix?: string;
  layout?: "grid" | "row";
  nightsCount?: number;
  isHighlighted?: boolean;
}) {
  const { lang, money, wishlistIds, toggleWishlist, compareItems, toggleCompare, tr } = useApp();
  const [slide, setSlide] = useState(0);
  const [quickOpen, setQuickOpen] = useState(false);
  const isSaved = wishlistIds.includes(item.id);
  const isCompared = compareItems.some((c) => c.id === item.id);
  const localizedTitle =
    lang === "ar" && item.title_ar ? item.title_ar : lang === "fr" && item.title_fr ? item.title_fr : item.title;

  const images = useMemo(() => getAllImages(item.images_json), [item.images_json]);
  const topAmenities = useMemo(() => {
    const raw = getTopAmenities(item.amenities_json);
    const seen = new Set<string>();
    const out: string[] = [];
    for (const a of raw) {
      const label = tAmenity(lang, a);
      if (!seen.has(label)) {
        seen.add(label);
        out.push(a);
      }
    }
    return out;
  }, [item.amenities_json, lang]);

  useEffect(() => {
    if (!quickOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setQuickOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [quickOpen]);
  const imgUrl = images[slide % images.length] || "/images/hero-morocco.jpg";
  const hasBreakfast = (item.amenities_json || "").toLowerCase().includes("breakfast");
  const isGuestFavorite = (item.rating_avg || 0) >= 4.7;
  const bookingScore = Math.min(10, Math.round((item.rating_avg || 4.5) * 2 * 10) / 10).toFixed(1);
  const stayCatMeta = getStayCategoryMeta(item.category);
  const categoryBadgeStyle = stayCatMeta
    ? {
        background: stayCatMeta.softBg,
        color: stayCatMeta.badgeText,
        border: `1px solid ${stayCatMeta.softBorder}`,
        fontWeight: 700,
      }
    : undefined;

  const prevSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSlide((s) => (s - 1 + images.length) % images.length);
  };
  const nextSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSlide((s) => (s + 1) % images.length);
  };

  const photoBlock = (
    <div className="prop-img-wrap trace-wrap" style={layout === "row" ? { width: "100%", height: "100%", minHeight: 205, aspectRatio: "auto" } : undefined}>
      <Link href={`/properties/${item.slug}${querySuffix}`} style={{ display: "block", width: "100%", height: "100%" }}>
        <TraceImage className="prop-img" src={imgUrl} alt={localizedTitle} label={tCategory(lang, item.category)} />
      </Link>

      <button
        type="button"
        className={`wishlist-btn ${isSaved ? "saved" : ""}`}
        onClick={() => toggleWishlist(item.id)}
        aria-label={isSaved ? "Remove from wishlist" : "Save to wishlist"}
      >
        <Heart size={16} fill={isSaved ? "currentColor" : "none"} />
      </button>

      <button
        type="button"
        className="quick-view-btn"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setQuickOpen(true);
        }}
        title={tr("clickToExpand")}
        aria-label={tr("clickToExpand")}
      >
        <Eye size={15} />
      </button>

      <button
        type="button"
        className={`compare-btn ${isCompared ? "active" : ""}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          let allAmenities: string[] = [];
          try {
            const parsed = JSON.parse(item.amenities_json || "[]");
            if (Array.isArray(parsed)) allAmenities = parsed.map(String);
          } catch {
            // ignore
          }
          toggleCompare({
            id: item.id,
            slug: item.slug,
            title: item.title,
            title_fr: item.title_fr,
            title_ar: item.title_ar,
            city: item.city,
            region: item.region,
            category: item.category,
            rating_avg: item.rating_avg,
            review_count: item.review_count,
            base_price_mad: item.base_price_mad,
            unit_type: item.unit_type,
            image: images[0] || "/images/hero-morocco.jpg",
            cancellation_policy: item.cancellation_policy,
            verified: item.verified,
            amenities: allAmenities,
          });
        }}
        title={tr("compareBtn")}
        aria-label={tr("compareBtn")}
        aria-pressed={isCompared}
      >
        <Scale size={14} />
      </button>

      {isGuestFavorite ? (
        <span
          className="badge"
          style={{
            position: "absolute",
            top: 10,
            insetInlineStart: 10,
            background: "rgba(255,255,255,0.96)",
            color: "#111a35",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          <Sparkles size={12} color="#f2b705" /> {tr("guestFavorite")}
        </span>
      ) : item.verified === 1 ? (
        <span
          className="badge badge-primary"
          style={{ position: "absolute", top: 10, insetInlineStart: 10, background: "rgba(255,255,255,0.95)" }}
        >
          <ShieldCheck size={13} /> {tr("verifiedBadge")}
        </span>
      ) : null}

      {images.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={prevSlide}
            style={{
              position: "absolute",
              top: "50%",
              insetInlineStart: 8,
              transform: "translateY(-50%)",
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: "none",
              background: "rgba(17,26,53,0.65)",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={nextSlide}
            style={{
              position: "absolute",
              top: "50%",
              insetInlineEnd: 8,
              transform: "translateY(-50%)",
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: "none",
              background: "rgba(17,26,53,0.65)",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            <ChevronRight size={15} />
          </button>
          <div
            style={{
              position: "absolute",
              bottom: 8,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 4,
              padding: "3px 7px",
              borderRadius: 999,
              background: "rgba(17,26,53,0.45)",
            }}
          >
            {images.slice(0, 5).map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Photo ${idx + 1}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSlide(idx);
                }}
                style={{
                  width: idx === slide % images.length ? 12 : 6,
                  height: 6,
                  padding: 0,
                  border: 0,
                  cursor: "pointer",
                  borderRadius: 999,
                  background: idx === slide % images.length ? "#f2b705" : "rgba(255,255,255,0.7)",
                  transition: "all 0.15s ease",
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );

  const quickPreviewModal =
    quickOpen && typeof document !== "undefined"
      ? createPortal(
          <div className="modal-backdrop" onClick={() => setQuickOpen(false)} role="dialog" aria-modal="true" aria-label={localizedTitle}>
            <div
              className="modal-panel"
              style={{ maxWidth: 640, padding: 0, overflowY: "auto", display: "flex", flexDirection: "column" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  position: "relative",
                  aspectRatio: "16/9",
                  maxHeight: "42dvh",
                  flexShrink: 0,
                  overflow: "hidden",
                  borderRadius: "18px 18px 0 0",
                  background: "#111a35",
                }}
              >
                <img src={imgUrl} alt={localizedTitle} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => setQuickOpen(false)}
                  aria-label="Close"
                  style={{
                    position: "absolute",
                    top: 12,
                    insetInlineEnd: 12,
                    borderRadius: "50%",
                    width: 36,
                    height: 36,
                    padding: 0,
                    background: "rgba(17,26,53,0.82)",
                    color: "#fff",
                    borderColor: "rgba(255,255,255,0.32)",
                    zIndex: 3,
                  }}
                >
                  <X size={17} />
                </button>
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={prevSlide}
                      aria-label="Previous"
                      style={{
                        position: "absolute",
                        top: "50%",
                        insetInlineStart: 12,
                        transform: "translateY(-50%)",
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        border: 0,
                        background: "rgba(17,26,53,0.75)",
                        color: "#fff",
                        display: "grid",
                        placeItems: "center",
                        cursor: "pointer",
                      }}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={nextSlide}
                      aria-label="Next"
                      style={{
                        position: "absolute",
                        top: "50%",
                        insetInlineEnd: 12,
                        transform: "translateY(-50%)",
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        border: 0,
                        background: "rgba(17,26,53,0.75)",
                        color: "#fff",
                        display: "grid",
                        placeItems: "center",
                        cursor: "pointer",
                      }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </>
                )}
              </div>
              <div style={{ padding: 20, display: "grid", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                      <span className="badge badge-primary">
                        <CategoryIcon category={item.category} size={13} />
                        <span>{tCategory(lang, item.category)}</span>
                      </span>
                      {item.verified === 1 && (
                        <span className="badge badge-success">
                          <ShieldCheck size={12} /> {tr("verifiedBadge")}
                        </span>
                      )}
                    </div>
                    <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "var(--text)" }}>{localizedTitle}</h3>
                    <div style={{ fontSize: "0.86rem", color: "var(--text-muted)", marginTop: 4, display: "flex", alignItems: "center", gap: 5 }}>
                      <MapPin size={14} style={{ color: "var(--primary)", flexShrink: 0 }} />
                      <span>
                        {tCity(lang, item.city)}
                        {item.region ? ` · ${tRegion(lang, item.region)}` : ""}
                      </span>
                    </div>
                  </div>
                  <span
                    style={{
                      background: "var(--primary)",
                      color: "#fff",
                      fontWeight: 800,
                      fontSize: "0.9rem",
                      padding: "6px 10px",
                      borderRadius: "9px 9px 9px 2px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      flexShrink: 0,
                    }}
                  >
                    <Star size={13} fill="#f2b705" color="#f2b705" />
                    {bookingScore}
                  </span>
                </div>

                {topAmenities.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {topAmenities.map((a) => (
                      <span key={a} className="badge badge-muted">
                        <AmenityIcon label={a} size={12} />
                        <span>{tAmenity(lang, a)}</span>
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid var(--border)", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>{tr("fromPrice")}</span>
                    <strong style={{ fontSize: "1.3rem", color: "var(--primary)" }}>{money(item.base_price_mad)}</strong>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}> /{tUnit(lang, item.unit_type)}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" className="btn btn-sm btn-outline" onClick={() => toggleWishlist(item.id)} aria-label={isSaved ? "Remove from wishlist" : "Save to wishlist"}>
                      <Heart size={14} fill={isSaved ? "var(--danger)" : "none"} color={isSaved ? "var(--danger)" : "currentColor"} />
                    </button>
                    <Link href={`/properties/${item.slug}${querySuffix}`} className="btn btn-primary btn-sm">
                      {tr("seeAvailability")}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  if (layout === "row") {
    return (
      <article className="card prop-card prop-card-row">
        <div className="prop-row-grid">
          {photoBlock}
          <div className="card-body" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 210 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span className="badge badge-muted" style={categoryBadgeStyle}>
                    <CategoryIcon category={item.category} size={13} />
                    <span>{tCategory(lang, item.category)}</span>
                  </span>
                  <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <MapPin size={13} style={{ color: "var(--primary)" }} />
                    {tCity(lang, item.city)}
                    {item.region ? ` · ${tRegion(lang, item.region)}` : ""}
                    {typeof item.distance_km === "number" ? ` · ${item.distance_km} ${tr("kmAway")}` : ""}
                  </span>
                </div>
                <Link href={`/properties/${item.slug}${querySuffix}`} style={{ fontWeight: 800, fontSize: "1.14rem", color: "var(--text)" }}>
                  {localizedTitle}
                </Link>
              </div>

              <div style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                <div style={{ textAlign: "end", lineHeight: 1.15 }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text)" }}>{tr(ratingLabelKey(item.rating_avg || 4.5))}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{item.review_count || 0} {tr("reviewsWord")}</div>
                </div>
                <span
                  style={{
                    background: "var(--primary)",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: "0.88rem",
                    padding: "6px 9px",
                    borderRadius: "9px 9px 9px 2px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Star size={12} fill="#f2b705" color="#f2b705" />
                  {bookingScore}
                </span>
              </div>
            </div>

            {topAmenities.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {topAmenities.map((a) => (
                  <span key={a} className="badge badge-muted" style={{ fontSize: "0.72rem" }}>
                    <AmenityIcon label={a} size={12} />
                    <span>{tAmenity(lang, a)}</span>
                  </span>
                ))}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
              <div style={{ display: "grid", gap: 3, fontSize: "0.8rem" }}>
                {item.cancellation_policy === "flexible" && (
                  <span style={{ color: "var(--success)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Check size={13} /> {tr("prop.freeCancel")} · {tr("instantHold")}
                  </span>
                )}
                {hasBreakfast && (
                  <span style={{ color: "var(--warning)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Coffee size={13} /> {tr("prop.breakfast")}
                  </span>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ textAlign: "end" }}>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>{tr("fromPrice")}</div>
                  <div style={{ fontWeight: 800, fontSize: "1.22rem", color: "var(--text)" }}>
                    {money(item.base_price_mad)}{" "}
                    <span style={{ fontSize: "0.76rem", fontWeight: 500, color: "var(--text-muted)" }}>/{tUnit(lang, item.unit_type)}</span>
                  </div>
                </div>
                <Link href={`/properties/${item.slug}${querySuffix}`} className="btn btn-primary btn-sm">
                  {tr("seeAvailability")}
                </Link>
              </div>
            </div>
          </div>
        </div>
        {quickPreviewModal}
      </article>
    );
  }

  const stayNights = Math.max(1, nightsCount || 1);
  const totalDisplayPriceMad = Math.round(item.base_price_mad * stayNights);
  const compareStrikePriceMad = item.featured === 1 ? Math.round(totalDisplayPriceMad * 1.15) : 0;

  return (
    <article
      className={`card prop-card ${isHighlighted ? "prop-card-highlighted" : ""}`}
      style={isHighlighted ? { borderColor: "var(--primary)", boxShadow: "0 0 0 2px var(--primary-light), var(--shadow-md)" } : undefined}
    >
      {photoBlock}

      <div className="card-body" style={{ display: "flex", flexDirection: "column", flex: 1, gap: 7 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <span className="badge badge-muted" style={categoryBadgeStyle}>
            <CategoryIcon category={item.category} size={13} />
            <span>{tCategory(lang, item.category)}</span>
          </span>

          <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <div style={{ textAlign: "end", lineHeight: 1.15 }}>
              <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text)" }}>{tr(ratingLabelKey(item.rating_avg || 4.5))}</div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{item.review_count || 0} {tr("reviewsWord")}</div>
            </div>
            <span
              style={{
                background: "var(--primary)",
                color: "#fff",
                fontWeight: 800,
                fontSize: "0.8rem",
                padding: "4px 7px",
                borderRadius: "8px 8px 8px 2px",
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <Star size={11} fill="#f2b705" color="#f2b705" />
              {bookingScore}
            </span>
          </div>
        </div>

        <Link href={`/properties/${item.slug}${querySuffix}`} style={{ fontWeight: 700, fontSize: "1.02rem", color: "var(--text)", lineHeight: 1.3 }}>
          {localizedTitle}
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.83rem", color: "var(--text-muted)" }}>
          <MapPin size={13} style={{ color: "var(--primary)" }} />
          <span>
            {tCity(lang, item.city)}
            {item.region ? ` · ${tRegion(lang, item.region)}` : ""}
            {typeof item.distance_km === "number" ? ` · ${item.distance_km} ${tr("kmAway")}` : ""}
          </span>
        </div>

        {topAmenities.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {topAmenities.map((a) => (
              <span key={a} className="badge badge-muted" style={{ fontSize: "0.71rem", padding: "3px 8px" }}>
                <AmenityIcon label={a} size={11} />
                <span>{tAmenity(lang, a)}</span>
              </span>
            ))}
          </div>
        )}

        <div style={{ display: "grid", gap: 3, marginTop: 2, fontSize: "0.78rem" }}>
          {item.cancellation_policy === "flexible" && (
            <span style={{ color: "var(--success)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Check size={13} /> {tr("prop.freeCancel")} · {tr("noPrepayment")}
            </span>
          )}
          {hasBreakfast && (
            <span style={{ color: "var(--warning)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Coffee size={13} /> {tr("prop.breakfast")}
            </span>
          )}
        </div>

        <div style={{ marginTop: "auto", paddingTop: 10, borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div>
            {stayNights > 1 ? (
              <>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
                  {compareStrikePriceMad > totalDisplayPriceMad && (
                    <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", textDecoration: "line-through" }}>
                      {money(compareStrikePriceMad)}
                    </span>
                  )}
                  <strong style={{ fontWeight: 800, fontSize: "1.12rem", color: "var(--text)" }}>{money(totalDisplayPriceMad)}</strong>
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>
                  {tr("forNightsLabel")} {stayNights} {stayNights === 1 ? tr("nightSingular") : tr("nightPlural")}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>{tr("fromPrice")}</div>
                <div style={{ fontWeight: 800, fontSize: "1.12rem", color: "var(--text)" }}>
                  {money(item.base_price_mad)}{" "}
                  <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--text-muted)" }}>/{tUnit(lang, item.unit_type)}</span>
                </div>
              </>
            )}
          </div>
          <Link href={`/properties/${item.slug}${querySuffix}`} className="btn btn-sm btn-primary">
            {tr("prop.bookNow")}
          </Link>
        </div>
      </div>
      {quickPreviewModal}
    </article>
  );
}
