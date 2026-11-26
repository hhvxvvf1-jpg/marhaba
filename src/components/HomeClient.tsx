"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Sparkles, Plane, Train, Wifi, ShieldAlert, Car, Utensils, Compass, BedDouble, Home as HomeIcon, Users, Minus, Plus, MapPin, Navigation, Sun, X } from "lucide-react";
import { useApp } from "./AppProvider";
import { PropertyCard, type PropertyItem } from "./PropertyCard";
import { TraceImage } from "./TraceImage";
import { CategoryIcon, DiscoveryIcon, GlobalIcon, HospitalityIcon, ReliabilityIcon } from "./BrandIcons";
import { BrandDateRangePicker } from "./BrandDateRangePicker";
import { MOROCCO_CITIES, MOROCCO_REGIONS, resolveMoroccanCity } from "@/lib/morocco-cities";
import { tCity, tRegion } from "@/lib/i18n";
import { STAY_CATEGORIES, type StayCategoryId } from "@/lib/stay-categories";

interface DestinationItem {
  id: number;
  slug: string;
  name: string;
  name_fr: string;
  name_ar: string;
  region: string;
  image_url: string;
  property_count: number;
}

interface PromoItem {
  id: number;
  code: string;
  name: string;
  discount_pct: number;
  discount_fixed_mad: number;
  min_booking_mad: number;
}

export function HomeClient({
  destinations,
  featuredStays,
  cars,
  experiences,
  dining = [],
  promotions: _promotions,
}: {
  destinations: DestinationItem[];
  featuredStays: PropertyItem[];
  cars: PropertyItem[];
  experiences: PropertyItem[];
  dining?: PropertyItem[];
  promotions: PromoItem[];
}) {
  const router = useRouter();
  const { lang, tr, money, recentlyViewedIds } = useApp();
  const [recentItems, setRecentItems] = useState<PropertyItem[]>([]);
  const [staySubCat, setStaySubCat] = useState<"" | StayCategoryId>("");

  useEffect(() => {
    if (recentlyViewedIds.length === 0) return;
    const pool = [...featuredStays, ...cars, ...experiences, ...dining];
    const matched = recentlyViewedIds
      .map((id) => pool.find((p) => p.id === id))
      .filter((x): x is PropertyItem => Boolean(x))
      .slice(0, 3);
    setRecentItems(matched);
  }, [recentlyViewedIds, featuredStays, cars, experiences, dining]);

  const today = new Date();
  const dIn = new Date(today.getTime() + 7 * 86400_000).toISOString().slice(0, 10);
  const dOut = new Date(today.getTime() + 10 * 86400_000).toISOString().slice(0, 10);

  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const [checkIn, setCheckIn] = useState(dIn);
  const [checkOut, setCheckOut] = useState(dOut);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [cityMenuOpen, setCityMenuOpen] = useState(false);
  const [cityIdx, setCityIdx] = useState(0);
  const [heroSort, setHeroSort] = useState<"recommended" | "price_asc" | "rating" | "free_cancel">("recommended");
  const [showAllCities, setShowAllCities] = useState(false);
  const guestsRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!guestsOpen) return;
    const onOutside = (e: MouseEvent) => {
      if (guestsRef.current && !guestsRef.current.contains(e.target as Node)) {
        setGuestsOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setGuestsOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      window.removeEventListener("keydown", onKey);
    };
  }, [guestsOpen]);

  const citySuggestions = React.useMemo(() => {
    const query = q.trim().toLowerCase();
    return query
      ? MOROCCO_CITIES.filter(
          (c) =>
            c.name.toLowerCase().includes(query) ||
            c.nameFr.toLowerCase().includes(query) ||
            c.nameAr.includes(q.trim()) ||
            c.region.toLowerCase().includes(query) ||
            tRegion(lang, c.region).toLowerCase().includes(query) ||
            c.slug.includes(query) ||
            c.aliases.some((a) => a.toLowerCase().includes(query))
        )
      : MOROCCO_CITIES;
  }, [q, lang]);

  const stayCategoryStats = React.useMemo(() => {
    return STAY_CATEGORIES.map((cat) => {
      const matching = featuredStays.filter((p) =>
        cat.id === "riad" ? p.category === "riad" || p.category === "guesthouse" : p.category === cat.id
      );
      const minMad = matching.length > 0 ? Math.min(...matching.map((m) => m.base_price_mad)) : 0;
      return { ...cat, items: matching, count: matching.length, minMad };
    });
  }, [featuredStays]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (type) params.set("type", type);
    if (type === "stay" && staySubCat) params.set("category", staySubCat);
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    params.set("adults", String(adults));
    params.set("children", String(children));
    params.set("rooms", String(rooms));
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className="container" style={{ paddingBottom: 32 }}>
      <section className="hero">
        <img className="hero-bg" src="/images/hero-morocco.jpg" alt="Morocco hospitality skyline" fetchPriority="high" decoding="sync" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }} role="tablist" aria-label="Marketplace categories">
            {[
              { id: "", label: tr("cat.all"), Icon: HomeIcon },
              { id: "stay", label: tr("cat.stays"), Icon: BedDouble },
              { id: "car", label: tr("cat.cars"), Icon: Car },
              { id: "exp", label: tr("cat.experiences"), Icon: Compass },
              { id: "food", label: tr("cat.dining"), Icon: Utensils },
            ].map((tab) => {
              const active = type === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`btn btn-sm ${active ? "btn-gold" : "btn-outline"}`}
                  style={
                    active
                      ? { fontWeight: 800, boxShadow: "0 4px 14px rgba(242,183,5,0.38)" }
                      : { background: "rgba(255,255,255,0.14)", color: "#fff", borderColor: "rgba(255,255,255,0.28)" }
                  }
                  onClick={() => {
                    setType(tab.id);
                    if (tab.id !== "") {
                      setTimeout(() => {
                        document.getElementById("hero-filtered-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }, 40);
                    }
                  }}
                >
                  <tab.Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <h1 className="hero-title">{tr("hero.title")}</h1>
          <p className="hero-subtitle">{tr("hero.subtitle")}</p>

          <form className="search-bar" onSubmit={handleSearch}>
            <div style={{ position: "relative" }}>
              <label className="field-label">{tr("search.destination")}</label>
              <div style={{ position: "relative" }}>
                <input
                  className="input"
                  style={q ? { paddingInlineEnd: 32 } : undefined}
                  autoComplete="off"
                  placeholder={tr("wherePlaceholder")}
                  value={q}
                  onFocus={() => {
                    setCityMenuOpen(true);
                    setCityIdx(0);
                  }}
                  onBlur={() => setTimeout(() => setCityMenuOpen(false), 160)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setCityMenuOpen(false);
                    } else if (cityMenuOpen && citySuggestions.length > 0 && e.key === "ArrowDown") {
                      e.preventDefault();
                      setCityIdx((i) => Math.min(citySuggestions.length - 1, i + 1));
                    } else if (cityMenuOpen && citySuggestions.length > 0 && e.key === "ArrowUp") {
                      e.preventDefault();
                      setCityIdx((i) => Math.max(0, i - 1));
                    } else if (cityMenuOpen && citySuggestions[cityIdx] && e.key === "Enter") {
                      e.preventDefault();
                      setQ(citySuggestions[cityIdx].name);
                      setCityMenuOpen(false);
                    }
                  }}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setCityMenuOpen(true);
                    setCityIdx(0);
                  }}
                />
                {q && (
                  <button
                    type="button"
                    aria-label={tr("clearCompare")}
                    onClick={() => {
                      setQ("");
                      setCityIdx(0);
                    }}
                    style={{
                      position: "absolute",
                      top: "50%",
                      insetInlineEnd: 8,
                      transform: "translateY(-50%)",
                      border: 0,
                      background: "transparent",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: 2,
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              {cityMenuOpen && (
                <div
                  className="brand-select-menu"
                  style={{ width: "100%", minWidth: 290, padding: 6, gap: 3, maxHeight: 330, overflowY: "auto" }}
                >
                  <button
                    type="button"
                    className="brand-select-option"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      textAlign: "start",
                      background: "var(--surface-muted)",
                      borderBottom: "1px solid var(--border)",
                      marginBottom: 4,
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setCityMenuOpen(false);
                      if (typeof navigator !== "undefined" && navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            const p = new URLSearchParams();
                            p.set("lat", pos.coords.latitude.toFixed(6));
                            p.set("lng", pos.coords.longitude.toFixed(6));
                            p.set("acc", String(Math.round(pos.coords.accuracy)));
                            p.set("sort", "nearest");
                            p.set("view", "split");
                            if (type) p.set("type", type);
                            router.push(`/search?${p.toString()}`);
                          },
                          () => {
                            router.push(`/search?view=split`);
                          },
                          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                        );
                      } else {
                        router.push(`/search?view=split`);
                      }
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontWeight: 700, color: "var(--primary)" }}>
                      <Navigation size={13} />
                      <span>{tr("exactLocationBtn")}</span>
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>GPS</span>
                  </button>

                  <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", padding: "4px 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {q.trim() ? `${tr("matchingCities")} (${citySuggestions.length})` : tr("allMoroccanCities")}
                  </div>
                  {citySuggestions.map((c, idx) => {
                    const label = lang === "ar" ? c.nameAr : lang === "fr" ? c.nameFr : c.name;
                    return (
                      <button
                        key={c.slug}
                        type="button"
                        className={`brand-select-option ${idx === cityIdx ? "active" : ""}`}
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, width: "100%", textAlign: "start" }}
                        onMouseEnter={() => setCityIdx(idx)}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setQ(c.name);
                          setCityMenuOpen(false);
                        }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontWeight: 700 }}>
                          <MapPin size={13} style={{ color: idx === cityIdx ? "#fff" : "var(--primary)", flexShrink: 0 }} />
                          <span>{label}</span>
                        </span>
                        <span style={{ fontSize: "0.72rem", opacity: 0.78 }}>{tRegion(lang, c.region)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="search-bar-dates">
              <BrandDateRangePicker
                mode="range"
                startDate={checkIn}
                endDate={checkOut}
                onChangeStart={setCheckIn}
                onChangeEnd={setCheckOut}
                startLabel={tr("search.checkIn")}
                endLabel={tr("search.checkOut")}
              />
            </div>
            <div ref={guestsRef} style={{ position: "relative" }}>
              <label className="field-label">{tr("search.guests")}</label>
              <button
                type="button"
                aria-expanded={guestsOpen}
                aria-label={`${tr("adultsLabel")}: ${adults}, ${tr("childrenLabel")}: ${children}, ${tr("roomsUnitsLabel")}: ${rooms}`}
                className={`brand-select-trigger ${guestsOpen ? "open" : ""}`}
                onClick={() => setGuestsOpen((o) => !o)}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <Users size={14} style={{ color: "var(--primary)", flexShrink: 0 }} />
                  <span dir="ltr" style={{ unicodeBidi: "isolate", fontVariantNumeric: "tabular-nums" }}>
                    {adults} · {children} · {rooms}
                  </span>
                </span>
              </button>
              {guestsOpen && (
                <div className="guests-popover">
                  {[
                    { label: tr("adultsLabel"), val: adults, set: setAdults, min: 1, max: 12 },
                    { label: tr("childrenLabel"), val: children, set: setChildren, min: 0, max: 8 },
                    { label: tr("roomsUnitsLabel"), val: rooms, set: setRooms, min: 1, max: 8 },
                  ].map((row) => (
                    <div key={row.label} className="counter-box">
                      <span style={{ fontSize: "0.84rem", fontWeight: 600 }}>{row.label}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button type="button" className="counter-btn" onClick={() => row.set((v) => Math.max(row.min, v - 1))}>
                          <Minus size={12} />
                        </button>
                        <strong style={{ minWidth: 18, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{row.val}</strong>
                        <button type="button" className="counter-btn" onClick={() => row.set((v) => Math.min(row.max, v + 1))}>
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button type="button" className="btn btn-sm btn-primary" onClick={() => setGuestsOpen(false)}>
                    {tr("doneBtn")}
                  </button>
                </div>
              )}
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: 42, paddingInline: 22 }}>
              <Search size={17} />
              <span>
                {type === "car"
                  ? tr("cat.cars")
                  : type === "stay"
                  ? tr("cat.stays")
                  : type === "exp"
                  ? tr("cat.experiences")
                  : type === "food"
                  ? tr("cat.dining")
                  : tr("search.button")}
              </span>
            </button>
          </form>
        </div>
      </section>

      <section style={{ marginTop: 18 }}>
        <div
          className="no-scrollbar"
          style={{
            display: "flex",
            gap: 10,
            overflowX: "auto",
            paddingBottom: 8,
            borderBottom: "1px solid var(--border)",
          }}
        >
          {[
            { href: "/search", icon: HomeIcon, label: tr("allCategories") },
            { href: "/search?type=stay", icon: BedDouble, label: tr("stays") },
            { href: "/search?type=car", icon: Car, label: tr("cars") },
            { href: "/search?type=food", icon: Utensils, label: tr("dining") },
            { href: "/search?type=exp", icon: Compass, label: tr("experiences") },
            { href: "/services?tab=flights", icon: Plane, label: tr("flights") },
            { href: "/services?tab=transport", icon: Train, label: tr("transport") },
            { href: "/services?tab=esim", icon: Wifi, label: tr("esim") },
            { href: "/planner", icon: Sparkles, label: tr("nav.planner") },
            { href: "/services?tab=guide", icon: ShieldAlert, label: tr("travelGuide") },
          ].map((svc) => (
            <Link
              key={svc.href}
              href={svc.href}
              className="btn btn-sm btn-outline"
              style={{
                borderRadius: 999,
                whiteSpace: "nowrap",
                paddingInline: 14,
                gap: 7,
              }}
            >
              <svc.icon size={15} style={{ color: "var(--primary)" }} />
              <span>{svc.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {type !== "" && (() => {
        const pool =
          type === "stay" ? featuredStays : type === "car" ? cars : type === "exp" ? experiences : dining;
        const ql = q.trim().toLowerCase();
        const resolvedCity = q.trim() ? resolveMoroccanCity(q.trim()).toLowerCase() : "";
        const filteredBySubCat =
          type === "stay" && staySubCat
            ? pool.filter((p) =>
                staySubCat === "riad" ? p.category === "riad" || p.category === "guesthouse" : p.category === staySubCat
              )
            : pool;
        const filteredByQ = ql
          ? filteredBySubCat.filter(
              (p) =>
                p.city.toLowerCase().includes(ql) ||
                (resolvedCity ? p.city.toLowerCase() === resolvedCity : false) ||
                tCity(lang, p.city).toLowerCase().includes(ql) ||
                p.title.toLowerCase().includes(ql) ||
                (p.title_ar || "").includes(q.trim()) ||
                (p.title_fr || "").toLowerCase().includes(ql)
            )
          : filteredBySubCat;
        const baseItems = filteredByQ.length > 0 ? filteredByQ : filteredBySubCat;
        const activeItems = [...baseItems]
          .filter((p) => (heroSort === "free_cancel" ? p.cancellation_policy === "flexible" : true))
          .sort((a, b) => {
            if (heroSort === "price_asc") return a.base_price_mad - b.base_price_mad;
            if (heroSort === "rating") return (b.rating_avg || 0) - (a.rating_avg || 0);
            return 0;
          });
        const displayItems = activeItems.length > 0 ? activeItems : baseItems;
        const activeTitle =
          type === "stay"
            ? tr("home.featuredStays")
            : type === "car"
            ? tr("carsAndMobility")
            : type === "exp"
            ? tr("cat.experiences")
            : tr("cat.dining");
        return (
          <section style={{ marginTop: 26 }} id="hero-filtered-results">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="badge badge-primary" style={{ padding: "6px 10px" }}>
                  <CategoryIcon category={type === "food" ? "restaurant" : type === "exp" ? "experience" : type === "car" ? "car" : staySubCat || "riad"} size={16} />
                </span>
                <h2 style={{ margin: 0, fontSize: "1.45rem", fontWeight: 800, color: "var(--text)" }}>
                  {activeTitle}
                </h2>
                <span className="badge badge-primary">{displayItems.length}</span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="btn btn-sm btn-outline" onClick={() => setType("")}>
                  {tr("cat.all")}
                </button>
                <Link
                  href={`/search?type=${encodeURIComponent(type)}${type === "stay" && staySubCat ? `&category=${encodeURIComponent(staySubCat)}` : ""}${q.trim() ? `&q=${encodeURIComponent(q.trim())}` : ""}`}
                  className="btn btn-sm btn-primary"
                >
                  {tr("exploreAll")}
                </Link>
              </div>
            </div>
            {type === "stay" && (
              <div className="no-scrollbar" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 10, marginBottom: 4 }}>
                <button
                  type="button"
                  className={`btn btn-sm ${staySubCat === "" ? "btn-primary" : "btn-outline"}`}
                  style={{ borderRadius: 999, whiteSpace: "nowrap" }}
                  onClick={() => setStaySubCat("")}
                >
                  <BedDouble size={14} />
                  <span>{tr("allStayTypes")} ({featuredStays.length})</span>
                </button>
                {stayCategoryStats.map((cat) => {
                  const active = staySubCat === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className={`btn btn-sm ${active ? "btn-primary" : "btn-outline"}`}
                      style={
                        active
                          ? { borderRadius: 999, whiteSpace: "nowrap", background: cat.accentHex, borderColor: cat.accentHex, color: "#fff" }
                          : { borderRadius: 999, whiteSpace: "nowrap", borderColor: cat.softBorder, color: cat.badgeText, background: cat.softBg }
                      }
                      onClick={() => setStaySubCat(cat.id)}
                    >
                      <CategoryIcon category={cat.id} size={14} />
                      <span>{tr(cat.labelKey)} ({cat.count})</span>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="no-scrollbar" style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 10, marginBottom: 8 }}>
              {[
                { id: "recommended" as const, label: tr("sortRecommended") },
                { id: "price_asc" as const, label: tr("sortPriceAsc") },
                { id: "rating" as const, label: tr("sortRating") },
                { id: "free_cancel" as const, label: tr("freeCancelFilter") },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`btn btn-sm ${heroSort === s.id ? "btn-primary" : "btn-outline"}`}
                  style={{ borderRadius: 999, whiteSpace: "nowrap" }}
                  onClick={() => setHeroSort(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {type === "stay" && staySubCat === "" ? (
              <div style={{ display: "grid", gap: 30 }}>
                {STAY_CATEGORIES.map((cat) => {
                  const catItems = displayItems.filter((p) =>
                    cat.id === "riad" ? p.category === "riad" || p.category === "guesthouse" : p.category === cat.id
                  );
                  if (catItems.length === 0) return null;
                  return (
                    <div key={`hero-stay-group-${cat.id}`} style={{ paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 9,
                              background: cat.softBg,
                              border: `1px solid ${cat.softBorder}`,
                              color: cat.badgeText,
                              display: "grid",
                              placeItems: "center",
                            }}
                          >
                            <CategoryIcon category={cat.id} size={16} />
                          </span>
                          <h3 style={{ margin: 0, fontSize: "1.18rem", fontWeight: 800, color: "var(--text)" }}>{tr(cat.labelKey)}</h3>
                          <span className="badge" style={{ background: cat.softBg, color: cat.badgeText, border: `1px solid ${cat.softBorder}` }}>
                            {catItems.length}
                          </span>
                        </div>
                        <button type="button" className="btn btn-sm btn-outline" onClick={() => setStaySubCat(cat.id)}>
                          {tr("exploreAll")} · {tr(cat.labelKey)}
                        </button>
                      </div>
                      <div className="grid-3">
                        {catItems.map((item) => (
                          <PropertyCard key={`hero-tab-${type}-${item.id}`} item={item} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid-3">
                {displayItems.map((item) => (
                  <PropertyCard key={`hero-tab-${type}-${item.id}`} item={item} />
                ))}
              </div>
            )}
          </section>
        );
      })()}

      {recentItems.length > 0 && (
        <section style={{ marginTop: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800, color: "var(--text)" }}>{tr("continueWhereLeft")}</h2>
            <Link href="/search" className="btn btn-sm btn-outline">
              {tr("browseAll")}
            </Link>
          </div>
          <div className="grid-3">
            {recentItems.map((item) => (
              <PropertyCard key={`recent-${item.id}`} item={item} />
            ))}
          </div>
        </section>
      )}

      <section style={{ marginTop: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: "1.45rem", fontWeight: 800, color: "var(--text)" }}>{tr("home.destinations")}</h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button type="button" className="btn btn-sm btn-outline" onClick={() => setShowAllCities((v) => !v)}>
              {showAllCities ? tr("hide56Cities") : tr("showAll56Cities")}
            </button>
            <Link href="/search" className="btn btn-sm btn-outline">
              {tr("nav.explore")}
            </Link>
          </div>
        </div>

        {showAllCities && (
          <div className="card card-body" style={{ marginBottom: 18, padding: 16 }}>
            <div style={{ fontWeight: 800, fontSize: "0.95rem", marginBottom: 10, color: "var(--text)" }}>
              {tr("moroccoDirectoryTitle")}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 12 }}>
              {MOROCCO_REGIONS.map((region) => (
                <div key={region} style={{ padding: 10, borderRadius: 10, background: "var(--surface-muted)", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--primary)", marginBottom: 6 }}>{tRegion(lang, region)}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {MOROCCO_CITIES.filter((c) => c.region === region).map((c) => (
                      <Link
                        key={c.slug}
                        href={`/destinations/${c.slug}`}
                        style={{
                          fontSize: "0.76rem",
                          padding: "3px 8px",
                          borderRadius: 999,
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                          fontWeight: 600,
                        }}
                      >
                        {lang === "ar" ? c.nameAr : c.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid-4">
          {destinations.slice(0, 8).map((dest) => {
            const label = lang === "ar" ? dest.name_ar : lang === "fr" ? dest.name_fr : dest.name;
            return (
              <Link key={dest.id} href={`/destinations/${dest.slug}`} className="card prop-card">
                <div className="prop-img-wrap trace-wrap" style={{ aspectRatio: "16/9" }}>
                  <TraceImage className="prop-img" src={dest.image_url} alt={label} label={label} priority />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      zIndex: 2,
                      background: "linear-gradient(180deg, transparent 40%, rgba(18,25,54,0.82) 100%)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      padding: 14,
                      color: "#fff",
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: "1.08rem" }}>{label}</div>
                    <div style={{ fontSize: "0.78rem", opacity: 0.9 }}>
                      {tRegion(lang, dest.region)} · {dest.property_count} {tr("listingsWord")}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {type === "" && (
      <section style={{ marginTop: 40 }} id="stays-by-category">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800, color: "var(--text)" }}>
              {tr("stayCategoriesTitle")}
            </h2>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Link href="/services" className="btn btn-sm btn-outline">
              {tr("navServices")}
            </Link>
            <Link href={`/search?type=stay${staySubCat ? `&category=${staySubCat}` : ""}`} className="btn btn-sm btn-outline">
              {tr("viewAll")}
            </Link>
          </div>
        </div>

        {/* Sub-category filter pills inside Stays */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
          <div className="no-scrollbar" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            <button
              type="button"
              className={`btn btn-sm ${staySubCat === "" ? "btn-primary" : "btn-outline"}`}
              style={{ borderRadius: 999, whiteSpace: "nowrap" }}
              onClick={() => setStaySubCat("")}
            >
              <BedDouble size={14} />
              <span>{tr("allStayTypes")} ({featuredStays.length})</span>
            </button>
            {stayCategoryStats.map((cat) => {
              const active = staySubCat === cat.id;
              return (
                <button
                  key={`pill-${cat.id}`}
                  type="button"
                  className={`btn btn-sm ${active ? "btn-primary" : "btn-outline"}`}
                  style={
                    active
                      ? { borderRadius: 999, whiteSpace: "nowrap", background: cat.accentHex, borderColor: cat.accentHex, color: "#fff" }
                      : { borderRadius: 999, whiteSpace: "nowrap", borderColor: cat.softBorder, color: cat.badgeText, background: cat.softBg }
                  }
                  onClick={() => setStaySubCat(cat.id)}
                >
                  <CategoryIcon category={cat.id} size={14} />
                  <span>{tr(cat.labelKey)} ({cat.count})</span>
                </button>
              );
            })}
          </div>
          {staySubCat && (
            <Link href={`/search?type=stay&category=${staySubCat}`} className="btn btn-sm btn-primary">
              {tr("exploreAll")} · {tr(STAY_CATEGORIES.find((s) => s.id === staySubCat)!.labelKey)}
            </Link>
          )}
        </div>

        <div style={{ display: "grid", gap: 38 }}>
          {stayCategoryStats
            .filter((cat) => !staySubCat || cat.id === staySubCat)
            .map((cat) => (
              <div
                key={`section-${cat.id}`}
                id={`stay-cat-${cat.id}`}
                className="home-lazy-section"
                style={{
                  paddingTop: 18,
                  borderTop: "1px solid var(--border)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: cat.softBg,
                        border: `1px solid ${cat.softBorder}`,
                        color: cat.badgeText,
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <CategoryIcon category={cat.id} size={18} />
                    </span>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <h3 style={{ margin: 0, fontSize: "1.28rem", fontWeight: 800, color: "var(--text)" }}>
                          {tr(cat.labelKey)}
                        </h3>
                        <span
                          className="badge"
                          style={{ background: cat.softBg, color: cat.badgeText, border: `1px solid ${cat.softBorder}` }}
                        >
                          {cat.count}
                        </span>
                        {cat.minMad > 0 && (
                          <span className="badge badge-muted" style={{ fontSize: "0.74rem" }}>
                            {tr("fromPriceLabel")} {money(cat.minMad)}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{tr(cat.taglineKey)}</div>
                    </div>
                  </div>
                  <Link
                    href={`/search?type=stay&category=${cat.id}`}
                    className="btn btn-sm btn-outline"
                    style={{ borderColor: cat.softBorder, color: cat.badgeText }}
                  >
                    {tr("exploreAll")} · {tr(cat.labelKey)}
                  </Link>
                </div>

                <div className="grid-3">
                  {(staySubCat ? cat.items : cat.items.slice(0, 3)).map((item) => (
                    <PropertyCard key={`cat-${cat.id}-${item.id}`} item={item} />
                  ))}
                </div>
              </div>
            ))}
        </div>
      </section>
      )}

      {type === "" && experiences.length > 0 && (
      <section style={{ marginTop: 44 }} id="cat-experiences" className="home-lazy-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="badge badge-primary" style={{ padding: "7px 10px" }}>
              <CategoryIcon category="experience" size={16} />
            </span>
            <h2 style={{ margin: 0, fontSize: "1.45rem", fontWeight: 800, color: "var(--text)" }}>
              {tr("cat.experiences")}
            </h2>
            <span className="badge badge-muted">{experiences.length}</span>
          </div>
          <Link href="/search?type=exp" className="btn btn-sm btn-outline">
            {tr("exploreAll")}
          </Link>
        </div>
        <div className="grid-3">
          {experiences.slice(0, 3).map((item) => (
            <PropertyCard key={`exp-${item.id}`} item={item} />
          ))}
        </div>
      </section>
      )}

      {type === "" && cars.length > 0 && (
      <section style={{ marginTop: 44 }} id="cat-cars" className="home-lazy-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="badge badge-primary" style={{ padding: "7px 10px" }}>
              <CategoryIcon category="car" size={16} />
            </span>
            <h2 style={{ margin: 0, fontSize: "1.45rem", fontWeight: 800, color: "var(--text)" }}>
              {tr("cat.cars")}
            </h2>
            <span className="badge badge-muted">{cars.length}</span>
          </div>
          <Link href="/search?type=car" className="btn btn-sm btn-outline">
            {tr("exploreAll")}
          </Link>
        </div>
        <div className="grid-3">
          {cars.slice(0, 3).map((item) => (
            <PropertyCard key={`car-${item.id}`} item={item} />
          ))}
        </div>
      </section>
      )}

      {type === "" && dining.length > 0 && (
      <section style={{ marginTop: 44 }} id="cat-dining" className="home-lazy-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="badge badge-primary" style={{ padding: "7px 10px" }}>
              <CategoryIcon category="restaurant" size={16} />
            </span>
            <h2 style={{ margin: 0, fontSize: "1.45rem", fontWeight: 800, color: "var(--text)" }}>
              {tr("cat.dining")}
            </h2>
            <span className="badge badge-muted">{dining.length}</span>
          </div>
          <Link href="/search?type=food" className="btn btn-sm btn-outline">
            {tr("exploreAll")}
          </Link>
        </div>
        <div className="grid-3">
          {dining.slice(0, 3).map((item) => (
            <PropertyCard key={item.id} item={item} />
          ))}
        </div>
      </section>
      )}

      <section style={{ marginTop: 44 }}>
        <h2 style={{ margin: "0 0 12px", fontSize: "1.25rem", fontWeight: 800, color: "var(--text)" }}>
          {tr("exploreByExpTitle")}
        </h2>
        <div className="grid-4">
          {[
            {
              title: tr("exp1Title"),
              sub: tr("exp1Sub"),
              href: "/destinations/laayoune",
              badge: tr("exp1Badge"),
              Icon: Sun,
            },
            {
              title: tr("exp2Title"),
              sub: tr("exp2Sub"),
              href: "/destinations/dakhla",
              badge: tr("exp2Badge"),
              Icon: Compass,
            },
            {
              title: tr("exp3Title"),
              sub: tr("exp3Sub"),
              href: "/search?type=stay&q=Riad",
              badge: tr("exp3Badge"),
              Icon: BedDouble,
            },
            {
              title: tr("exp4Title"),
              sub: tr("exp4Sub"),
              href: "/search?type=car",
              badge: tr("exp4Badge"),
              Icon: Car,
            },
          ].map((col) => (
            <Link key={col.title} href={col.href} className="card card-body prop-card" style={{ display: "grid", gap: 7, textDecoration: "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="badge badge-primary">{col.badge}</span>
                <col.Icon size={16} color="var(--primary)" />
              </div>
              <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text)" }}>{col.title}</div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{col.sub}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid-4" style={{ marginTop: 22 }}>
        {[
          {
            Icon: HospitalityIcon,
            title: tr("pillar1Title"),
            desc: tr("pillar1Desc"),
          },
          {
            Icon: DiscoveryIcon,
            title: tr("pillar2Title"),
            desc: tr("pillar2Desc"),
          },
          {
            Icon: ReliabilityIcon,
            title: tr("pillar3Title"),
            desc: tr("pillar3Desc"),
          },
          {
            Icon: GlobalIcon,
            title: tr("pillar4Title"),
            desc: tr("pillar4Desc"),
          },
        ].map((v) => (
          <div key={v.title} className="card brand-zellige">
            <div className="card-body" style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ padding: 10, borderRadius: 12, background: "var(--surface-muted)", border: "1px solid var(--border)", flexShrink: 0 }}>
                <v.Icon size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{v.title}</div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 2 }}>{v.desc}</div>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section
        className="card brand-zellige"
        style={{
          marginTop: 48,
          background: "linear-gradient(135deg, var(--primary-dark), var(--navy))",
          color: "#fff",
          border: "none",
        }}
      >
        <div className="card-body" style={{ padding: 32, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 18 }}>
          <div style={{ maxWidth: 640 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <img src="/brand/emblem-only-dark.png" alt="MARHABA" style={{ height: 32, width: "auto" }} />
              <span className="badge badge-gold">MARHABA {tr("rolePartner")}</span>
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: "1.5rem", fontWeight: 800 }}>
              {tr("hostCtaTitle")}
            </h3>
            <p style={{ margin: 0, color: "#cbd5e1", fontSize: "0.95rem" }}>
              {tr("hostCtaDesc")}
            </p>
          </div>
          <Link href="/partner" className="btn btn-gold">
            {tr("home.becomePartner")}
          </Link>
        </div>
      </section>
    </div>
  );
}
