"use client";

import React from "react";
import { useApp } from "./AppProvider";

export function MoroccanPaymentBadges({ compact = false }: { compact?: boolean }) {
  const { tr } = useApp();

  return (
    <div
      className="card card-body"
      style={{
        padding: compact ? "12px 14px" : "16px 20px",
        display: "grid",
        gap: 10,
      }}
    >
      <div style={{ fontSize: "0.86rem", fontWeight: 700, color: "var(--text)" }}>
        {tr("paymentBrandsTitle")}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        {/* VISA */}
        <span className="pay-brand-pill" style={{ color: "#1a1f71", fontWeight: 900, fontStyle: "italic", letterSpacing: "0.03em" }}>
          VISA
        </span>

        {/* Mastercard */}
        <span className="pay-brand-pill" style={{ gap: 5 }}>
          <span style={{ display: "inline-flex", alignItems: "center" }} aria-hidden="true">
            <span style={{ width: 13, height: 13, borderRadius: "50%", background: "#eb001b", display: "inline-block" }} />
            <span style={{ width: 13, height: 13, borderRadius: "50%", background: "#f79e1b", marginInlineStart: -5, opacity: 0.9, display: "inline-block" }} />
          </span>
          <span style={{ fontWeight: 700, fontSize: "0.78rem" }}>Mastercard</span>
        </span>

        {/* PayPal */}
        <span className="pay-brand-pill" style={{ color: "#003087", fontWeight: 800 }}>
          Pay<span style={{ color: "#0079c1" }}>Pal</span>
        </span>

        {/* CMI */}
        <span className="pay-brand-pill" style={{ color: "#d61f26", fontWeight: 900, letterSpacing: "0.05em" }}>
          CMI
        </span>

        {/* FATOURATI */}
        <span className="pay-brand-pill" style={{ fontWeight: 900, letterSpacing: "0.06em" }}>
          FATOURATI
        </span>

        {/* Tasshilat */}
        <span
          className="pay-brand-pill"
          style={{
            background: "linear-gradient(135deg, #fde047, #f59e0b)",
            color: "#7f1d1d",
            borderColor: "#d97706",
            fontWeight: 800,
          }}
        >
          تسهيلات · Tasshilat
        </span>

        {/* Chaabi Cash */}
        <span
          className="pay-brand-pill"
          style={{
            background: "rgba(249, 115, 22, 0.1)",
            borderColor: "rgba(249, 115, 22, 0.35)",
            color: "#ea580c",
            fontWeight: 800,
          }}
        >
          <span
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "#f97316",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              fontSize: "0.65rem",
              fontWeight: 900,
            }}
          >
            ☺
          </span>
          <span>الشعبي كاش · Chaabi Cash</span>
        </span>

        {/* CashPlus & Wafacash */}
        <span className="pay-brand-pill" style={{ fontWeight: 700, fontSize: "0.78rem" }}>
          CashPlus · Wafacash
        </span>
      </div>
    </div>
  );
}
