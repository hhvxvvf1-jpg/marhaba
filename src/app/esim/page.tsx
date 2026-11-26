"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, LayoutGrid, Wifi } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { EsimExperience } from "@/components/EsimExperience";

export default function EsimHubPage() {
  const { user, tr } = useApp();
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

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 48, display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div dir="ltr" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <Link href="/services" className="btn btn-sm btn-outline">
            <ArrowLeft size={14} /> {tr("navServices")}
          </Link>
          <span className="badge badge-primary" style={{ gap: 5 }}>
            <Wifi size={12} /> /esim
          </span>
        </div>
        <Link href="/services?tab=all" className="btn btn-sm btn-outline">
          <LayoutGrid size={14} /> {tr("allCategories")}
        </Link>
      </div>

      <EsimExperience
        esimHistory={esimHistory}
        onReloadHistory={loadHistory}
        standalone
      />
    </div>
  );
}
