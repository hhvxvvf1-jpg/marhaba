"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { CheckCircle2, Info, Sparkles, X } from "lucide-react";
import { LANGUAGES, t, type Lang } from "@/lib/i18n";
import { formatMoney, type Currency, type ThemeMode } from "@/lib/currency";

export type ToastTone = "success" | "info" | "warning";

export interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
  href?: string;
  actionLabel?: string;
}

export interface CompareEntry {
  id: number;
  slug: string;
  title: string;
  title_fr?: string;
  title_ar?: string;
  city: string;
  region?: string;
  category: string;
  rating_avg: number;
  review_count: number;
  base_price_mad: number;
  unit_type?: string;
  image: string;
  cancellation_policy?: string;
  verified: number;
  amenities: string[];
}

export type DemoRoleKey = "traveler" | "partner" | "affiliate";

const DEMO_ACCOUNTS: Record<DemoRoleKey, { email: string; password: string }> = {
  traveler: { email: "traveler@marhaba.ma", password: "MarhabaTraveler2026!" },
  partner: { email: "partner@marhaba.ma", password: "MarhabaPartner2026!" },
  affiliate: { email: "affiliate@marhaba.ma", password: "MarhabaAffiliate2026!" },
};

const SESSION_STORAGE_KEY = "marhaba_session_token";

export interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  phone: string;
  role: string;
  status: string;
  preferred_lang: Lang;
  preferred_currency: Currency;
  loyalty_points: number;
  referral_code: string;
  partner?: { id: number; business_name: string; verification_status: string } | null;
}

interface AppContextValue {
  lang: Lang;
  dir: "ltr" | "rtl";
  setLang: (lang: Lang) => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  theme: ThemeMode;
  setTheme: (m: ThemeMode) => void;
  money: (mad: number) => string;
  tr: (key: string) => string;
  user: AuthUser | null;
  loadingUser: boolean;
  refreshUser: () => Promise<void>;
  activateDemoAccount: (role: DemoRoleKey) => Promise<boolean>;
  activatingDemo: DemoRoleKey | null;
  logout: () => Promise<void>;
  wishlistIds: number[];
  toggleWishlist: (propertyId: number) => Promise<void>;
  recentlyViewedIds: number[];
  trackRecentlyViewed: (propertyId: number) => void;
  unreadNotifications: number;
  authModalOpen: boolean;
  openAuthModal: (mode?: "login" | "register") => void;
  closeAuthModal: () => void;
  authMode: "login" | "register";
  setAuthMode: (m: "login" | "register") => void;
  aiOpen: boolean;
  setAiOpen: (open: boolean) => void;
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  compareItems: CompareEntry[];
  toggleCompare: (entry: CompareEntry) => void;
  clearCompare: () => void;
  compareOpen: boolean;
  setCompareOpen: (open: boolean) => void;
  notify: (message: string, tone?: ToastTone, action?: { href: string; label: string }) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [currency, setCurrencyState] = useState<Currency>("MAD");
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [activatingDemo, setActivatingDemo] = useState<DemoRoleKey | null>(null);
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<number[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [aiOpen, setAiOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [compareItems, setCompareItems] = useState<CompareEntry[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const notify = useCallback((message: string, tone: ToastTone = "success", action?: { href: string; label: string }) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev.slice(-2), { id, message, tone, href: action?.href, actionLabel: action?.label }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3600);
  }, []);

  const toggleCompare = useCallback(
    (entry: CompareEntry) => {
      setCompareItems((prev) => {
        const exists = prev.some((x) => x.id === entry.id);
        if (exists) {
          notify(t(lang, "compareRemoved"), "info");
          return prev.filter((x) => x.id !== entry.id);
        }
        if (prev.length >= 3) {
          notify(t(lang, "compareMaxWarn"), "warning");
          return prev;
        }
        notify(t(lang, "compareAdded"), "success");
        return [...prev, entry];
      });
    },
    [lang, notify]
  );

  const clearCompare = useCallback(() => {
    setCompareItems([]);
    setCompareOpen(false);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const dir = LANGUAGES.find((l) => l.code === lang)?.dir || "ltr";

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Ensure session header fallback works inside cross-site iframe previews where third-party cookies may be blocked
    const w = window as Window & { __marhabaFetchPatched?: boolean };
    if (!w.__marhabaFetchPatched) {
      w.__marhabaFetchPatched = true;
      const origFetch = window.fetch.bind(window);
      window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
        if (url.startsWith("/api/") || url.startsWith(`${window.location.origin}/api/`)) {
          const token = localStorage.getItem(SESSION_STORAGE_KEY);
          if (token) {
            const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
            if (!headers.has("x-marhaba-session")) {
              headers.set("x-marhaba-session", token);
            }
            return origFetch(input, { ...init, headers, credentials: init?.credentials || "include" });
          }
        }
        return origFetch(input, init);
      };
    }

    const savedLang = localStorage.getItem("marhaba_lang") as Lang | null;
    const savedCurr = localStorage.getItem("marhaba_currency") as Currency | null;
    const savedTheme = localStorage.getItem("marhaba_theme");
    if (savedLang && LANGUAGES.some((l) => l.code === savedLang)) setLangState(savedLang);
    if (savedCurr && ["MAD", "EUR", "USD"].includes(savedCurr)) setCurrencyState(savedCurr);
    if (savedTheme === "dark" || savedTheme === "light") {
      setThemeState(savedTheme);
    } else {
      setThemeState("light");
      localStorage.setItem("marhaba_theme", "light");
    }
    try {
      const recent = JSON.parse(localStorage.getItem("marhaba_recent") || "[]");
      if (Array.isArray(recent)) setRecentlyViewedIds(recent.filter((n) => typeof n === "number").slice(0, 12));
    } catch {
      // ignore
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
      document.documentElement.dir = dir;
    }
  }, [lang, dir]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    if (typeof window !== "undefined") localStorage.setItem("marhaba_lang", next);
  }, []);

  const setCurrency = useCallback((next: Currency) => {
    setCurrencyState(next);
    if (typeof window !== "undefined") localStorage.setItem("marhaba_currency", next);
  }, []);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    if (typeof window !== "undefined") localStorage.setItem("marhaba_theme", next);
  }, []);

  const trackRecentlyViewed = useCallback((propertyId: number) => {
    setRecentlyViewedIds((prev) => {
      const next = [propertyId, ...prev.filter((id) => id !== propertyId)].slice(0, 12);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("marhaba_recent", JSON.stringify(next));
        } catch {
          // ignore
        }
      }
      return next;
    });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      setLoadingUser(true);
      const token = typeof window !== "undefined" ? localStorage.getItem(SESSION_STORAGE_KEY) : null;
      const res = await fetch("/api/v1/auth/me", {
        cache: "no-store",
        credentials: "include",
        headers: token ? { "x-marhaba-session": token } : undefined,
      });
      const data = await res.json();
      if (!data.user && typeof window !== "undefined" && token) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
      setUser(data.user || null);
      setUnreadNotifications(data.unreadNotifications || 0);
      if (data.user) {
        const wRes = await fetch("/api/v1/wishlists", { cache: "no-store" });
        if (wRes.ok) {
          const wData = await wRes.json();
          setWishlistIds((wData.items || []).map((i: { id: number }) => i.id));
        }
      } else {
        setWishlistIds([]);
      }
    } catch {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const activateDemoAccount = useCallback(
    async (role: DemoRoleKey): Promise<boolean> => {
      const creds = DEMO_ACCOUNTS[role];
      setActivatingDemo(role);
      try {
        const res = await fetch("/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(creds),
        });
        const data = await res.json();
        if (!res.ok) return false;
        if (typeof window !== "undefined" && data.sessionToken) {
          localStorage.setItem(SESSION_STORAGE_KEY, data.sessionToken);
        }
        await refreshUser();
        notify(`Welcome, ${data.user?.full_name?.split(" ")[0] || "Guest"}!`, "success", {
          href: role === "partner" ? "/partner" : "/account",
          label: role === "partner" ? t(lang, "nav.partner") : t(lang, "navAccount"),
        });
        return true;
      } catch {
        return false;
      } finally {
        setActivatingDemo(null);
      }
    },
    [refreshUser, notify, lang]
  );

  const logout = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem(SESSION_STORAGE_KEY) : null;
    await fetch("/api/v1/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: token ? { "x-marhaba-session": token } : undefined,
    });
    if (typeof window !== "undefined") {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
    setUser(null);
    setWishlistIds([]);
    setUnreadNotifications(0);
    notify(t(lang, "signOut"), "info");
  }, [notify, lang]);

  const toggleWishlist = useCallback(
    async (propertyId: number) => {
      if (!user) {
        setAuthMode("login");
        setAuthModalOpen(true);
        return;
      }
      const wasSaved = wishlistIds.includes(propertyId);
      setWishlistIds((prev) => (wasSaved ? prev.filter((id) => id !== propertyId) : [...new Set([...prev, propertyId])]));
      try {
        const res = await fetch("/api/v1/wishlists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ propertyId }),
        });
        if (res.ok) {
          const data = await res.json();
          setWishlistIds((prev) => (data.saved ? [...new Set([...prev, propertyId])] : prev.filter((id) => id !== propertyId)));
          notify(
            data.saved
              ? lang === "ar"
                ? "تمت الإضافة إلى المفضلة"
                : lang === "fr"
                ? "Ajouté aux favoris"
                : "Saved to Wishlist"
              : lang === "ar"
              ? "تمت الإزالة من المفضلة"
              : lang === "fr"
              ? "Retiré des favoris"
              : "Removed from Wishlist",
            data.saved ? "success" : "info",
            data.saved ? { href: "/account?tab=wishlist", label: t(lang, "viewAll") } : undefined
          );
        } else {
          setWishlistIds((prev) => (wasSaved ? [...new Set([...prev, propertyId])] : prev.filter((id) => id !== propertyId)));
        }
      } catch {
        setWishlistIds((prev) => (wasSaved ? [...new Set([...prev, propertyId])] : prev.filter((id) => id !== propertyId)));
      }
    },
    [user, wishlistIds, notify, lang]
  );

  const money = useCallback((mad: number) => formatMoney(mad, currency, lang), [currency, lang]);
  const tr = useCallback((key: string) => t(lang, key), [lang]);

  return (
    <AppContext.Provider
      value={{
        lang,
        dir,
        setLang,
        currency,
        setCurrency,
        theme,
        setTheme,
        money,
        tr,
        user,
        loadingUser,
        refreshUser,
        activateDemoAccount,
        activatingDemo,
        logout,
        wishlistIds,
        toggleWishlist,
        recentlyViewedIds,
        trackRecentlyViewed,
        unreadNotifications,
        authModalOpen,
        openAuthModal: (mode = "login") => {
          setAuthMode(mode);
          setAuthModalOpen(true);
        },
        closeAuthModal: () => setAuthModalOpen(false),
        authMode,
        setAuthMode,
        aiOpen,
        setAiOpen,
        commandOpen,
        setCommandOpen,
        compareItems,
        toggleCompare,
        clearCompare,
        compareOpen,
        setCompareOpen,
        notify,
      }}
    >
      {children}
      {toasts.length > 0 && (
        <div className="toast-stack" role="status" aria-live="polite">
          {toasts.map((toast) => (
            <div key={toast.id} className={`toast-card toast-${toast.tone}`}>
              {toast.tone === "success" ? (
                <CheckCircle2 size={16} style={{ color: "var(--success)", flexShrink: 0 }} />
              ) : toast.tone === "warning" ? (
                <Sparkles size={16} style={{ color: "var(--gold)", flexShrink: 0 }} />
              ) : (
                <Info size={16} style={{ color: "var(--primary)", flexShrink: 0 }} />
              )}
              <span style={{ flex: 1, fontWeight: 600, fontSize: "0.84rem" }}>{toast.message}</span>
              {toast.href && toast.actionLabel && (
                <Link
                  href={toast.href}
                  style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--primary)", whiteSpace: "nowrap" }}
                >
                  {toast.actionLabel}
                </Link>
              )}
              <button
                type="button"
                aria-label="Close"
                onClick={() => setToasts((prev) => prev.filter((item) => item.id !== toast.id))}
                style={{ border: 0, background: "transparent", color: "var(--text-muted)", cursor: "pointer", padding: 2 }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
