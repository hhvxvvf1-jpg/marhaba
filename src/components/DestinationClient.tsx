"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { BedDouble, Car, Compass, MapPin, Plane, Sparkles, Utensils } from "lucide-react";
import { useApp } from "./AppProvider";
import { PropertyCard, type PropertyItem } from "./PropertyCard";
import { MOROCCO_CITIES } from "@/lib/morocco-cities";
import { tRegion } from "@/lib/i18n";

export function DestinationClient({
  destination,
  items,
  allDestinations = [],
}: {
  destination: {
    slug: string;
    name: string;
    name_fr: string;
    name_ar: string;
    region: string;
    summary: string;
    summary_fr: string;
    summary_ar: string;
    image_url: string;
  };
  items: PropertyItem[];
  allDestinations?: Array<{
    slug: string;
    name: string;
    name_fr: string;
    name_ar: string;
    region: string;
    image_url: string;
  }>;
}) {
  const { lang, money, tr } = useApp();
  const [catFilter, setCatFilter] = useState("all");

  const title = lang === "ar" ? destination.name_ar : lang === "fr" ? destination.name_fr : destination.name;
  const desc = lang === "ar" ? destination.summary_ar : lang === "fr" ? destination.summary_fr : destination.summary;
  const localizedRegion = tRegion(lang, destination.region);

  const filtered = useMemo(() => {
    if (catFilter === "all") return items;
    return items.filter((i) => i.marketplace_type === catFilter);
  }, [items, catFilter]);

  const minPrice = useMemo(() => {
    if (items.length === 0) return 0;
    return Math.min(...items.map((i) => i.base_price_mad));
  }, [items]);

  const categories = [
    { id: "all", label: `${tr("allOption")} (${items.length})`, Icon: Compass },
    { id: "stay", label: `${tr("stays")} (${items.filter((i) => i.marketplace_type === "stay").length})`, Icon: BedDouble },
    { id: "car", label: `${tr("cars")} (${items.filter((i) => i.marketplace_type === "car").length})`, Icon: Car },
    { id: "food", label: `${tr("dining")} (${items.filter((i) => i.marketplace_type === "food").length})`, Icon: Utensils },
    { id: "exp", label: `${tr("experiences")} (${items.filter((i) => i.marketplace_type === "exp").length})`, Icon: Sparkles },
  ];

  const regionalCities = useMemo(
    () => MOROCCO_CITIES.filter((c) => c.region === destination.region && c.slug !== destination.slug),
    [destination.region, destination.slug]
  );

  return (
    <div className="container" style={{ paddingTop: 22, paddingBottom: 48 }}>
      <section className="hero" style={{ minHeight: 320 }}>
        <img className="hero-bg" src={destination.image_url} alt={title} />
        <div className="hero-overlay" />
        <div className="hero-content">
          <span className="badge badge-gold" style={{ marginBottom: 10 }}>
            {localizedRegion} · {tr("moroccoLabel")}
          </span>
          <h1 className="hero-title">{title}</h1>
          <p className="hero-subtitle">{desc}</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href={`/search?city=${encodeURIComponent(destination.name)}&view=split`} className="btn btn-gold">
              <MapPin size={16} /> {tr("exploreMapDates")}
            </Link>
            <Link href="/planner" className="btn btn-outline" style={{ background: "rgba(255,255,255,0.14)", color: "#fff", borderColor: "rgba(255,255,255,0.4)" }}>
              <Sparkles size={16} /> {tr("planAiTripTo")} {title}
            </Link>
            <Link href="/services?tab=flights" className="btn btn-outline" style={{ background: "rgba(255,255,255,0.14)", color: "#fff", borderColor: "rgba(255,255,255,0.4)" }}>
              <Plane size={16} /> {tr("flightsAndTransfers")}
            </Link>
          </div>
        </div>
      </section>

      <section className="kpi-grid" style={{ marginTop: 20 }}>
        <div className="kpi-card">
          <div className="kpi-label">{tr("verifiedListings")}</div>
          <div className="kpi-value">{items.length}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">{tr("startingFrom")}</div>
          <div className="kpi-value">{minPrice > 0 ? money(minPrice) : "—"}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">{tr("regionLabel")}</div>
          <div className="kpi-value" style={{ fontSize: "1.1rem" }}>{localizedRegion}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">{tr("instantBookingReviews")}</div>
          <div className="kpi-value" style={{ fontSize: "1.1rem", color: "var(--success)" }}>{tr("activeLabel")}</div>
        </div>
      </section>

      <section style={{ marginTop: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: "1.45rem", fontWeight: 800, color: "var(--text)" }}>
            {tr("verifiedListingsIn")} {title}
          </h2>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`btn btn-sm ${catFilter === cat.id ? "btn-primary" : "btn-outline"}`}
                style={{ borderRadius: 999 }}
                onClick={() => setCatFilter(cat.id)}
              >
                <cat.Icon size={14} />
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="card card-body" style={{ textAlign: "center", padding: 32 }}>
            <p style={{ color: "var(--text-muted)", margin: "0 0 12px" }}>{tr("noListingsInCategory")}</p>
            <button type="button" className="btn btn-sm btn-outline" onClick={() => setCatFilter("all")}>
              {tr("showAllListings")} ({items.length})
            </button>
          </div>
        ) : (
          <div className="grid-3">
            {filtered.map((item) => (
              <PropertyCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {regionalCities.length > 0 && (
        <section style={{ marginTop: 36 }}>
          <h3 style={{ margin: "0 0 12px", color: "var(--text)" }}>{tr("moreCitiesIn")} {localizedRegion}</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {regionalCities.map((c) => (
              <Link key={c.slug} href={`/destinations/${c.slug}`} className="btn btn-sm btn-outline" style={{ borderRadius: 999 }}>
                {lang === "ar" ? c.nameAr : lang === "fr" ? c.nameFr : c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {allDestinations.length > 1 && (
        <section style={{ marginTop: 40 }}>
          <h3 style={{ margin: "0 0 12px", color: "var(--text)" }}>{tr("exploreOtherDestinations")}</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {allDestinations
              .filter((d) => d.slug !== destination.slug)
              .map((d) => (
                <Link key={d.slug} href={`/destinations/${d.slug}`} className="btn btn-sm btn-outline" style={{ borderRadius: 999 }}>
                  {lang === "ar" ? d.name_ar : lang === "fr" ? d.name_fr : d.name}
                </Link>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
