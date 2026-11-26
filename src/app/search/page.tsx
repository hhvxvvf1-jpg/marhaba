"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import {
  BedDouble,
  Car,
  CheckCircle2,
  Compass,
  Heart,
  Home as HomeIcon,
  List,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Minus,
  Plane,
  Plus,
  Search as SearchIcon,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Star,
  Tag,
  Train,
  Users,
  Utensils,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { BrandSelect } from "@/components/BrandSelect";
import { BrandDateRangePicker } from "@/components/BrandDateRangePicker";
import { getFirstImage, PropertyCard } from "@/components/PropertyCard";
import type { ExactCoords, MapProperty } from "@/components/MoroccoMap";
import { MOROCCO_CITIES, MOROCCO_REGIONS, findNearestMoroccanCity } from "@/lib/morocco-cities";
import { tAmenity, tCategory, tCity, tRegion } from "@/lib/i18n";
import { STAY_CATEGORIES } from "@/lib/stay-categories";
import { AmenityIcon, CategoryIcon } from "@/components/BrandIcons";
import { SearchPageSkeleton } from "@/components/BrandSkeletons";

const MoroccoMap = dynamic(() => import("@/components/MoroccoMap").then((m) => m.MoroccoMap), {
  ssr: false,
  loading: () => (
    <div className="skeleton-shimmer" style={{ height: 480, width: "100%", borderRadius: 16 }} />
  ),
});

interface SearchProperty extends MapProperty {
  latitude: number;
  longitude: number;
  distance_km?: number;
}

const AMENITY_OPTIONS = ["Pool", "Spa", "Wi-Fi", "Parking", "Airport", "Air conditioning", "Rooftop", "Hammam"];
const RADIUS_OPTIONS = [0, 5, 15, 30, 50, 100];
const QUICK_CITIES = ["Marrakech", "Casablanca", "Tangier", "Agadir", "Fes", "Chefchaouen", "Dakhla", "Laâyoune"];

function SearchSkeletonCard() {
  return (
    <div className="card card-body" style={{ display: "grid", gap: 10 }}>
      <div className="skeleton-shimmer" style={{ width: "100%", height: 170 }} />
      <div className="skeleton-shimmer" style={{ width: "68%", height: 18 }} />
      <div className="skeleton-shimmer" style={{ width: "44%", height: 14 }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
        <div className="skeleton-shimmer" style={{ width: 88, height: 22 }} />
        <div className="skeleton-shimmer" style={{ width: 96, height: 32, borderRadius: 999 }} />
      </div>
    </div>
  );
}

function SearchClient() {
  const searchParams = useSearchParams();
  const { lang, money, tr, wishlistIds, notify } = useApp();

  const [savedOnly, setSavedOnly] = useState(false);

  const [q, setQ] = useState(searchParams.get("q") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [region, setRegion] = useState(searchParams.get("region") || "");
  const [type, setType] = useState(searchParams.get("type") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [checkIn, setCheckIn] = useState(searchParams.get("checkIn") || "");
  const [checkOut, setCheckOut] = useState(searchParams.get("checkOut") || "");
  const [adults, setAdults] = useState(Math.max(1, Number(searchParams.get("adults") || 2) || 2));
  const [children, setChildren] = useState(Math.max(0, Number(searchParams.get("children") || 0) || 0));
  const [rooms, setRooms] = useState(Math.max(1, Number(searchParams.get("rooms") || 1) || 1));
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [minRating, setMinRating] = useState(searchParams.get("minRating") || "");
  const [freeCancellation, setFreeCancellation] = useState(searchParams.get("cancellationPolicy") === "flexible");
  const [instantBook, setInstantBook] = useState(searchParams.get("instantBook") === "true");
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get("verified") === "true");
  const [amenities, setAmenities] = useState<string[]>(
    searchParams.get("amenities") ? searchParams.get("amenities")!.split(",").filter(Boolean) : []
  );
  const [radiusKm, setRadiusKm] = useState<number>(Number(searchParams.get("radiusKm") || 0));
  const [sort, setSort] = useState(searchParams.get("sort") || "recommended");
  const [view, setView] = useState<"list" | "split" | "map">((searchParams.get("view") as "list" | "split" | "map") || "split");
  const [page, setPage] = useState(Math.max(1, Number(searchParams.get("page") || 1) || 1));

  const [guestsOpen, setGuestsOpen] = useState(false);
  const guestsRef = useRef<HTMLDivElement>(null);
  const [filtersModalOpen, setFiltersModalOpen] = useState(false);

  const [userCoords, setUserCoords] = useState<ExactCoords | null>(() => {
    const latStr = searchParams.get("lat");
    const lngStr = searchParams.get("lng");
    const accStr = searchParams.get("acc");
    if (latStr && lngStr) {
      const lat = Number(latStr);
      const lng = Number(lngStr);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng, accuracy: accStr ? Number(accStr) : undefined };
      }
    }
    return null;
  });
  const [gpsLoading, setGpsLoading] = useState(false);
  const [geoError, setGeoError] = useState("");

  const [items, setItems] = useState<SearchProperty[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedPin, setSelectedPin] = useState<SearchProperty | null>(null);

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

  useEffect(() => {
    if (!filtersModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFiltersModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filtersModalOpen]);

  const nearestCityInfo = useMemo(() => {
    if (!userCoords) return null;
    return findNearestMoroccanCity(userCoords.lat, userCoords.lng);
  }, [userCoords]);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (city) p.set("city", city);
    if (region) p.set("region", region);
    if (type) p.set("type", type);
    if (category) p.set("category", category);
    if (checkIn) p.set("checkIn", checkIn);
    if (checkOut) p.set("checkOut", checkOut);
    if (adults) p.set("adults", String(adults));
    if (children) p.set("children", String(children));
    if (rooms) p.set("rooms", String(rooms));
    if (minPrice) p.set("minPrice", minPrice);
    if (maxPrice) p.set("maxPrice", maxPrice);
    if (minRating) p.set("minRating", minRating);
    if (freeCancellation) p.set("cancellationPolicy", "flexible");
    if (instantBook) p.set("instantBook", "true");
    if (verifiedOnly) p.set("verified", "true");
    if (amenities.length) p.set("amenities", amenities.join(","));
    if (userCoords) {
      p.set("lat", userCoords.lat.toFixed(6));
      p.set("lng", userCoords.lng.toFixed(6));
      if (userCoords.accuracy) p.set("acc", String(Math.round(userCoords.accuracy)));
      if (radiusKm > 0) p.set("radiusKm", String(radiusKm));
    }
    if (sort && sort !== "recommended") p.set("sort", sort);
    if (view !== "split") p.set("view", view);
    if (page > 1) p.set("page", String(page));
    return p.toString();
  }, [
    q,
    city,
    region,
    type,
    category,
    checkIn,
    checkOut,
    adults,
    children,
    rooms,
    minPrice,
    maxPrice,
    minRating,
    freeCancellation,
    instantBook,
    verifiedOnly,
    amenities,
    userCoords,
    radiusKm,
    sort,
    view,
    page,
  ]);

  const handleExactLocation = () => {
    setGeoError("");
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError("Exact GPS geolocation is unavailable in this browser.");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        };
        setUserCoords(coords);
        setSort("nearest");
        setCity("");
        setRegion("");
        setPage(1);
        setGpsLoading(false);
        const near = findNearestMoroccanCity(coords.lat, coords.lng);
        notify(`${tCity(lang, near.city.name)} (±${coords.accuracy}m)`, "success");
      },
      (err) => {
        setGpsLoading(false);
        setGeoError(
          err.code === 1
            ? "Location permission denied. Enable browser location or select any Moroccan city below."
            : "Could not obtain exact GPS signal. Select any Moroccan city or retry."
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const clearGps = () => {
    setUserCoords(null);
    setRadiusKm(0);
    if (sort === "nearest") setSort("recommended");
    setPage(1);
  };

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const apiParams = new URLSearchParams(queryString);
      apiParams.set("limit", view === "map" ? "60" : view === "split" ? "24" : "12");
      const res = await fetch(`/api/v1/properties?${apiParams.toString()}`, { cache: "no-store" });
      const data = await res.json();
      const fetched: SearchProperty[] = data.items || [];
      setItems(fetched);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
      setSelectedPin((prev) => {
        if (prev && fetched.some((i) => i.id === prev.id)) {
          return fetched.find((i) => i.id === prev.id) || fetched[0] || null;
        }
        return fetched[0] || null;
      });
    } finally {
      setLoading(false);
    }
  }, [queryString, view]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const targetUrl = `/search${queryString ? `?${queryString}` : ""}`;
      if (`${window.location.pathname}${window.location.search}` !== targetUrl) {
        window.history.replaceState(null, "", targetUrl);
      }
    }
    fetchResults();
  }, [queryString, fetchResults]);

  function toggleAmenity(am: string) {
    setPage(1);
    setAmenities((prev) => (prev.includes(am) ? prev.filter((a) => a !== am) : [...prev, am]));
  }

  function clearFilters() {
    setQ("");
    setCity("");
    setRegion("");
    setType("");
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setMinRating("");
    setFreeCancellation(false);
    setInstantBook(false);
    setVerifiedOnly(false);
    setAmenities([]);
    setSavedOnly(false);
    setUserCoords(null);
    setRadiusKm(0);
    setSort("recommended");
    setPage(1);
  }

  const displayItems = useMemo(
    () => (savedOnly ? items.filter((i) => wishlistIds.includes(i.id)) : items),
    [items, savedOnly, wishlistIds]
  );

  const nightsCount = useMemo(() => {
    if (!checkIn || !checkOut) return 1;
    const s = new Date(`${checkIn}T00:00:00`);
    const e = new Date(`${checkOut}T00:00:00`);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 1;
    return Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400_000));
  }, [checkIn, checkOut]);

  const dateQuerySuffix = useMemo(() => {
    const p = new URLSearchParams();
    if (checkIn) p.set("checkIn", checkIn);
    if (checkOut) p.set("checkOut", checkOut);
    p.set("adults", String(adults));
    p.set("children", String(children));
    p.set("rooms", String(rooms));
    const str = p.toString();
    return str ? `?${str}` : "";
  }, [checkIn, checkOut, adults, children, rooms]);

  const filteredCities = useMemo(() => {
    if (!region) return MOROCCO_CITIES;
    return MOROCCO_CITIES.filter((c) => c.region === region);
  }, [region]);

  const activeFilterCount =
    (q ? 1 : 0) +
    (city ? 1 : 0) +
    (region ? 1 : 0) +
    (type ? 1 : 0) +
    (category ? 1 : 0) +
    (minPrice || maxPrice ? 1 : 0) +
    (minRating ? 1 : 0) +
    (freeCancellation ? 1 : 0) +
    (instantBook ? 1 : 0) +
    (verifiedOnly ? 1 : 0) +
    (userCoords ? 1 : 0) +
    amenities.length;

  const paginationControls = totalPages > 1 && (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 22 }}>
      <button
        type="button"
        className="btn btn-outline btn-sm"
        disabled={page <= 1}
        onClick={() => {
          setPage((p) => Math.max(1, p - 1));
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      >
        ‹
      </button>
      <span className="btn btn-sm" style={{ pointerEvents: "none", fontWeight: 700 }} dir="ltr">
        {page} / {totalPages}
      </span>
      <button
        type="button"
        className="btn btn-outline btn-sm"
        disabled={page >= totalPages}
        onClick={() => {
          setPage((p) => Math.min(totalPages, p + 1));
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      >
        ›
      </button>
    </div>
  );

  return (
    <div className="container" style={{ paddingTop: 18, paddingBottom: 56 }}>
      {/* Unified Instant Search & Control Header */}
      <div className="card card-body search-top-shell" style={{ marginBottom: 14, display: "grid", gap: 14 }}>
        {/* Row 1: Direct Inline Search Bar (Destination + Dates + Guests + Filters + GPS) */}
        <div className="search-inline-bar">
          <div style={{ position: "relative", minWidth: 0 }}>
            <SearchIcon
              size={15}
              style={{
                position: "absolute",
                top: "50%",
                insetInlineStart: 11,
                transform: "translateY(-50%)",
                color: "var(--primary)",
                pointerEvents: "none",
              }}
            />
            <input
              className="input"
              style={{ paddingInlineStart: 34, paddingInlineEnd: q ? 30 : 12 }}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder={tr("wherePlaceholder")}
              aria-label={tr("search.destination")}
            />
            {q && (
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  setPage(1);
                }}
                style={{
                  position: "absolute",
                  top: "50%",
                  insetInlineEnd: 8,
                  transform: "translateY(-50%)",
                  border: 0,
                  background: "transparent",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  display: "grid",
                  placeItems: "center",
                }}
                aria-label={tr("clearCompare")}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ minWidth: 0 }}>
            <BrandSelect
              value={city}
              ariaLabel={tr("search.destination")}
              onChange={(v) => {
                setCity(v);
                setPage(1);
              }}
              options={[
                { value: "", label: tr("allMoroccanCities") },
                ...filteredCities.map((c) => ({
                  value: c.name,
                  label: tCity(lang, c.name),
                  hint: tRegion(lang, c.region),
                })),
              ]}
            />
          </div>

          <div style={{ minWidth: 0 }}>
            <BrandDateRangePicker
              mode="range"
              startDate={checkIn}
              endDate={checkOut}
              onChangeStart={(d) => {
                setCheckIn(d);
                setPage(1);
              }}
              onChangeEnd={(d) => {
                setCheckOut(d);
                setPage(1);
              }}
              startLabel={tr("search.checkIn")}
              endLabel={tr("search.checkOut")}
            />
          </div>

          <div ref={guestsRef} style={{ position: "relative" }}>
            <button
              type="button"
              aria-expanded={guestsOpen}
              className={`brand-select-trigger ${guestsOpen ? "open" : ""}`}
              onClick={() => setGuestsOpen((o) => !o)}
              style={{ height: 42 }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <Users size={14} style={{ color: "var(--primary)", flexShrink: 0 }} />
                <span dir="ltr" style={{ fontVariantNumeric: "tabular-nums" }}>
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
                      <button
                        type="button"
                        className="counter-btn"
                        onClick={() => {
                          row.set((v) => Math.max(row.min, v - 1));
                          setPage(1);
                        }}
                      >
                        <Minus size={12} />
                      </button>
                      <strong style={{ minWidth: 18, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{row.val}</strong>
                      <button
                        type="button"
                        className="counter-btn"
                        onClick={() => {
                          row.set((v) => Math.min(row.max, v + 1));
                          setPage(1);
                        }}
                      >
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

          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              type="button"
              className={`btn ${activeFilterCount > 0 ? "btn-primary" : "btn-outline"}`}
              style={{ height: 42, paddingInline: 14, flex: 1, whiteSpace: "nowrap" }}
              onClick={() => setFiltersModalOpen(true)}
            >
              <SlidersHorizontal size={15} />
              <span>{tr("filtersTitle")}</span>
              {activeFilterCount > 0 && (
                <span
                  className="badge"
                  style={{
                    background: "var(--gold)",
                    color: "#111a35",
                    fontSize: "0.72rem",
                    padding: "2px 7px",
                  }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button
              type="button"
              className={`btn ${userCoords ? "btn-primary" : "btn-outline"}`}
              style={{ height: 42, paddingInline: 11 }}
              onClick={handleExactLocation}
              disabled={gpsLoading}
              title={tr("exactLocationBtn")}
              aria-label={tr("exactLocationBtn")}
            >
              <LocateFixed size={16} />
            </button>
          </div>
        </div>

        {/* Row 2: Title, Count, Fees Pill, Sort & View Switcher */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
            paddingTop: 10,
            borderTop: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h1 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "var(--text)" }}>
              {city
                ? `${tCity(lang, city)} · `
                : region
                ? `${tRegion(lang, region)} · `
                : ""}
              {tr("nav.explore")}
            </h1>
            <strong style={{ fontSize: "0.86rem", color: "var(--text)" }} dir="ltr">
              {loading ? "..." : `${total} ${tr("listingsWord")}`}
            </strong>
            <span
              className="badge"
              style={{
                background: "var(--surface-muted)",
                border: "1px solid var(--border)",
                color: "var(--text)",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Tag size={12} style={{ color: "#e11d48" }} />
              <span>{tr("pricesIncludeFees")}</span>
            </span>
            {userCoords && (
              <span className="badge badge-primary" style={{ gap: 5 }}>
                <LocateFixed size={12} />
                <span dir="ltr">{userCoords.lat.toFixed(4)}, {userCoords.lng.toFixed(4)}</span>
                {nearestCityInfo ? <span>· {tCity(lang, nearestCityInfo.city.name)}</span> : null}
              </span>
            )}
            {geoError && <span className="badge badge-warning">{geoError}</span>}
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <BrandSelect
              compact
              style={{ width: 190 }}
              ariaLabel="Sort results"
              value={sort}
              onChange={(v) => {
                setSort(v);
                setPage(1);
              }}
              options={[
                { value: "recommended", label: tr("sortRecommended") },
                ...(userCoords ? [{ value: "nearest", label: tr("sortNearest") }] : []),
                { value: "price_asc", label: tr("sortPriceAsc") },
                { value: "price_desc", label: tr("sortPriceDesc") },
                { value: "rating", label: tr("sortRating") },
                { value: "popular", label: tr("reviewsWord") },
              ]}
            />

            <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
              <button type="button" className={`btn btn-sm ${view === "list" ? "btn-primary" : ""}`} style={{ borderRadius: 0 }} onClick={() => setView("list")}>
                <List size={14} /> {tr("listView")}
              </button>
              <button type="button" className={`btn btn-sm ${view === "split" ? "btn-primary" : ""}`} style={{ borderRadius: 0 }} onClick={() => setView("split")}>
                <MapIcon size={14} /> {tr("splitView")}
              </button>
              <button type="button" className={`btn btn-sm ${view === "map" ? "btn-primary" : ""}`} style={{ borderRadius: 0 }} onClick={() => setView("map")}>
                <MapIcon size={14} /> {tr("mapView")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* All-in-One Category, Services & Quick Filter Chips Bar with Icons */}
      <div className="no-scrollbar" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 10, marginBottom: 4, alignItems: "center" }}>
        {[
          { id: "", label: tr("allCategories"), Icon: HomeIcon },
          { id: "stay", label: tr("stays"), Icon: BedDouble },
          { id: "car", label: tr("cars"), Icon: Car },
          { id: "food", label: tr("dining"), Icon: Utensils },
          { id: "exp", label: tr("experiences"), Icon: Compass },
        ].map((catChip) => {
          const Icon = catChip.Icon;
          const active = type === catChip.id;
          return (
            <button
              key={catChip.id || "all"}
              type="button"
              className={`btn btn-sm ${active ? "btn-primary" : "btn-outline"}`}
              style={{ borderRadius: 999, whiteSpace: "nowrap", gap: 6 }}
              onClick={() => {
                setType(catChip.id);
                if (catChip.id !== "stay" && catChip.id !== "") setCategory("");
                setPage(1);
              }}
            >
              <Icon size={14} style={{ color: active ? "#fff" : "var(--primary)", flexShrink: 0 }} />
              <span>{catChip.label}</span>
            </button>
          );
        })}

        {[
          { href: "/services?tab=transport", label: tr("transport"), Icon: Train },
          { href: "/services?tab=flights", label: tr("flights"), Icon: Plane },
          { href: "/services?tab=esim", label: tr("esim"), Icon: Wifi },
          { href: "/planner", label: tr("nav.planner"), Icon: Sparkles },
          { href: "/services?tab=guide", label: tr("travelGuide"), Icon: ShieldAlert },
        ].map((svc) => {
          const Icon = svc.Icon;
          return (
            <Link
              key={svc.href}
              href={svc.href}
              className="btn btn-sm btn-outline"
              style={{ borderRadius: 999, whiteSpace: "nowrap", gap: 6 }}
            >
              <Icon size={14} style={{ color: "var(--primary)", flexShrink: 0 }} />
              <span>{svc.label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          className={`btn btn-sm ${freeCancellation ? "btn-primary" : "btn-outline"}`}
          style={{ borderRadius: 999, whiteSpace: "nowrap", gap: 6 }}
          onClick={() => { setFreeCancellation((v) => !v); setPage(1); }}
        >
          <CheckCircle2 size={14} style={{ color: freeCancellation ? "#fff" : "var(--success)", flexShrink: 0 }} />
          <span>{tr("freeCancelFilter")}</span>
        </button>

        <button
          type="button"
          className={`btn btn-sm ${instantBook ? "btn-primary" : "btn-outline"}`}
          style={{ borderRadius: 999, whiteSpace: "nowrap", gap: 6 }}
          onClick={() => { setInstantBook((v) => !v); setPage(1); }}
        >
          <Zap size={14} style={{ color: instantBook ? "#fff" : "var(--gold)", flexShrink: 0 }} />
          <span>{tr("instantBook")}</span>
        </button>

        <button
          type="button"
          className={`btn btn-sm ${minRating === "4.5" ? "btn-primary" : "btn-outline"}`}
          style={{ borderRadius: 999, whiteSpace: "nowrap", gap: 6 }}
          onClick={() => { setMinRating((r) => (r === "4.5" ? "" : "4.5")); setPage(1); }}
        >
          <Star size={14} fill={minRating === "4.5" ? "#fff" : "#f2b705"} color={minRating === "4.5" ? "#fff" : "#f2b705"} style={{ flexShrink: 0 }} />
          <span>{tr("rating45Filter")}</span>
        </button>

        {wishlistIds.length > 0 && (
          <button
            type="button"
            className={`btn btn-sm ${savedOnly ? "btn-primary" : "btn-outline"}`}
            style={{ borderRadius: 999, whiteSpace: "nowrap", gap: 6 }}
            onClick={() => setSavedOnly((v) => !v)}
          >
            <Heart size={14} fill="currentColor" style={{ color: savedOnly ? "#fff" : "var(--danger)", flexShrink: 0 }} />
            <span>{tr("savedBtn")} ({wishlistIds.length})</span>
          </button>
        )}

        {activeFilterCount > 0 && (
          <button
            type="button"
            className="btn btn-sm btn-outline"
            style={{ borderRadius: 999, whiteSpace: "nowrap", color: "var(--danger)", gap: 5 }}
            onClick={clearFilters}
          >
            <X size={14} />
            <span>{tr("clearAllFilters")}</span>
          </button>
        )}
      </div>

      {/* Branded Stays Sub-Category Bar */}
      {(type === "stay" || type === "" || category !== "") && (
        <div
          className="no-scrollbar"
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 10,
            marginBottom: 8,
            alignItems: "center",
          }}
          aria-label={tr("stayCategoriesTitle")}
        >
          <button
            type="button"
            className={`btn btn-sm ${type === "stay" && category === "" ? "btn-primary" : "btn-outline"}`}
            style={{ borderRadius: 999, whiteSpace: "nowrap", gap: 5 }}
            onClick={() => {
              setType("stay");
              setCategory("");
              setPage(1);
            }}
          >
            <BedDouble size={13} />
            <span>{tr("allStayTypes")}</span>
          </button>
          {STAY_CATEGORIES.map((sc) => {
            const active = category === sc.id;
            return (
              <button
                key={sc.id}
                type="button"
                className={`btn btn-sm ${active ? "btn-primary" : "btn-outline"}`}
                style={
                  active
                    ? {
                        borderRadius: 999,
                        whiteSpace: "nowrap",
                        background: sc.accentHex,
                        borderColor: sc.accentHex,
                        color: "#fff",
                      }
                    : {
                        borderRadius: 999,
                        whiteSpace: "nowrap",
                        borderColor: sc.softBorder,
                        color: sc.badgeText,
                        background: sc.softBg,
                      }
                }
                onClick={() => {
                  if (active) {
                    setCategory("");
                  } else {
                    setType("stay");
                    setCategory(sc.id);
                  }
                  setPage(1);
                }}
              >
                <CategoryIcon category={sc.id} size={14} />
                <span>{tr(sc.labelKey)}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Active Filter Chips Summary */}
      {activeFilterCount > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
          {userCoords && (
            <button type="button" className="btn btn-sm btn-outline" style={{ borderRadius: 999 }} onClick={clearGps}>
              <LocateFixed size={12} /> {nearestCityInfo ? tCity(lang, nearestCityInfo.city.name) : "GPS"} {radiusKm > 0 ? `(${radiusKm} ${tr("kmAway")})` : ""} <X size={12} />
            </button>
          )}
          {region && (
            <button type="button" className="btn btn-sm btn-outline" style={{ borderRadius: 999 }} onClick={() => { setRegion(""); setPage(1); }}>
              {tRegion(lang, region)} <X size={12} />
            </button>
          )}
          {city && (
            <button type="button" className="btn btn-sm btn-outline" style={{ borderRadius: 999 }} onClick={() => { setCity(""); setPage(1); }}>
              {tCity(lang, city)} <X size={12} />
            </button>
          )}
          {q && (
            <button type="button" className="btn btn-sm btn-outline" style={{ borderRadius: 999 }} onClick={() => { setQ(""); setPage(1); }}>
              {q} <X size={12} />
            </button>
          )}
          {type && (
            <button type="button" className="btn btn-sm btn-outline" style={{ borderRadius: 999 }} onClick={() => { setType(""); setPage(1); }}>
              {tCategory(lang, type)} <X size={12} />
            </button>
          )}
          {category && (
            <button type="button" className="btn btn-sm btn-outline" style={{ borderRadius: 999 }} onClick={() => { setCategory(""); setPage(1); }}>
              {tCategory(lang, category)} <X size={12} />
            </button>
          )}
          {(checkIn || checkOut) && (
            <button type="button" className="btn btn-sm btn-outline" style={{ borderRadius: 999 }} onClick={() => { setCheckIn(""); setCheckOut(""); setPage(1); }}>
              {checkIn || "…"} → {checkOut || "…"} <X size={12} />
            </button>
          )}
          {(minPrice || maxPrice) && (
            <button type="button" className="btn btn-sm btn-outline" style={{ borderRadius: 999 }} onClick={() => { setMinPrice(""); setMaxPrice(""); setPage(1); }}>
              {minPrice || 0}–{maxPrice || "∞"} MAD <X size={12} />
            </button>
          )}
          {amenities.map((am) => (
            <button key={am} type="button" className="btn btn-sm btn-outline" style={{ borderRadius: 999 }} onClick={() => toggleAmenity(am)}>
              {tAmenity(lang, am)} <X size={12} />
            </button>
          ))}
        </div>
      )}

      {/* Full-Width Spacious Results + Interactive Map */}
      <section>
        {view === "split" ? (
          <div className="search-split-layout" style={{ alignItems: "start" }}>
            <div>
              <div className="search-split-cards">
                {loading && displayItems.length === 0 ? (
                  <>
                    <SearchSkeletonCard />
                    <SearchSkeletonCard />
                    <SearchSkeletonCard />
                    <SearchSkeletonCard />
                  </>
                ) : displayItems.length === 0 ? (
                  <div className="card card-body" style={{ textAlign: "center", padding: 32, gridColumn: "1 / -1", display: "grid", gap: 12 }}>
                    <p style={{ color: "var(--text-muted)", margin: 0 }}>{tr("noListingsInCategory")}</p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                      {QUICK_CITIES.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className="btn btn-sm btn-outline"
                          style={{ borderRadius: 999 }}
                          onClick={() => {
                            clearFilters();
                            setCity(c);
                          }}
                        >
                          <MapPin size={12} /> {tCity(lang, c)}
                        </button>
                      ))}
                    </div>
                    <div>
                      <button type="button" className="btn btn-sm btn-primary" onClick={clearFilters}>
                        {tr("resetBtn")}
                      </button>
                    </div>
                  </div>
                ) : (
                  displayItems.map((item) => (
                    <div
                      key={item.id}
                      onMouseEnter={() => setSelectedPin(item)}
                      onFocus={() => setSelectedPin(item)}
                    >
                      <PropertyCard
                        item={item}
                        querySuffix={dateQuerySuffix}
                        nightsCount={nightsCount}
                        isHighlighted={selectedPin?.id === item.id}
                      />
                    </div>
                  ))
                )}
              </div>
              {paginationControls}
            </div>

            <div className="card search-split-map" style={{ overflow: "hidden", position: "sticky", top: 82 }}>
              <MoroccoMap
                items={displayItems}
                selectedId={selectedPin?.id ?? null}
                onSelect={(item) => setSelectedPin(item as SearchProperty)}
                userCoords={userCoords}
                radiusKm={radiusKm}
                onRequestGps={handleExactLocation}
                gpsLoading={gpsLoading}
                height="min(620px, calc(100vh - 150px))"
                nightsCount={nightsCount}
              />

              {selectedPin && (
                <div className="card-body" style={{ display: "flex", gap: 12, alignItems: "center", borderTop: "1px solid var(--border)" }}>
                  <img src={getFirstImage(selectedPin.images_json)} alt={selectedPin.title} style={{ width: 76, height: 60, objectFit: "cover", borderRadius: 8 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text)" }}>
                      {lang === "ar" && selectedPin.title_ar ? selectedPin.title_ar : lang === "fr" && selectedPin.title_fr ? selectedPin.title_fr : selectedPin.title}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {tCity(lang, selectedPin.city)} · {money(Math.round(selectedPin.base_price_mad * nightsCount))}
                      {nightsCount > 1 ? ` (${nightsCount} ${nightsCount === 1 ? tr("nightSingular") : tr("nightPlural")})` : ""}
                      {selectedPin.distance_km !== undefined ? ` · ${selectedPin.distance_km} ${tr("kmAway")}` : ""}
                    </div>
                  </div>
                  <Link href={`/properties/${selectedPin.slug}${dateQuerySuffix}`} className="btn btn-sm btn-primary">
                    {tr("prop.bookNow")}
                  </Link>
                </div>
              )}
            </div>
          </div>
        ) : view === "map" ? (
          <div className="card" style={{ overflow: "hidden" }}>
            <MoroccoMap
              items={displayItems}
              selectedId={selectedPin?.id ?? null}
              onSelect={(item) => setSelectedPin(item as SearchProperty)}
              userCoords={userCoords}
              radiusKm={radiusKm}
              onRequestGps={handleExactLocation}
              gpsLoading={gpsLoading}
              height={580}
              nightsCount={nightsCount}
            />

            {selectedPin && (
              <div className="card-body" style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", borderTop: "1px solid var(--border)" }}>
                <img src={getFirstImage(selectedPin.images_json)} alt={selectedPin.title} style={{ width: 120, height: 84, objectFit: "cover", borderRadius: 10 }} />
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--text)" }}>
                    {lang === "ar" && selectedPin.title_ar ? selectedPin.title_ar : lang === "fr" && selectedPin.title_fr ? selectedPin.title_fr : selectedPin.title}
                  </div>
                  <div style={{ fontSize: "0.86rem", color: "var(--text-muted)" }}>
                    {tCity(lang, selectedPin.city)} · {tCategory(lang, selectedPin.category)} · <Star size={13} fill="#f2b705" color="#f2b705" /> {selectedPin.rating_avg}
                    {selectedPin.distance_km !== undefined ? ` · ${selectedPin.distance_km} ${tr("kmAway")}` : ""}
                  </div>
                </div>
                <div style={{ textAlign: "end" }}>
                  <div style={{ fontWeight: 800, fontSize: "1.15rem", color: "var(--primary)" }}>{money(selectedPin.base_price_mad)}</div>
                  <Link href={`/properties/${selectedPin.slug}${dateQuerySuffix}`} className="btn btn-sm btn-primary" style={{ marginTop: 6 }}>
                    {tr("seeAvailability")}
                  </Link>
                </div>
              </div>
            )}
          </div>
        ) : loading && displayItems.length === 0 ? (
          <div style={{ display: "grid", gap: 14 }}>
            <SearchSkeletonCard />
            <SearchSkeletonCard />
            <SearchSkeletonCard />
          </div>
        ) : displayItems.length === 0 ? (
          <div className="card">
            <div className="card-body" style={{ textAlign: "center", padding: 48, display: "grid", gap: 12 }}>
              <SearchIcon size={36} color="#94a3b8" style={{ marginInline: "auto" }} />
              <h3 style={{ margin: 0 }}>{tr("noListingsInCategory")}</h3>
              <div>
                <button type="button" className="btn btn-primary" onClick={clearFilters}>
                  {tr("resetBtn")}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gap: 14 }}>
              {displayItems.map((item) => (
                <PropertyCard key={item.id} item={item} querySuffix={dateQuerySuffix} layout="row" />
              ))}
            </div>
            {paginationControls}
          </>
        )}
      </section>

      {/* Mobile Floating Quick Map/List Toggle */}
      <button
        type="button"
        className="btn btn-primary search-mobile-map-fab"
        onClick={() => {
          setView((v) => (v === "map" ? "split" : "map"));
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      >
        {view === "map" ? <List size={15} /> : <MapIcon size={15} />}
        <span>{view === "map" ? tr("listView") : tr("mapView")}</span>
      </button>

      {/* Clean Slide-Over / Centered Filters Modal */}
      {filtersModalOpen && (
        <div className="modal-backdrop" onClick={() => setFiltersModalOpen(false)} role="dialog" aria-modal="true" aria-label={tr("filtersTitle")}>
          <div className="modal-panel" style={{ maxWidth: 640, padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "88dvh" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: "1.05rem" }}>
                <SlidersHorizontal size={17} color="var(--primary)" /> {tr("filtersTitle")}
              </strong>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button type="button" className="btn btn-sm btn-outline" onClick={clearFilters}>
                  {tr("resetBtn")}
                </button>
                <button type="button" className="btn btn-sm btn-outline" onClick={() => setFiltersModalOpen(false)} aria-label={tr("closeBtn")}>
                  <X size={16} />
                </button>
              </div>
            </div>

            <div style={{ padding: 20, overflowY: "auto", display: "grid", gap: 18 }}>
              {/* Region & City & GPS Radius */}
              <div style={{ display: "grid", gap: 10 }}>
                <div className="grid-2" style={{ gap: 10 }}>
                  <div>
                    <label className="field-label">{tr("regionFilterLabel")}</label>
                    <BrandSelect
                      value={region}
                      ariaLabel={tr("regionFilterLabel")}
                      onChange={(v) => {
                        setRegion(v);
                        setCity("");
                        setPage(1);
                      }}
                      options={[
                        { value: "", label: tr("allRegionsOption") },
                        ...MOROCCO_REGIONS.map((reg) => ({
                          value: reg,
                          label: tRegion(lang, reg),
                        })),
                      ]}
                    />
                  </div>
                  <div>
                    <label className="field-label">{tr("search.destination")}</label>
                    <BrandSelect
                      value={city}
                      ariaLabel={tr("search.destination")}
                      onChange={(v) => {
                        setCity(v);
                        setPage(1);
                      }}
                      options={[
                        { value: "", label: tr("allMoroccanCities") },
                        ...filteredCities.map((c) => ({
                          value: c.name,
                          label: `${tCity(lang, c.name)} (${tRegion(lang, c.region)})`,
                        })),
                      ]}
                    />
                  </div>
                </div>

                {userCoords && (
                  <div style={{ padding: 10, borderRadius: 10, background: "var(--surface-muted)", display: "grid", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>{tr("radiusLabel")}</span>
                      <button type="button" className="btn btn-sm btn-outline" onClick={clearGps}>
                        <X size={12} /> {tr("clearGpsBtn")}
                      </button>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {RADIUS_OPTIONS.map((rKm) => (
                        <button
                          key={rKm}
                          type="button"
                          className={`btn btn-sm ${radiusKm === rKm ? "btn-primary" : "btn-outline"}`}
                          style={{ borderRadius: 999 }}
                          onClick={() => { setRadiusKm(rKm); setPage(1); }}
                        >
                          {rKm === 0 ? tr("allKmOption") : `${rKm} ${tr("kmAway")}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Price Budget */}
              <div style={{ display: "grid", gap: 10, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label className="field-label" style={{ margin: 0 }}>{tr("budgetSliderLabel")}</label>
                  <strong style={{ fontSize: "0.86rem", color: "var(--primary)" }} dir="ltr">
                    {maxPrice ? money(Number(maxPrice)) : "∞"}
                  </strong>
                </div>
                <input
                  type="range"
                  min={200}
                  max={10000}
                  step={100}
                  value={Number(maxPrice) || 10000}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setMaxPrice(v >= 10000 ? "" : String(v));
                    setPage(1);
                  }}
                  style={{ width: "100%", accentColor: "var(--primary)" }}
                />
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {[
                    { label: `≤ ${money(500)}`, min: "", max: "500" },
                    { label: `≤ ${money(1000)}`, min: "", max: "1000" },
                    { label: `${money(1200)}+`, min: "1200", max: "" },
                  ].map((preset) => {
                    const active = minPrice === preset.min && maxPrice === preset.max;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        className={`btn btn-sm ${active ? "btn-primary" : "btn-outline"}`}
                        style={{ borderRadius: 999 }}
                        onClick={() => {
                          setMinPrice(preset.min);
                          setMaxPrice(preset.max);
                          setPage(1);
                        }}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
                <div className="grid-2" style={{ gap: 10 }}>
                  <div>
                    <label className="field-label">{tr("minPriceLabel")}</label>
                    <input className="input" type="number" placeholder="0" value={minPrice} onChange={(e) => { setMinPrice(e.target.value); setPage(1); }} />
                  </div>
                  <div>
                    <label className="field-label">{tr("maxPriceLabel")}</label>
                    <input className="input" type="number" placeholder="10000" value={maxPrice} onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }} />
                  </div>
                </div>
              </div>

              {/* Rating & Policies */}
              <div style={{ display: "grid", gap: 10, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                <div>
                  <label className="field-label">{tr("minRatingLabel")}</label>
                  <BrandSelect
                    value={minRating}
                    ariaLabel={tr("minRatingLabel")}
                    onChange={(v) => { setMinRating(v); setPage(1); }}
                    options={[
                      { value: "", label: tr("allOption") },
                      { value: "4.0", label: `4.0+ ${tr("veryGood")}` },
                      { value: "4.5", label: `4.5+ ${tr("superb")}` },
                      { value: "4.8", label: `4.8+ ${tr("exceptional")}` },
                    ]}
                  />
                </div>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: "0.86rem", cursor: "pointer" }}>
                    <input type="checkbox" checked={freeCancellation} onChange={(e) => { setFreeCancellation(e.target.checked); setPage(1); }} />
                    <span>{tr("prop.freeCancel")}</span>
                  </label>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: "0.86rem", cursor: "pointer" }}>
                    <input type="checkbox" checked={instantBook} onChange={(e) => { setInstantBook(e.target.checked); setPage(1); }} />
                    <span>{tr("instantBook")}</span>
                  </label>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: "0.86rem", cursor: "pointer" }}>
                    <input type="checkbox" checked={verifiedOnly} onChange={(e) => { setVerifiedOnly(e.target.checked); setPage(1); }} />
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <CheckCircle2 size={14} color="var(--success)" /> {tr("verifiedOnlyLabel")}
                    </span>
                  </label>
                </div>
              </div>

              {/* Amenities with Icons */}
              <div style={{ display: "grid", gap: 8, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                <label className="field-label" style={{ margin: 0 }}>{tr("amenitiesLabel")}</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {AMENITY_OPTIONS.map((am) => {
                    const active = amenities.includes(am);
                    return (
                      <button
                        key={am}
                        type="button"
                        className={`btn btn-sm ${active ? "btn-primary" : "btn-outline"}`}
                        style={{ borderRadius: 999, gap: 6 }}
                        onClick={() => toggleAmenity(am)}
                      >
                        <AmenityIcon label={am} size={13} />
                        <span>{tAmenity(lang, am)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: "0.86rem", color: "var(--text-muted)" }} dir="ltr">
                <strong style={{ color: "var(--text)" }}>{total}</strong> {tr("listingsWord")}
              </span>
              <button type="button" className="btn btn-primary" onClick={() => setFiltersModalOpen(false)}>
                {tr("doneBtn")} ({total})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageSkeleton />}>
      <SearchClient />
    </Suspense>
  );
}
