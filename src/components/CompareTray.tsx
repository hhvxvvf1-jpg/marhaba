"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Check, Scale, ShieldCheck, Star, Trash2, X } from "lucide-react";
import { useApp } from "./AppProvider";
import { AmenityIcon, CategoryIcon } from "./BrandIcons";
import { tAmenity, tCategory, tCity, tRegion, tUnit } from "@/lib/i18n";

export function CompareTray() {
  const { lang, tr, money, compareItems, toggleCompare, clearCompare, compareOpen, setCompareOpen } = useApp();

  useEffect(() => {
    if (!compareOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCompareOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [compareOpen, setCompareOpen]);

  if (compareItems.length === 0) return null;

  const localizedTitle = (item: (typeof compareItems)[number]) =>
    lang === "ar" && item.title_ar ? item.title_ar : lang === "fr" && item.title_fr ? item.title_fr : item.title;

  const modal =
    compareOpen && typeof document !== "undefined"
      ? createPortal(
          <div className="modal-backdrop" onClick={() => setCompareOpen(false)} role="dialog" aria-modal="true" aria-label={tr("compareTitle")}>
            <div className="modal-panel" style={{ maxWidth: 920, padding: 20 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Scale size={18} style={{ color: "var(--primary)" }} />
                  <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "var(--text)" }}>{tr("compareTitle")}</h2>
                  <span className="badge badge-primary">{compareItems.length} / 3</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" className="btn btn-sm btn-outline" onClick={clearCompare}>
                    <Trash2 size={14} /> {tr("clearCompare")}
                  </button>
                  <button type="button" className="btn btn-sm btn-outline" onClick={() => setCompareOpen(false)} aria-label={tr("closeBtn")}>
                    <X size={15} />
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${compareItems.length}, minmax(220px, 1fr))`,
                  gap: 14,
                  overflowX: "auto",
                }}
              >
                {compareItems.map((item) => {
                  const title = localizedTitle(item);
                  const score = Math.min(10, Math.round((item.rating_avg || 4.5) * 2 * 10) / 10).toFixed(1);
                  return (
                    <div key={item.id} className="card" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
                      <div style={{ position: "relative", aspectRatio: "16/10", background: "var(--surface-muted)" }}>
                        <img src={item.image} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button
                          type="button"
                          onClick={() => toggleCompare(item)}
                          aria-label={tr("closeBtn")}
                          style={{
                            position: "absolute",
                            top: 8,
                            insetInlineEnd: 8,
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            border: 0,
                            background: "rgba(17,26,53,0.78)",
                            color: "#fff",
                            display: "grid",
                            placeItems: "center",
                            cursor: "pointer",
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div className="card-body" style={{ display: "grid", gap: 10, flex: 1 }}>
                        <span className="badge badge-muted" style={{ justifySelf: "start" }}>
                          <CategoryIcon category={item.category} size={13} />
                          <span>{tCategory(lang, item.category)}</span>
                        </span>
                        <div style={{ fontWeight: 800, fontSize: "0.98rem", color: "var(--text)", lineHeight: 1.3 }}>{title}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                          {tCity(lang, item.city)}
                          {item.region ? ` · ${tRegion(lang, item.region)}` : ""}
                        </div>

                        <div style={{ display: "grid", gap: 6, paddingBlock: 8, borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", fontSize: "0.82rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ color: "var(--text-muted)" }}>{tr("pricePerUnit")}</span>
                            <strong style={{ color: "var(--primary)", fontSize: "1rem" }}>
                              {money(item.base_price_mad)} <span style={{ fontSize: "0.72rem", fontWeight: 500 }}>/{tUnit(lang, item.unit_type)}</span>
                            </strong>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ color: "var(--text-muted)" }}>{tr("ratingLabel")}</span>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700 }}>
                              <Star size={12} fill="#f2b705" color="#f2b705" /> {score} ({item.review_count})
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ color: "var(--text-muted)" }}>{tr("verifiedBadge")}</span>
                            <span style={{ color: item.verified ? "var(--success)" : "var(--text-muted)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <ShieldCheck size={13} /> {item.verified ? tr("verifiedYes") : "—"}
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ color: "var(--text-muted)" }}>{tr("freeCancelFilter")}</span>
                            <span style={{ color: item.cancellation_policy === "flexible" ? "var(--success)" : "var(--text-muted)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                              {item.cancellation_policy === "flexible" ? (
                                <>
                                  <Check size={13} /> {tr("freeCancelYes")}
                                </>
                              ) : (
                                tr("freeCancelNo")
                              )}
                            </span>
                          </div>
                        </div>

                        {item.amenities.length > 0 && (
                          <div>
                            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>{tr("amenitiesLabel")}</div>
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                              {item.amenities.slice(0, 4).map((a) => (
                                <span key={a} className="badge badge-muted" style={{ fontSize: "0.7rem" }}>
                                  <AmenityIcon label={a} size={11} />
                                  <span>{tAmenity(lang, a)}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <Link
                          href={`/properties/${item.slug}`}
                          onClick={() => setCompareOpen(false)}
                          className="btn btn-sm btn-primary"
                          style={{ marginTop: "auto", width: "100%" }}
                        >
                          {tr("seeAvailability")}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div className="compare-dock no-print" role="region" aria-label={tr("compareSelected")}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <Scale size={16} style={{ color: "var(--primary)", flexShrink: 0 }} />
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {compareItems.map((it) => (
              <button
                key={it.id}
                type="button"
                title={localizedTitle(it)}
                onClick={() => toggleCompare(it)}
                style={{
                  position: "relative",
                  padding: 0,
                  border: "2px solid var(--primary)",
                  borderRadius: 8,
                  overflow: "hidden",
                  width: 38,
                  height: 28,
                  cursor: "pointer",
                  background: "transparent",
                }}
              >
                <img src={it.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </button>
            ))}
          </div>
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap" }}>
            {tr("compareSelected")} ({compareItems.length}/3)
          </span>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button type="button" className="btn btn-sm btn-outline" onClick={clearCompare} aria-label={tr("clearCompare")}>
            <Trash2 size={13} />
          </button>
          <button type="button" className="btn btn-sm btn-primary" onClick={() => setCompareOpen(true)}>
            {tr("compareBtn")}
          </button>
        </div>
      </div>
      {modal}
    </>
  );
}
