"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Coins, Download, Globe, ShieldCheck } from "lucide-react";
import { useApp } from "./AppProvider";
import { BrandLogo } from "./BrandLogo";
import { LANGUAGES, tCity, type Lang } from "@/lib/i18n";
import type { Currency } from "@/lib/config";

export function Footer() {
  const { lang, setLang, currency, setCurrency, tr } = useApp();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    setStatus("");
    const res = await fetch("/api/v1/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (res.ok) {
      setStatus(data.message || "Subscribed!");
      setEmail("");
    } else {
      setStatus(data.error || "Failed");
    }
  }

  return (
    <footer className="site-footer brand-zellige">
      <div className="container">
        <div className="grid-4" style={{ marginBottom: 34 }}>
          <div>
            <div style={{ marginBottom: 12 }}>
              <BrandLogo variant="dark" size="md" />
            </div>
            <p style={{ fontSize: "0.86rem", color: "#cbd5e1", margin: "0 0 12px" }}>
              {tr("footerDesc")}
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  padding: "4px 9px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.16)",
                  color: "#e2e8f0",
                }}
              >
                <ShieldCheck size={12} color="#f2b705" /> {tr("cndpBadge")}
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  padding: "4px 9px",
                  borderRadius: 999,
                  background: "rgba(242,183,5,0.14)",
                  border: "1px solid rgba(242,183,5,0.35)",
                  color: "#f2b705",
                }}
              >
                {tr("sandboxBadge")}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("marhaba:open-pwa-install"));
                  }
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  padding: "4px 9px",
                  borderRadius: 999,
                  background: "rgba(33,72,200,0.45)",
                  border: "1px solid rgba(147,197,253,0.45)",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                <Download size={12} /> {tr("pwaInstallBtn")} (PWA)
              </button>
            </div>
          </div>

          <div>
            <h4 style={{ margin: "0 0 10px", fontSize: "0.95rem", color: "#fff" }}>{tr("home.destinations")}</h4>
            <div style={{ display: "grid", gap: 6, fontSize: "0.86rem", color: "#cbd5e1" }}>
              <Link href="/destinations/laayoune">{tCity(lang, "Laâyoune")}</Link>
              <Link href="/destinations/dakhla">{tCity(lang, "Dakhla")}</Link>
              <Link href="/destinations/marrakech">{tCity(lang, "Marrakech")}</Link>
              <Link href="/destinations/casablanca">{tCity(lang, "Casablanca")}</Link>
              <Link href="/destinations/fes">{tCity(lang, "Fès")}</Link>
              <Link href="/destinations/chefchaouen">{tCity(lang, "Chefchaouen")}</Link>
            </div>
          </div>

          <div>
            <h4 style={{ margin: "0 0 10px", fontSize: "0.95rem", color: "#fff" }}>{tr("ecosystemTitle")}</h4>
            <div style={{ display: "grid", gap: 6, fontSize: "0.86rem", color: "#cbd5e1" }}>
              <Link href="/search">{tr("navSearchMarketplace")}</Link>
              <Link href="/services">{tr("navFlightsTrainsEsim")}</Link>
              <Link href="/planner">{tr("navPlanner")}</Link>
              <Link href="/partner">{tr("navPartnerPortal")}</Link>
              <Link href="/feedback">{tr("navBetaFeedback")}</Link>
              <Link href="/legal/privacy">{tr("navPrivacy")}</Link>
              <Link href="/legal/terms">{tr("navTerms")}</Link>
            </div>
          </div>

          <div>
            <h4 style={{ margin: "0 0 10px", fontSize: "0.95rem", color: "#fff" }}>{tr("newsletterTitleShort")}</h4>
            <form onSubmit={subscribe} style={{ display: "flex", gap: 8 }}>
              <input
                className="input"
                type="email"
                required
                placeholder={tr("newsletterPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ background: "rgba(255,255,255,0.1)", color: "#fff", borderColor: "rgba(255,255,255,0.22)" }}
              />
              <button type="submit" className="btn btn-gold btn-sm">
                {tr("joinBtn")}
              </button>
            </form>
            {status && <div style={{ marginTop: 8, fontSize: "0.8rem", color: "#f2b705" }}>{status}</div>}
            <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 12 }}>
              {tr("sandboxNote")}
            </p>
          </div>
        </div>

        {/* Executive Bottom Bar */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.14)",
            paddingTop: 18,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 14,
            fontSize: "0.8rem",
            color: "#cbd5e1",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <img src="/brand/emblem-only-dark.png" alt="MARHABA" style={{ height: 20, width: "auto" }} />
            <span dir="ltr" style={{ fontWeight: 700, color: "#fff" }}>
              © 2026 MARHABA
            </span>
            <span style={{ color: "#94a3b8" }}>· {tr("footerSubline")}</span>
            <span
              style={{
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.04em",
                padding: "2px 8px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.08)",
                color: "#e2e8f0",
              }}
            >
              {tr("publicBeta")}
            </span>
            <span style={{ color: "#64748b" }}>|</span>
            <Link href="/legal/privacy" style={{ color: "#cbd5e1" }}>
              {tr("navPrivacy")}
            </Link>
            <Link href="/legal/terms" style={{ color: "#cbd5e1" }}>
              {tr("navTerms")}
            </Link>
            <Link href="/feedback" style={{ color: "#cbd5e1" }}>
              {tr("feedbackLink")}
            </Link>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 6px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.16)",
              }}
            >
              <Globe size={13} color="#f2b705" style={{ marginInlineStart: 4 }} />
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLang(l.code as Lang)}
                  style={{
                    border: "none",
                    cursor: "pointer",
                    borderRadius: 999,
                    padding: "3px 8px",
                    fontSize: "0.73rem",
                    fontWeight: 700,
                    background: lang === l.code ? "#f2b705" : "transparent",
                    color: lang === l.code ? "#111a35" : "#cbd5e1",
                  }}
                >
                  {l.code.toUpperCase()}
                </button>
              ))}
            </div>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 6px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.16)",
              }}
            >
              <Coins size={13} color="#f2b705" style={{ marginInlineStart: 4 }} />
              {(["MAD", "EUR", "USD"] as Currency[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  style={{
                    border: "none",
                    cursor: "pointer",
                    borderRadius: 999,
                    padding: "3px 8px",
                    fontSize: "0.73rem",
                    fontWeight: 700,
                    background: currency === c ? "#f2b705" : "transparent",
                    color: currency === c ? "#111a35" : "#cbd5e1",
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
