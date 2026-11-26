"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PhoneCall, RefreshCw, ShieldAlert, WifiOff } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { BrandLogo } from "@/components/BrandLogo";

export default function OfflinePage() {
  const { lang } = useApp();
  const isAr = lang === "ar";
  const isFr = lang === "fr";
  const [savedPromo, setSavedPromo] = useState("");
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsOnline(window.navigator.onLine);
    try {
      setSavedPromo(localStorage.getItem("marhaba_active_promo") || "");
    } catch {
      // ignore
    }
    const sync = () => setIsOnline(window.navigator.onLine);
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  const sosList = [
    { num: "19", label: isAr ? "الشرطة (المدن)" : isFr ? "Police (Villes)" : "Police (Cities)" },
    { num: "177", label: isAr ? "الدرك الملكي" : isFr ? "Gendarmerie Royale" : "Royal Gendarmerie" },
    { num: "15", label: isAr ? "الإسعاف والحماية" : isFr ? "SAMU & Pompiers" : "SAMU Medical & Fire" },
    { num: "112", label: isAr ? "طوارئ GSM" : isFr ? "Urgence GSM" : "Universal GSM SOS" },
    { num: "2255", label: isAr ? "خدمة قطارات ONCF" : isFr ? "Service ONCF" : "ONCF Rail Hotline" },
    { num: "0890000800", display: "08 90 00 08 00", label: isAr ? "مطارات ONDA" : isFr ? "Aéroports ONDA" : "ONDA Airports Info" },
  ];

  return (
    <div className="container" style={{ paddingBlock: 36 }}>
      <div className="card card-body brand-zellige" style={{ maxWidth: 640, marginInline: "auto", padding: 28, display: "grid", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <BrandLogo size="md" />
          <span className={`badge ${isOnline ? "badge-success" : "badge-warning"}`} style={{ gap: 5 }}>
            {isOnline ? <RefreshCw size={12} /> : <WifiOff size={12} />}
            {isOnline
              ? isAr
                ? "تم استعادة الاتصال"
                : isFr
                ? "Connexion rétablie"
                : "Back Online"
              : isAr
              ? "وضع عدم الاتصال (Offline)"
              : isFr
              ? "Mode Hors-Ligne"
              : "Offline Mode"}
          </span>
        </div>

        <div>
          <h1 style={{ margin: "0 0 6px", fontSize: "1.45rem" }}>
            {isAr
              ? "بطاقة السفر والطوارئ بدون إنترنت"
              : isFr
              ? "Pass Voyage & Urgences Hors-Ligne"
              : "Offline Travel & SOS Pass"}
          </h1>
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.9rem", lineHeight: 1.55 }}>
            {isAr
              ? "لا يؤكد MARHABA الحجوزات أو المدفوعات دون اتصال بالإنترنت. أعد الاتصال للتحقق من التوفر اللحظي وإتمام الطلبات."
              : isFr
              ? "MARHABA ne confirme jamais de réservations ou paiements hors ligne. Reconnectez-vous pour consulter les disponibilités en temps réel."
              : "MARHABA never confirms bookings, payments, or live provider availability while offline. Reconnect to check real-time inventory."}
          </p>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <strong style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--danger)", fontSize: "0.94rem" }}>
            <PhoneCall size={16} />
            {isAr ? "أرقام الطوارئ والنقل في المغرب (24/7)" : isFr ? "Numéros d’urgence Maroc (24/7)" : "Morocco Emergency & Mobility Numbers (24/7)"}
          </strong>
          <div className="guide-sos-grid">
            {sosList.map((sos) => (
              <a key={sos.num} href={`tel:${sos.num}`} className="guide-sos-item">
                <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{sos.label}</span>
                <span className="badge badge-primary" dir="ltr" style={{ fontWeight: 800 }}>
                  {sos.display || sos.num}
                </span>
              </a>
            ))}
          </div>
        </div>

        {savedPromo && (
          <div style={{ padding: "10px 12px", borderRadius: 12, background: "var(--gold-soft)", border: "1px solid rgba(217, 155, 22, 0.35)", fontSize: "0.84rem" }}>
            <strong>{isAr ? "رمز الخصم المحفوظ:" : isFr ? "Code promo enregistré :" : "Saved Promo Code:"}</strong>{" "}
            <code dir="ltr" style={{ fontWeight: 800 }}>{savedPromo}</code>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", paddingTop: 4 }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              if (typeof window !== "undefined") window.location.reload();
            }}
          >
            <RefreshCw size={15} />
            <span>{isAr ? "إعادة المحاولة" : isFr ? "Réessayer" : "Retry Connection"}</span>
          </button>
          <Link href="/" className="btn btn-outline">
            <ShieldAlert size={15} />
            <span>{isAr ? "الصفحة الرئيسية" : isFr ? "Accueil" : "Home"}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
