"use client";

import React from "react";

export function BrandLogo({
  variant = "auto",
  size = "md",
  showArabic = true,
}: {
  variant?: "auto" | "light" | "dark";
  size?: "sm" | "md" | "lg";
  showArabic?: boolean;
}) {
  const height = size === "sm" ? 30 : size === "lg" ? 48 : 38;
  const titleSize = size === "sm" ? "1.02rem" : size === "lg" ? "1.45rem" : "1.16rem";
  const arabicSize = size === "sm" ? "0.72rem" : size === "lg" ? "0.9rem" : "0.78rem";

  return (
    <span
      dir="ltr"
      className={`brand-lockup brand-lockup-${variant}`}
      style={{ display: "inline-flex", alignItems: "center", gap: size === "sm" ? 9 : 11 }}
    >
      <img
        src="/brand/emblem-only.png"
        alt="MARHABA"
        className="brand-img-light"
        style={{ height, width: "auto", objectFit: "contain", flexShrink: 0, display: variant === "dark" ? "none" : undefined }}
      />
      <img
        src="/brand/emblem-only-dark.png"
        alt="MARHABA"
        className="brand-img-dark"
        style={{ height, width: "auto", objectFit: "contain", flexShrink: 0, display: variant === "light" ? "none" : undefined }}
      />
      <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center", lineHeight: 1.04 }}>
        <span
          className="brand-wordmark"
          style={{
            fontFamily: '"Montserrat", sans-serif',
            fontWeight: 800,
            fontSize: titleSize,
            letterSpacing: "0.08em",
            color: variant === "dark" ? "#FFFFFF" : undefined,
          }}
        >
          MARHABA
        </span>
        {showArabic && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontSize: arabicSize,
              fontWeight: 700,
              marginTop: 2,
              width: "100%",
            }}
          >
            <span style={{ flex: 1, maxWidth: 16, height: 1.8, background: "var(--gold)", borderRadius: 2 }} />
            <span className="brand-arabic" style={{ color: variant === "dark" ? "#E9DCC5" : undefined }}>
              مرحبا
            </span>
            <span style={{ flex: 1, maxWidth: 16, height: 1.8, background: "var(--gold)", borderRadius: 2 }} />
          </span>
        )}
      </span>
    </span>
  );
}
