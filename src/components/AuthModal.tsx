"use client";

import React, { useEffect, useState } from "react";
import { X, LogIn, UserPlus } from "lucide-react";
import { useApp } from "./AppProvider";
import { BrandLogo } from "./BrandLogo";
import { BrandSelect } from "./BrandSelect";

export function AuthModal() {
  const { authModalOpen, closeAuthModal, authMode, setAuthMode, refreshUser, activateDemoAccount, activatingDemo, tr } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [accountType, setAccountType] = useState<"traveler" | "partner" | "affiliate">("traveler");
  const [businessName, setBusinessName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAuthModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [authModalOpen, closeAuthModal]);

  if (!authModalOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const endpoint = authMode === "login" ? "/api/v1/auth/login" : "/api/v1/auth/register";
      const payload =
        authMode === "login"
          ? { email, password }
          : {
              email,
              password,
              fullName,
              phone,
              accountType,
              businessName: accountType === "partner" ? businessName : undefined,
            };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Authentication failed");
        return;
      }
      if (typeof window !== "undefined" && data.sessionToken) {
        localStorage.setItem("marhaba_session_token", data.sessionToken);
      }
      await refreshUser();
      closeAuthModal();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Authentication" onClick={closeAuthModal}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <BrandLogo size="sm" />
          <button type="button" className="btn btn-sm btn-outline" onClick={closeAuthModal} aria-label={tr("closeBtn")}>
            <X size={16} />
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <button
            type="button"
            className={`btn btn-sm ${authMode === "login" ? "btn-primary" : "btn-outline"}`}
            style={{ flex: 1 }}
            onClick={() => setAuthMode("login")}
          >
            <LogIn size={15} /> {tr("nav.signIn")}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${authMode === "register" ? "btn-primary" : "btn-outline"}`}
            style={{ flex: 1 }}
            onClick={() => setAuthMode("register")}
          >
            <UserPlus size={15} /> {tr("nav.register")}
          </button>
        </div>

        {error && (
          <div className="badge badge-danger" style={{ display: "block", padding: "10px 12px", borderRadius: 10, marginBottom: 12 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
          {authMode === "register" && (
            <>
              <div>
                <label className="field-label">{tr("fullNameLabel")}</label>
                <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Salma Benali" />
              </div>
              <div>
                <label className="field-label">{tr("phoneLabel")}</label>
                <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+212 6 00 00 00 00" />
              </div>
              <div>
                <label className="field-label">{tr("accountTypeLabel")}</label>
                <BrandSelect
                  value={accountType}
                  ariaLabel={tr("accountTypeLabel")}
                  onChange={(v) => setAccountType(v as "traveler" | "partner" | "affiliate")}
                  options={[
                    { value: "traveler", label: tr("demoTraveler") },
                    { value: "partner", label: tr("demoPartner") },
                    { value: "affiliate", label: tr("demoAffiliate") },
                  ]}
                />
              </div>
              {accountType === "partner" && (
                <div>
                  <label className="field-label">{tr("businessNameLabel")}</label>
                  <input
                    className="input"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                    placeholder="Riad Atlas Hospitality SARL"
                  />
                </div>
              )}
            </>
          )}

          <div>
            <label className="field-label">{tr("emailLabel")}</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <div>
            <label className="field-label">{tr("passwordLabel")}</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </div>

          <button type="submit" className="btn btn-primary" disabled={busy} style={{ width: "100%", marginTop: 4 }}>
            {busy ? "..." : authMode === "login" ? tr("nav.signIn") : tr("nav.register")}
          </button>
        </form>

        <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: 8 }}>
            {tr("sandboxDemoLabel")}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <button type="button" disabled={busy || !!activatingDemo} className="btn btn-sm btn-outline" onClick={() => activateDemoAccount("traveler")}>
              {activatingDemo === "traveler" ? "..." : tr("demoTraveler")}
            </button>
            <button type="button" disabled={busy || !!activatingDemo} className="btn btn-sm btn-outline" onClick={() => activateDemoAccount("partner")}>
              {activatingDemo === "partner" ? "..." : tr("demoPartner")}
            </button>
            <button type="button" disabled={busy || !!activatingDemo} className="btn btn-sm btn-outline" onClick={() => activateDemoAccount("affiliate")}>
              {activatingDemo === "affiliate" ? "..." : tr("demoAffiliate")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
