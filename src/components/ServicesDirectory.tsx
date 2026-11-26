"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  BedDouble,
  Car,
  Compass,
  Plane,
  ShieldAlert,
  Sparkles,
  Train,
  Utensils,
  Wifi,
} from "lucide-react";
import { useApp } from "./AppProvider";
import { TraceImage } from "./TraceImage";
import { CategoryIcon } from "./BrandIcons";
import { STAY_CATEGORIES, type StayCategoryId } from "@/lib/stay-categories";

interface ListingLight {
  id: number;
  marketplace_type: string;
  category?: string;
  base_price_mad: number;
}

interface ServiceCardItem {
  key: string;
  title: string;
  desc: string;
  image: string;
  badgeText: string;
  pricePill?: string;
  color: string;
  href?: string;
  tabTarget?: "transport" | "flights" | "esim" | "guide";
  stayCatId?: StayCategoryId;
}

export function ServicesDirectory({
  onSelectTab,
}: {
  onSelectTab: (tab: "transport" | "flights" | "esim" | "guide") => void;
}) {
  const { tr, money } = useApp();
  const [listings, setListings] = useState<ListingLight[]>([]);

  useEffect(() => {
    fetch("/api/v1/marketplace/home")
      .then((r) => r.json())
      .then((d) => {
        const merged: ListingLight[] = [
          ...(Array.isArray(d.popularStays) ? d.popularStays : []),
          ...(Array.isArray(d.cars) ? d.cars : []),
          ...(Array.isArray(d.experiences) ? d.experiences : []),
        ];
        setListings(merged);
      })
      .catch(() => {});
  }, []);

  const stayStats = STAY_CATEGORIES.map((cat) => {
    const matched = listings.filter(
      (p) =>
        p.marketplace_type === "stay" &&
        ((p.category || "").toLowerCase() === cat.id ||
          (cat.id === "riad" && (p.category || "").toLowerCase() === "guesthouse"))
    );
    const defaultMin: Record<StayCategoryId, number> = {
      hotel: 650,
      apartment: 350,
      riad: 480,
      villa: 1200,
      resort: 1300,
    };
    const defaultCnt: Record<StayCategoryId, number> = {
      hotel: 4,
      apartment: 5,
      riad: 7,
      villa: 4,
      resort: 4,
    };
    const minMad =
      matched.length > 0
        ? Math.min(...matched.map((m) => Number(m.base_price_mad) || 0))
        : defaultMin[cat.id];
    const count = matched.length > 0 ? matched.length : defaultCnt[cat.id];
    return { ...cat, minMad, count };
  });

  const carsMatched = listings.filter((p) => p.marketplace_type === "car");
  const expMatched = listings.filter((p) => p.marketplace_type === "exp");
  const foodMatched = listings.filter((p) => p.marketplace_type === "food");

  const minCar =
    carsMatched.length > 0
      ? Math.min(...carsMatched.map((c) => Number(c.base_price_mad) || 300))
      : 300;
  const minExp =
    expMatched.length > 0
      ? Math.min(...expMatched.map((e) => Number(e.base_price_mad) || 250))
      : 250;
  const minFood =
    foodMatched.length > 0
      ? Math.min(...foodMatched.map((f) => Number(f.base_price_mad) || 25))
      : 25;

  const stayGroup: ServiceCardItem[] = stayStats.map((cat) => ({
    key: `stay-${cat.id}`,
    title: tr(cat.labelKey),
    desc: tr(cat.taglineKey),
    image: cat.coverImage,
    badgeText: String(cat.count),
    pricePill: `${money(cat.minMad)}+`,
    color: cat.badgeText,
    href: `/search?type=stay&category=${cat.id}`,
    stayCatId: cat.id,
  }));

  const mobilityGroup: ServiceCardItem[] = [
    {
      key: "svc-transport",
      title: tr("transport"),
      desc: tr("svcTransportDesc"),
      image: "/images/services/transport.jpg",
      badgeText: "ONCF",
      pricePill: `${money(110)}+`,
      color: "#1F40C5",
      tabTarget: "transport",
    },
    {
      key: "svc-flights",
      title: tr("flights"),
      desc: tr("svcFlightsDesc"),
      image: "/images/services/flights-ram-wing.jpg",
      badgeText: "ONDA",
      pricePill: "RAM",
      color: "#0284C7",
      tabTarget: "flights",
    },
    {
      key: "svc-cars",
      title: tr("cat.cars"),
      desc: tr("svcCarDesc"),
      image: "/images/listings/car-4x4.jpg",
      badgeText: String(carsMatched.length || 6),
      pricePill: `${money(minCar)}+`,
      color: "#1F40C5",
      href: "/search?type=car",
    },
    {
      key: "svc-esim",
      title: tr("esim"),
      desc: tr("svcEsimDesc"),
      image: "/images/services/esim.jpg",
      badgeText: "5G",
      pricePill: `${money(50)}+`,
      color: "#059669",
      tabTarget: "esim",
    },
    {
      key: "svc-guide",
      title: tr("travelGuide"),
      desc: tr("travelGuideSub"),
      image: "/images/services/flights-onda-terminal.jpg",
      badgeText: "SOS",
      pricePill: "24/7",
      color: "#DC2626",
      tabTarget: "guide",
    },
  ];

  const discoveryGroup: ServiceCardItem[] = [
    {
      key: "svc-exp",
      title: tr("cat.experiences"),
      desc: tr("svcExpDesc"),
      image: "/images/listings/exp-kitesurf.jpg",
      badgeText: String(expMatched.length || 6),
      pricePill: `${money(minExp)}+`,
      color: "#0D9488",
      href: "/search?type=exp",
    },
    {
      key: "svc-food",
      title: tr("cat.dining"),
      desc: tr("svcDiningDesc"),
      image: "/images/listings/food-tajine.jpg",
      badgeText: String(foodMatched.length || 6),
      pricePill: `${money(minFood)}+`,
      color: "#C2410C",
      href: "/search?type=food",
    },
    {
      key: "svc-planner",
      title: tr("nav.planner"),
      desc: tr("svcPlannerDesc"),
      image: "/images/services/planner.jpg",
      badgeText: "AI",
      pricePill: "24/7",
      color: "#B45309",
      href: "/planner",
    },
  ];

  const renderIcon = (item: ServiceCardItem) => {
    if (item.stayCatId) return <CategoryIcon category={item.stayCatId} size={12} />;
    switch (item.key) {
      case "svc-transport":
        return <Train size={12} />;
      case "svc-flights":
        return <Plane size={12} />;
      case "svc-cars":
        return <Car size={12} />;
      case "svc-esim":
        return <Wifi size={12} />;
      case "svc-guide":
        return <ShieldAlert size={12} />;
      case "svc-exp":
        return <Compass size={12} />;
      case "svc-food":
        return <Utensils size={12} />;
      default:
        return <Sparkles size={12} />;
    }
  };

  const renderCard = (item: ServiceCardItem) => {
    const inner = (
      <div className="trace-wrap stay-cat-media">
        <TraceImage className="prop-img" src={item.image} alt={item.title} label={item.title} priority />
        <div className="stay-cat-overlay">
          <div className="stay-cat-top">
            <span
              className="stay-cat-icon-pill"
              style={{ background: "rgba(255,255,255,0.95)", color: item.color }}
            >
              {renderIcon(item)}
              <span>{item.badgeText}</span>
            </span>
            {item.pricePill && (
              <span className="stay-cat-price-pill" dir="ltr">
                {item.pricePill}
              </span>
            )}
          </div>
          <div className="stay-cat-bottom">
            <div className="stay-cat-title">{item.title}</div>
            <div className="stay-cat-desc">{item.desc}</div>
          </div>
        </div>
      </div>
    );

    if (item.tabTarget) {
      return (
        <button
          key={item.key}
          type="button"
          className="card stay-cat-card"
          style={{ border: "1px solid var(--border)", padding: 0, textAlign: "start", cursor: "pointer" }}
          onClick={() => onSelectTab(item.tabTarget!)}
        >
          {inner}
        </button>
      );
    }

    return (
      <Link
        key={item.key}
        href={item.href || "/search"}
        className="card stay-cat-card"
        style={{ border: "1px solid var(--border)", padding: 0, textAlign: "start" }}
      >
        {inner}
      </Link>
    );
  };

  const sections = [
    {
      id: "stays",
      title: tr("stayCategoriesTitle"),
      Icon: BedDouble,
      viewHref: "/search?type=stay",
      items: stayGroup,
      colsClass: "services-dir-grid services-dir-grid--5",
    },
    {
      id: "mobility",
      title: tr("navServices"),
      Icon: Plane,
      viewHref: "/services?tab=transport",
      items: mobilityGroup,
      colsClass: "services-dir-grid services-dir-grid--5",
    },
    {
      id: "discovery",
      title: tr("exploreByExpTitle"),
      Icon: Compass,
      viewHref: "/search",
      items: discoveryGroup,
      colsClass: "services-dir-grid services-dir-grid--3",
    },
  ];

  return (
    <div style={{ display: "grid", gap: 22 }}>
      {sections.map((sec) => (
        <section
          key={sec.id}
          className="card card-body"
          style={{ display: "grid", gap: 14, padding: "18px 20px" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span className="badge badge-primary" style={{ padding: "6px 9px" }}>
                <sec.Icon size={15} />
              </span>
              <h2 style={{ margin: 0, fontSize: "1.12rem", fontWeight: 800, color: "var(--text)" }}>
                {sec.title}
              </h2>
              <span className="badge badge-muted">{sec.items.length}</span>
            </div>
            {sec.id === "mobility" ? (
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => onSelectTab("transport")}
              >
                {tr("transportTab")}
              </button>
            ) : (
              <Link href={sec.viewHref} className="btn btn-sm btn-outline">
                {tr("viewAll")}
              </Link>
            )}
          </div>

          <div className={sec.colsClass}>{sec.items.map(renderCard)}</div>
        </section>
      ))}
    </div>
  );
}
