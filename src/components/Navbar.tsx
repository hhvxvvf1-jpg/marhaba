"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BedDouble,
  Bell,
  Building2,
  ChevronDown,
  Compass,
  Globe,
  Heart,
  LayoutGrid,
  LogOut,
  MapPin,
  Menu,
  Moon,
  Plane,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  Train,
  User as UserIcon,
  X,
} from "lucide-react";
import { useApp } from "./AppProvider";
import { BrandLogo } from "./BrandLogo";
import { CategoryIcon } from "./BrandIcons";
import { LANGUAGES, tCity, type Lang } from "@/lib/i18n";
import { STAY_CATEGORIES } from "@/lib/stay-categories";
import type { Currency, ThemeMode } from "@/lib/currency";

const TOP_CITIES = [
  { slug: "marrakech", name: "Marrakech", tag: "Riads & Atlas" },
  { slug: "laayoune", name: "Laâyoune", tag: "Sahara Oasis" },
  { slug: "dakhla", name: "Dakhla", tag: "Lagoon & Surf" },
  { slug: "casablanca", name: "Casablanca", tag: "Business & Coast" },
  { slug: "tanger", name: "Tanger", tag: "Mediterranean" },
  { slug: "fes", name: "Fès", tag: "Imperial Medina" },
  { slug: "agadir", name: "Agadir", tag: "Beach Resorts" },
  { slug: "chefchaouen", name: "Chefchaouen", tag: "Blue Pearl" },
];

export function Navbar() {
  const pathname = usePathname();
  const {
    lang,
    setLang,
    currency,
    setCurrency,
    theme,
    setTheme,
    user,
    logout,
    openAuthModal,
    activateDemoAccount,
    activatingDemo,
    unreadNotifications,
    wishlistIds,
    tr,
  } = useApp();

  const [openMenu, setOpenMenu] = useState<"none" | "stays" | "services" | "destinations" | "prefs" | "user">("none");
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  const isPartner = user && ["partner_owner", "partner_manager", "partner_staff", "super_admin", "admin"].includes(user.role);
  const isAdmin = user && ["super_admin", "admin", "support", "finance", "content_manager"].includes(user.role);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenMenu("none");
        setMobileOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenMenu("none");
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const closeAll = () => {
    setOpenMenu("none");
    setMobileOpen(false);
  };

  const toggleMenu = (target: "stays" | "services" | "destinations" | "prefs" | "user") => {
    setOpenMenu((cur) => (cur === target ? "none" : target));
    setMobileOpen(false);
  };

  const cycleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const ThemeIcon = theme === "dark" ? Moon : Sun;
  const initials = user
    ? user.full_name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join("")
    : "M";

  return (
    <header className="site-header" ref={headerRef}>
      <div className="container nav-inner" dir="ltr">
        <Link href="/" className="brand" onClick={closeAll}>
          <BrandLogo size="sm" />
        </Link>

        {/* Center Executive Pill Navigation */}
        <nav className="nav-pill-bar" dir="ltr" aria-label="Main navigation">
          <Link href="/search" className={`nav-link ${pathname === "/search" ? "active" : ""}`} onClick={closeAll}>
            <Compass size={15} />
            <span>{tr("nav.explore")}</span>
          </Link>

          <div style={{ position: "relative" }}>
            <button
              type="button"
              className={`nav-link nav-dropdown-btn ${openMenu === "stays" ? "active" : ""}`}
              aria-expanded={openMenu === "stays"}
              onClick={() => toggleMenu("stays")}
            >
              <BedDouble size={15} />
              <span>{tr("stays")}</span>
              <ChevronDown size={13} style={{ transform: openMenu === "stays" ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }} />
            </button>

            {openMenu === "stays" && (
              <div className="nav-popover card nav-mega-sm">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span className="nav-popover-title" style={{ margin: 0 }}>{tr("stayCategoriesTitle")}</span>
                  <Link href="/search?type=stay" style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--primary)" }} onClick={closeAll}>
                    {tr("viewAll")} →
                  </Link>
                </div>
                <div style={{ display: "grid", gap: 4 }}>
                  {STAY_CATEGORIES.map((sc) => (
                    <Link key={sc.id} href={`/search?type=stay&category=${sc.id}`} className="nav-drop-item" onClick={closeAll}>
                      <span
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          background: sc.softBg,
                          border: `1px solid ${sc.softBorder}`,
                          color: sc.badgeText,
                          display: "grid",
                          placeItems: "center",
                          flexShrink: 0,
                        }}
                      >
                        <CategoryIcon category={sc.id} size={15} />
                      </span>
                      <div>
                        <div className="nav-drop-label">{tr(sc.labelKey)}</div>
                        <div className="nav-drop-sub">{tr(sc.taglineKey)}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ position: "relative" }}>
            <button
              type="button"
              className={`nav-link nav-dropdown-btn ${pathname === "/services" || openMenu === "services" ? "active" : ""}`}
              aria-expanded={openMenu === "services"}
              onClick={() => toggleMenu("services")}
            >
              <LayoutGrid size={15} />
              <span>{tr("nav.services")}</span>
              <ChevronDown size={13} style={{ transform: openMenu === "services" ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }} />
            </button>

            {openMenu === "services" && (
              <div className="nav-popover card nav-mega-sm">
                <div className="nav-popover-title">{tr("navServicesSubtitle")}</div>
                <div style={{ display: "grid", gap: 4 }}>
                  <Link href="/services?tab=flights" className="nav-drop-item" onClick={closeAll}>
                    <Plane size={16} className="nav-drop-icon" />
                    <div>
                      <div className="nav-drop-label">{tr("flights")}</div>
                      <div className="nav-drop-sub">{tr("flightsSub")}</div>
                    </div>
                  </Link>
                  <Link href="/services?tab=transport" className="nav-drop-item" onClick={closeAll}>
                    <Train size={16} className="nav-drop-icon" />
                    <div>
                      <div className="nav-drop-label">{tr("transport")}</div>
                      <div className="nav-drop-sub">{tr("transportSub")}</div>
                    </div>
                  </Link>
                  <Link href="/services?tab=esim" className="nav-drop-item" onClick={closeAll}>
                    <Smartphone size={16} className="nav-drop-icon" />
                    <div>
                      <div className="nav-drop-label">{tr("esim")}</div>
                      <div className="nav-drop-sub">{tr("esimSub")}</div>
                    </div>
                  </Link>
                  <Link href="/services?tab=guide" className="nav-drop-item" onClick={closeAll}>
                    <ShieldAlert size={16} className="nav-drop-icon" />
                    <div>
                      <div className="nav-drop-label">{tr("travelGuide")}</div>
                      <div className="nav-drop-sub">{tr("travelGuideSub")}</div>
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link href="/planner" className={`nav-link ${pathname === "/planner" ? "active" : ""}`} onClick={closeAll}>
            <Sparkles size={15} />
            <span>{tr("nav.planner")}</span>
          </Link>

          <div style={{ position: "relative" }}>
            <button
              type="button"
              className={`nav-link nav-dropdown-btn ${pathname?.startsWith("/destinations") || openMenu === "destinations" ? "active" : ""}`}
              aria-expanded={openMenu === "destinations"}
              onClick={() => toggleMenu("destinations")}
            >
              <MapPin size={15} />
              <span>{tr("navDestinations")}</span>
              <ChevronDown size={13} style={{ transform: openMenu === "destinations" ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }} />
            </button>

            {openMenu === "destinations" && (
              <div className="nav-popover card nav-mega-md">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span className="nav-popover-title" style={{ margin: 0 }}>{tr("cities56Badge")}</span>
                  <Link href="/search" style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--primary)" }} onClick={closeAll}>
                    {tr("viewAll")} →
                  </Link>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 6 }}>
                  {TOP_CITIES.map((c) => (
                    <Link key={c.slug} href={`/destinations/${c.slug}`} className="nav-city-chip" onClick={closeAll}>
                      <span style={{ fontWeight: 700, fontSize: "0.84rem" }}>{tCity(lang, c.name)}</span>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{c.tag}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Right Flexible Utility Controls */}
        <div className="nav-actions">
          <Link href="/partner" className="btn btn-sm btn-outline nav-host-btn" onClick={closeAll}>
            <Building2 size={14} style={{ color: "var(--primary)" }} />
            <span>{isPartner ? tr("nav.partner") : tr("home.becomePartner")}</span>
          </Link>

          {wishlistIds.length > 0 && (
            <Link
              href="/account?tab=wishlist"
              className="btn btn-sm btn-outline nav-icon-btn"
              title={`Saved (${wishlistIds.length})`}
              aria-label={`Wishlist (${wishlistIds.length})`}
              onClick={closeAll}
            >
              <Heart size={15} style={{ color: "var(--danger)" }} fill="var(--danger)" />
              <span className="nav-badge-count">{wishlistIds.length}</span>
            </Link>
          )}

          <button
            type="button"
            className="btn btn-sm btn-outline nav-icon-btn"
            onClick={cycleTheme}
            title={`Appearance: ${theme}`}
            aria-label={`Switch theme (current: ${theme})`}
          >
            <ThemeIcon size={15} />
          </button>

          {/* Direct Flexible Language & Currency Selector Popover */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              className={`btn btn-sm btn-outline nav-prefs-btn ${openMenu === "prefs" ? "active-ring" : ""}`}
              aria-expanded={openMenu === "prefs"}
              onClick={() => toggleMenu("prefs")}
            >
              <Globe size={14} style={{ color: "var(--primary)" }} />
              <span>{lang.toUpperCase()}</span>
              <span style={{ opacity: 0.45 }}>|</span>
              <span>{currency}</span>
              <ChevronDown size={13} style={{ transform: openMenu === "prefs" ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }} />
            </button>

            {openMenu === "prefs" && (
              <div className="nav-popover card nav-popover-end" style={{ width: 310 }}>
                <div style={{ display: "grid", gap: 14 }}>
                  <div>
                    <div className="nav-popover-title">{tr("languageLabel")}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 6 }}>
                      {LANGUAGES.map((item) => (
                        <button
                          key={item.code}
                          type="button"
                          className={`btn btn-sm ${lang === item.code ? "btn-primary" : "btn-outline"}`}
                          style={{ justifyContent: "space-between", paddingInline: 10 }}
                          onClick={() => {
                            setLang(item.code as Lang);
                            setOpenMenu("none");
                          }}
                        >
                          <span style={{ fontSize: "0.8rem" }}>{item.native}</span>
                          <span style={{ fontSize: "0.68rem", opacity: 0.75 }}>{item.code.toUpperCase()}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="nav-popover-title">{tr("currencyLabel")}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                      {(["MAD", "EUR", "USD"] as Currency[]).map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={`btn btn-sm ${currency === c ? "btn-gold" : "btn-outline"}`}
                          onClick={() => {
                            setCurrency(c);
                            setOpenMenu("none");
                          }}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="nav-popover-title">{tr("appearanceLabel")}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
                      {([
                        { id: "light", label: tr("themeLight"), Icon: Sun },
                        { id: "dark", label: tr("themeDark"), Icon: Moon },
                      ] as Array<{ id: ThemeMode; label: string; Icon: typeof Sun }>).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          className={`btn btn-sm ${theme === opt.id ? "btn-primary" : "btn-outline"}`}
                          onClick={() => setTheme(opt.id)}
                        >
                          <opt.Icon size={13} />
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {user ? (
            <div style={{ position: "relative" }}>
              <button
                type="button"
                className="btn btn-sm btn-primary nav-user-btn"
                aria-expanded={openMenu === "user"}
                onClick={() => toggleMenu("user")}
              >
                <span className="nav-avatar">{initials}</span>
                <span className="nav-user-name">{user.full_name.split(" ")[0]}</span>
                {unreadNotifications > 0 && <span className="nav-notif-dot" />}
                <ChevronDown size={13} />
              </button>

              {openMenu === "user" && (
                <div className="nav-popover card nav-popover-end" style={{ width: 256 }}>
                  <div style={{ padding: "4px 6px 10px", borderBottom: "1px solid var(--border)", marginBottom: 6 }}>
                    <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "var(--text)" }}>{user.full_name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {user.email} · <strong>{user.role}</strong>
                    </div>
                  </div>
                  <div style={{ display: "grid", gap: 3 }}>
                    <Link href="/account" className="nav-drop-item" onClick={closeAll}>
                      <UserIcon size={15} className="nav-drop-icon" />
                      <span>{tr("accountPromos")}</span>
                    </Link>
                    <Link href="/account?tab=wishlist" className="nav-drop-item" onClick={closeAll}>
                      <Heart size={15} className="nav-drop-icon" />
                      <span>Wishlist ({wishlistIds.length})</span>
                    </Link>
                    <Link href="/account?tab=notifications" className="nav-drop-item" onClick={closeAll}>
                      <Bell size={15} className="nav-drop-icon" />
                      <span>Notifications ({unreadNotifications})</span>
                    </Link>
                    <Link href="/partner" className="nav-drop-item" onClick={closeAll}>
                      <Building2 size={15} className="nav-drop-icon" />
                      <span>{isPartner ? tr("nav.partner") : tr("navPartners")}</span>
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" className="nav-drop-item" onClick={closeAll}>
                        <ShieldCheck size={15} className="nav-drop-icon" />
                        <span>{tr("nav.admin")}</span>
                      </Link>
                    )}

                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8, marginTop: 6 }}>
                      <div className="nav-popover-title">{tr("quickDemoSwitcher")}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
                        {(
                          [
                            { id: "traveler", label: tr("roleTraveler") },
                            { id: "partner", label: tr("rolePartner") },
                            { id: "affiliate", label: tr("roleAffiliate") },
                          ] as const
                        ).map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            disabled={!!activatingDemo}
                            className="btn btn-sm btn-outline"
                            style={{ padding: "4px 6px", fontSize: "0.72rem" }}
                            onClick={async () => {
                              await activateDemoAccount(r.id);
                              closeAll();
                            }}
                          >
                            {activatingDemo === r.id ? "..." : r.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="nav-drop-item"
                      style={{ border: 0, background: "transparent", cursor: "pointer", width: "100%", textAlign: "start", color: "var(--danger)", marginTop: 4 }}
                      onClick={() => {
                        logout();
                        closeAll();
                      }}
                    >
                      <LogOut size={15} /> <span>{tr("nav.signOut")}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-sm btn-primary"
              style={{ borderRadius: 999, paddingInline: 14 }}
              onClick={() => {
                closeAll();
                openAuthModal("login");
              }}
            >
              <UserIcon size={14} />
              <span>{tr("nav.signIn")}</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-sm btn-outline nav-mobile-toggle nav-icon-btn"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            onClick={() => {
              setMobileOpen((o) => !o);
              setOpenMenu("none");
            }}
          >
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="nav-mobile-drawer">
          <div className="container" style={{ display: "grid", gap: 6, paddingBlock: 14 }}>
            <Link href="/search" className={`nav-link ${pathname === "/search" ? "active" : ""}`} onClick={closeAll}>
              <Compass size={16} /> <span>{tr("nav.explore")}</span>
            </Link>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingInline: 6, paddingBlock: 4 }}>
              {STAY_CATEGORIES.map((sc) => (
                <Link
                  key={`mob-${sc.id}`}
                  href={`/search?type=stay&category=${sc.id}`}
                  className="btn btn-sm btn-outline"
                  style={{ borderRadius: 999, background: sc.softBg, borderColor: sc.softBorder, color: sc.badgeText }}
                  onClick={closeAll}
                >
                  <CategoryIcon category={sc.id} size={13} />
                  <span>{tr(sc.labelKey)}</span>
                </Link>
              ))}
            </div>
            <Link href="/services" className={`nav-link ${pathname === "/services" ? "active" : ""}`} onClick={closeAll}>
              <LayoutGrid size={16} /> <span>{tr("nav.services")}</span>
            </Link>
            <Link href="/planner" className={`nav-link ${pathname === "/planner" ? "active" : ""}`} onClick={closeAll}>
              <Sparkles size={16} /> <span>{tr("nav.planner")}</span>
            </Link>
            <Link href="/destinations/marrakech" className={`nav-link ${pathname?.startsWith("/destinations") ? "active" : ""}`} onClick={closeAll}>
              <MapPin size={16} /> <span>{tr("navDestinations")}</span>
            </Link>
            <Link href="/partner" className={`nav-link ${pathname === "/partner" ? "active" : ""}`} onClick={closeAll}>
              <Building2 size={16} /> <span>{isPartner ? tr("nav.partner") : tr("home.becomePartner")}</span>
            </Link>
            {isAdmin && (
              <Link href="/admin" className={`nav-link ${pathname === "/admin" ? "active" : ""}`} onClick={closeAll}>
                <ShieldCheck size={16} /> <span>{tr("nav.admin")}</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
