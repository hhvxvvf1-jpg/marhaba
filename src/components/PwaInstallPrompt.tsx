"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Download, RefreshCw, Share, Smartphone, WifiOff, X } from "lucide-react";
import { useApp } from "./AppProvider";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISS_KEY = "marhaba_pwa_dismissed_until";

export function PwaInstallPrompt() {
  const { lang, tr } = useApp();
  const isAr = lang === "ar";
  const isFr = lang === "fr";
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIosHint, setIsIosHint] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOffline(!window.navigator.onLine);
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    const dismissedUntil = Number(window.localStorage.getItem(DISMISS_KEY) || "0");
    const canAutoShow = !isStandalone && dismissedUntil <= Date.now();

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (canAutoShow) setVisible(true);
    };

    const onManualOpen = () => {
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("marhaba:open-pwa-install", onManualOpen);

    const ua = window.navigator.userAgent || "";
    const isIos = /iPhone|iPad|iPod/i.test(ua) && !/CriOS|FxiOS/i.test(ua);
    if (isIos) {
      setIsIosHint(true);
      if (canAutoShow) setVisible(true);
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) return;
        if (reg.waiting) setWaitingWorker(reg.waiting);
        reg.addEventListener("updatefound", () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener("statechange", () => {
            if (nw.state === "installed" && navigator.serviceWorker.controller) {
              setWaitingWorker(nw);
            }
          });
        });
      }).catch(() => {});
    }

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("marhaba:open-pwa-install", onManualOpen);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now() + 14 * 86400_000));
    } catch {
      // ignore storage errors
    }
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleUpdateReload = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }
    window.location.reload();
  };

  // Priority 1: Live Offline Banner
  if (isOffline) {
    return (
      <div className="pwa-install-banner no-print" style={{ borderColor: "var(--warning)" }} role="status">
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
          <span className="badge badge-warning" style={{ padding: 7 }}>
            <WifiOff size={16} />
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: "0.84rem" }}>
              {isAr ? "أنت غير متصل بالإنترنت" : isFr ? "Vous êtes hors ligne" : "You are offline"}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {isAr ? "افتح بطاقة الطوارئ بدون نت" : isFr ? "Ouvrir le Pass SOS hors-ligne" : "Access SOS & cached travel pass"}
            </div>
          </div>
        </div>
        <Link href="/offline" className="btn btn-sm btn-gold" style={{ flexShrink: 0 }}>
          SOS Pass
        </Link>
      </div>
    );
  }

  // Priority 2: Service Worker Update Banner
  if (waitingWorker) {
    return (
      <div className="pwa-install-banner no-print" style={{ borderColor: "var(--primary)" }} role="status">
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
          <img src="/brand/app-icon-192.png" alt="MARHABA" width={34} height={34} style={{ borderRadius: 9, flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: "0.84rem" }}>
              {isAr ? "تحديث جديد جاهز لـ MARHABA" : isFr ? "Mise à jour MARHABA disponible" : "New MARHABA update ready"}
            </div>
            <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
              {isAr ? "حدّث الصفحة للحصول على أحدث المزايا" : isFr ? "Actualiser pour charger la dernière version" : "Reload for the latest features"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <button type="button" className="btn btn-sm btn-primary" onClick={handleUpdateReload}>
            <RefreshCw size={13} />
            <span>{isAr ? "تحديث" : isFr ? "Actualiser" : "Reload"}</span>
          </button>
          <button type="button" className="btn btn-sm btn-ghost" aria-label={tr("closeBtn")} onClick={() => setWaitingWorker(null)} style={{ padding: 6 }}>
            <X size={15} />
          </button>
        </div>
      </div>
    );
  }

  if (!visible) return null;

  return (
    <div className="pwa-install-banner no-print" role="region" aria-label={tr("pwaInstallTitle")}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
        <img
          src="/brand/app-icon-192.png"
          alt="MARHABA"
          width={36}
          height={36}
          style={{ borderRadius: 9, flexShrink: 0 }}
        />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: "0.86rem", color: "var(--text)" }}>
            {tr("pwaInstallTitle")}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {isIosHint && !deferredPrompt
              ? tr("pwaIosHint")
              : deferredPrompt
              ? tr("pwaInstallSub")
              : isAr
              ? "افتح قائمة المتصفح واختر «تثبيت التطبيق / إضافة للشاشة الرئيسية»."
              : isFr
              ? "Ouvrez le menu du navigateur → « Installer l’application »."
              : "Use browser menu → “Install app” or “Add to Home Screen”."}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        {deferredPrompt ? (
          <button type="button" className="btn btn-sm btn-primary" onClick={handleInstall}>
            <Download size={14} />
            <span>{tr("pwaInstallBtn")}</span>
          </button>
        ) : (
          <span className="badge badge-primary" style={{ gap: 4 }}>
            {isIosHint ? <Share size={12} /> : <Smartphone size={12} />} PWA
          </span>
        )}
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          aria-label={tr("closeBtn")}
          onClick={dismiss}
          style={{ padding: 6 }}
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
