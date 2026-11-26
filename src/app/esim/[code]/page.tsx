"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Globe2, ShieldCheck, Wifi } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { EsimExperience } from "@/components/EsimExperience";
import { TelecomOfficialLogo } from "@/components/CarrierOfficialLogo";
import { ESIM_PACKAGES } from "@/lib/services-catalog";

export default function EsimPackageDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const { user, money, lang } = useApp();
  const decodedCode = decodeURIComponent(code || "").toUpperCase();
  const pkg = ESIM_PACKAGES.find((p) => p.code.toUpperCase() === decodedCode);

  const [esimHistory, setEsimHistory] = useState<Array<Record<string, unknown>>>([]);

  const loadHistory = async () => {
    try {
      const res = await fetch("/api/v1/services/esim", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setEsimHistory(data.requests || []);
      }
    } catch {
      setEsimHistory([]);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user]);

  if (!pkg) {
    return (
      <div className="container" style={{ paddingTop: 32, paddingBottom: 48, display: "grid", gap: 16 }}>
        <div className="card card-body" style={{ display: "grid", gap: 10 }}>
          <h1 style={{ margin: 0 }}>eSIM Plan Not Found</h1>
          <p style={{ margin: 0, color: "var(--text-muted)" }}>
            The requested eSIM package (<code dir="ltr">{decodedCode}</code>) does not exist. Explore all available Morocco 4G+/5G eSIM plans below.
          </p>
          <div>
            <Link href="/esim" className="btn btn-primary">
              <ArrowLeft size={15} /> Back to All eSIM Plans
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const recDesc =
    lang === "ar"
      ? pkg.recommendedForAr
      : lang === "fr"
      ? pkg.recommendedForFr
      : pkg.recommendedForEn;

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 48, display: "grid", gap: 18 }}>
      <div dir="ltr" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <Link href="/esim" className="btn btn-sm btn-outline">
            <ArrowLeft size={14} /> All Morocco eSIM Plans
          </Link>
          <Link href="/services?tab=esim" className="btn btn-sm btn-outline">
            Services Hub
          </Link>
        </div>
        <span className="badge badge-primary" dir="ltr">
          {pkg.code}
        </span>
      </div>

      {/* Package Spotlight Card */}
      <div
        className="card card-body"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
          alignItems: "center",
          border: "1.5px solid var(--primary)",
        }}
      >
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span className="badge badge-primary" style={{ gap: 4 }}>
              <Wifi size={12} /> {pkg.networkSpeed}
            </span>
            {pkg.badge && <span className="badge badge-gold">{pkg.badge}</span>}
          </div>
          <h1 style={{ margin: 0, fontSize: "clamp(1.35rem, 2.5vw, 1.85rem)" }}>
            {pkg.name} · <span dir="ltr">{pkg.dataLabel}</span> ({pkg.durationDays} Days)
          </h1>
          <p style={{ margin: 0, color: "var(--text-muted)" }}>{recDesc}</p>
          <div dir="ltr" style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", paddingTop: 4 }}>
            {pkg.operators.map((opId) => (
              <TelecomOfficialLogo key={opId} operatorId={opId} height={18} compact />
            ))}
          </div>
        </div>

        <div
          style={{
            padding: 16,
            borderRadius: 14,
            background: "var(--surface-muted)",
            display: "grid",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.86rem" }}>Total Price</span>
            <strong dir="ltr" style={{ fontSize: "1.55rem", color: "var(--primary)" }}>
              {money(pkg.priceMad)}
            </strong>
          </div>
          <div style={{ display: "grid", gap: 4, fontSize: "0.84rem" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <CheckCircle2 size={14} color="var(--success)" /> Instant QR delivery by email
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Globe2 size={14} color="var(--primary)" /> Hotspot / Tethering supported
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <ShieldCheck size={14} color="var(--success)" /> Zero international roaming fees
            </span>
          </div>
        </div>
      </div>

      <EsimExperience
        initialPackageCode={pkg.code}
        esimHistory={esimHistory}
        onReloadHistory={loadHistory}
        standalone
      />
    </div>
  );
}
