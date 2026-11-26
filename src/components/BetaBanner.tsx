"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FlaskConical, UserCheck, X } from "lucide-react";
import { useApp, type DemoRoleKey } from "./AppProvider";

export function BetaBanner() {
  const { user, activateDemoAccount, activatingDemo, tr } = useApp();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("marhaba_beta_banner_hidden") === "1") {
      setHidden(true);
    }
  }, []);

  if (hidden) return null;

  const demoRoles: Array<{ id: DemoRoleKey; label: string }> = [
    { id: "traveler", label: tr("roleTraveler") },
    { id: "partner", label: tr("rolePartner") },
    { id: "affiliate", label: tr("roleAffiliate") },
  ];

  const roleLabel =
    user?.role === "partner_owner"
      ? tr("rolePartner")
      : user?.role === "affiliate"
      ? tr("roleAffiliate")
      : tr("roleTraveler");

  return (
    <div className="beta-ribbon">
      <div className="container beta-ribbon-inner">
        <div className="beta-ribbon-track no-scrollbar">
          <span className="beta-ribbon-badge">
            <FlaskConical size={12} />
            <span>{tr("publicBeta")}</span>
          </span>
          <span style={{ color: "var(--text-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>
            {user ? `${user.full_name.split(" ")[0]} (${roleLabel}):` : tr("demoLabel")}
          </span>
          {demoRoles.map((r) => {
            const isCurrent =
              (r.id === "traveler" && user?.role === "traveler") ||
              (r.id === "partner" && user?.role === "partner_owner") ||
              (r.id === "affiliate" && user?.role === "affiliate");
            return (
              <button
                key={r.id}
                type="button"
                disabled={!!activatingDemo || isCurrent}
                onClick={() => activateDemoAccount(r.id)}
                className={`beta-demo-pill ${isCurrent ? "active" : ""}`}
              >
                <UserCheck size={11} />
                <span>{activatingDemo === r.id ? "..." : r.label}</span>
              </button>
            );
          })}
          <Link href="/feedback" className="beta-feedback-link">
            {tr("feedbackLink")}
          </Link>
        </div>
        <button
          type="button"
          aria-label="Dismiss beta notice"
          onClick={() => {
            setHidden(true);
            if (typeof window !== "undefined") sessionStorage.setItem("marhaba_beta_banner_hidden", "1");
          }}
          className="beta-close-btn"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
