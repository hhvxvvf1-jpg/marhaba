"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BedDouble,
  Car,
  Compass,
  MapPin,
  Moon,
  Plane,
  Scale,
  Search,
  ShieldAlert,
  Smartphone,
  Sparkles,
  Sun,
  Train,
  Utensils,
  X,
} from "lucide-react";
import { useApp } from "./AppProvider";
import { MOROCCO_CITIES } from "@/lib/morocco-cities";
import { tRegion } from "@/lib/i18n";

interface PaletteItem {
  id: string;
  label: string;
  sub: string;
  group: string;
  Icon: typeof Search;
  action: () => void;
}

export function CommandPalette() {
  const router = useRouter();
  const { lang, tr, commandOpen, setCommandOpen, setAiOpen, theme, setTheme, compareItems, setCompareOpen } = useApp();
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (commandOpen) {
      setQuery("");
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [commandOpen]);

  const items = useMemo<PaletteItem[]>(() => {
    const go = (href: string) => {
      setCommandOpen(false);
      router.push(href);
    };

    const quickItems: PaletteItem[] = [
      { id: "cat-stay", label: tr("stays"), sub: tr("home.featuredStays"), group: tr("navExplore"), Icon: BedDouble, action: () => go("/search?type=stay") },
      { id: "cat-car", label: tr("cars"), sub: tr("carsAndMobility"), group: tr("navExplore"), Icon: Car, action: () => go("/search?type=car") },
      { id: "cat-exp", label: tr("experiences"), sub: tr("experiencesAndFood"), group: tr("navExplore"), Icon: Compass, action: () => go("/search?type=exp") },
      { id: "cat-food", label: tr("dining"), sub: tr("cat.dining"), group: tr("navExplore"), Icon: Utensils, action: () => go("/search?type=food") },
      { id: "svc-planner", label: tr("nav.planner"), sub: tr("aiItineraryBudget"), group: tr("navServices"), Icon: Sparkles, action: () => go("/planner") },
      { id: "svc-flights", label: tr("flights"), sub: tr("flightsSub"), group: tr("navServices"), Icon: Plane, action: () => go("/services?tab=flights") },
      { id: "svc-train", label: tr("transport"), sub: tr("transportSub"), group: tr("navServices"), Icon: Train, action: () => go("/services?tab=transport") },
      { id: "svc-esim", label: tr("esim"), sub: tr("esimSub"), group: tr("navServices"), Icon: Smartphone, action: () => go("/services?tab=esim") },
      { id: "svc-sos", label: tr("travelGuide"), sub: tr("travelGuideSub"), group: tr("navServices"), Icon: ShieldAlert, action: () => go("/services?tab=guide") },
      {
        id: "act-ai",
        label: tr("ai.title"),
        sub: tr("ai.placeholder"),
        group: tr("actionsGroup"),
        Icon: Sparkles,
        action: () => {
          setCommandOpen(false);
          setAiOpen(true);
        },
      },
      {
        id: "act-theme",
        label: `${tr("appearanceLabel")}: ${theme === "dark" ? tr("themeLight") : tr("themeDark")}`,
        sub: tr("toggleThemeSub"),
        group: tr("actionsGroup"),
        Icon: theme === "dark" ? Sun : Moon,
        action: () => {
          setTheme(theme === "dark" ? "light" : "dark");
          setCommandOpen(false);
        },
      },
      ...(compareItems.length > 0
        ? [
            {
              id: "act-compare",
              label: `${tr("compareOpenBtn")} (${compareItems.length}/3)`,
              sub: tr("compareTitle"),
              group: tr("actionsGroup"),
              Icon: Scale,
              action: () => {
                setCommandOpen(false);
                setCompareOpen(true);
              },
            },
          ]
        : []),
    ];

    const qTrim = query.trim();
    const ql = qTrim.toLowerCase();

    const cityMatches = MOROCCO_CITIES.filter((c) => {
      if (!ql) return ["marrakech", "laayoune", "dakhla", "casablanca", "fes", "agadir", "chefchaouen", "merzouga", "rabat", "tanger"].includes(c.slug);
      return (
        c.name.toLowerCase().includes(ql) ||
        c.nameFr.toLowerCase().includes(ql) ||
        c.nameAr.includes(qTrim) ||
        c.region.toLowerCase().includes(ql) ||
        c.slug.includes(ql)
      );
    })
      .slice(0, 8)
      .map<PaletteItem>((c) => ({
        id: `city-${c.slug}`,
        label: lang === "ar" ? c.nameAr : lang === "fr" ? c.nameFr : c.name,
        sub: tRegion(lang, c.region),
        group: tr("navDestinations"),
        Icon: MapPin,
        action: () => go(`/destinations/${c.slug}`),
      }));

    if (!ql) return [...cityMatches.slice(0, 5), ...quickItems];

    const filteredQuick = quickItems.filter(
      (item) => item.label.toLowerCase().includes(ql) || item.sub.toLowerCase().includes(ql)
    );

    const directSearch: PaletteItem = {
      id: "direct-search",
      label: `${tr("searchBtn")}: "${qTrim}"`,
      sub: tr("navSearchMarketplace"),
      group: tr("navSearch"),
      Icon: Search,
      action: () => go(`/search?q=${encodeURIComponent(qTrim)}`),
    };

    return [directSearch, ...cityMatches, ...filteredQuick].slice(0, 12);
  }, [query, lang, tr, router, setCommandOpen, setAiOpen, theme, setTheme, compareItems.length, setCompareOpen]);

  if (!commandOpen) return null;

  return (
    <div className="modal-backdrop" onClick={() => setCommandOpen(false)} style={{ alignItems: "flex-start", paddingTop: "10vh" }}>
      <div
        className="modal-panel command-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Quick search"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="command-head">
          <Search size={18} style={{ color: "var(--primary)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            className="command-input"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIdx(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setCommandOpen(false);
              else if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIdx((i) => Math.min(items.length - 1, i + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIdx((i) => Math.max(0, i - 1));
              } else if (e.key === "Enter" && items[selectedIdx]) {
                e.preventDefault();
                items[selectedIdx].action();
              }
            }}
            placeholder={tr("wherePlaceholder")}
          />
          <kbd className="command-kbd">ESC</kbd>
          <button type="button" className="btn btn-sm btn-outline" style={{ padding: 5, borderRadius: 8 }} onClick={() => setCommandOpen(false)}>
            <X size={14} />
          </button>
        </div>

        <div className="command-list no-scrollbar">
          {items.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              className={`command-row ${idx === selectedIdx ? "active" : ""}`}
              onMouseEnter={() => setSelectedIdx(idx)}
              onClick={item.action}
            >
              <span className="command-row-icon">
                <item.Icon size={16} />
              </span>
              <span style={{ flex: 1, textAlign: "start", minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text)" }}>{item.label}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.sub}
                </div>
              </span>
              <span className="badge badge-muted" style={{ fontSize: "0.68rem" }}>
                {item.group}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
