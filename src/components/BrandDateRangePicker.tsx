"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useApp } from "./AppProvider";
import { getDateLocale, getWeekdaysShort } from "@/lib/i18n";

function parseIso(iso: string): Date | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatReadable(iso: string, locale: string, fallback: string): string {
  const d = parseIso(iso);
  if (!d) return fallback;
  return d.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });
}

function buildMonthCells(year: number, month: number): Array<{ iso: string; day: number } | null> {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay(); // Sunday-first like reference dual-month calendar
  const total = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ iso: string; day: number } | null> = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= total; d++) {
    cells.push({ iso: toIso(new Date(year, month, d)), day: d });
  }
  return cells;
}

export function BrandDateRangePicker({
  mode = "range",
  startDate,
  endDate = "",
  onChangeStart,
  onChangeEnd,
  startLabel = "Check-in",
  endLabel = "Check-out",
  minIso,
  align = "start",
  dualMonth = true,
  externalOpen,
  onOpenChange,
}: {
  mode?: "range" | "single";
  startDate: string;
  endDate?: string;
  onChangeStart: (iso: string) => void;
  onChangeEnd?: (iso: string) => void;
  startLabel?: string;
  endLabel?: string;
  minIso?: string;
  align?: "start" | "end";
  dualMonth?: boolean;
  externalOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { lang, tr } = useApp();
  const dateLocale = getDateLocale(lang);
  const sundayFirstWeekdays = useMemo(() => {
    // getWeekdaysShort returns Mon..Sun or locale order; let's build crisp Sun..Sat headers matching our grid
    const base = new Date(2026, 10, 1); // Sunday Nov 1 2026
    const out: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      out.push(d.toLocaleDateString(dateLocale, { weekday: "narrow" }));
    }
    return out.length === 7 ? out : getWeekdaysShort(lang);
  }, [dateLocale, lang]);

  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = (next: boolean | ((prev: boolean) => boolean)) => {
    const val = typeof next === "function" ? next(open) : next;
    setInternalOpen(val);
    onOpenChange?.(val);
  };

  const [pickingEnd, setPickingEnd] = useState(false);
  const [hoverIso, setHoverIso] = useState<string>("");
  const initialDate = parseIso(startDate) || new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
  const rootRef = useRef<HTMLDivElement>(null);

  const todayIso = useMemo(() => toIso(new Date()), []);
  const minAllowed = minIso || todayIso;

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const secondMonthDate = useMemo(() => new Date(viewYear, viewMonth + 1, 1), [viewYear, viewMonth]);

  const firstMonthCells = useMemo(() => buildMonthCells(viewYear, viewMonth), [viewYear, viewMonth]);
  const secondMonthCells = useMemo(
    () => buildMonthCells(secondMonthDate.getFullYear(), secondMonthDate.getMonth()),
    [secondMonthDate]
  );

  const firstMonthTitle = new Date(viewYear, viewMonth, 1).toLocaleDateString(dateLocale, {
    month: "long",
    year: "numeric",
  });
  const secondMonthTitle = secondMonthDate.toLocaleDateString(dateLocale, {
    month: "long",
    year: "numeric",
  });

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const nightsCount = useMemo(() => {
    const s = parseIso(startDate);
    const e = parseIso(endDate);
    if (!s || !e) return 0;
    return Math.max(0, Math.round((e.getTime() - s.getTime()) / 86400_000));
  }, [startDate, endDate]);

  const handleDayClick = (iso: string) => {
    if (iso < minAllowed) return;
    if (mode === "single") {
      onChangeStart(iso);
      setOpen(false);
      return;
    }

    if (!pickingEnd || !startDate || iso <= startDate) {
      onChangeStart(iso);
      if (onChangeEnd && endDate && endDate <= iso) {
        const nextDay = parseIso(iso)!;
        nextDay.setDate(nextDay.getDate() + 1);
        onChangeEnd(toIso(nextDay));
      }
      setPickingEnd(true);
    } else {
      onChangeEnd?.(iso);
      setPickingEnd(false);
      setOpen(false);
    }
  };

  const applyQuickNights = (n: number) => {
    const base = parseIso(startDate) || new Date();
    if (toIso(base) < minAllowed) {
      const m = parseIso(minAllowed)!;
      onChangeStart(minAllowed);
      const e = new Date(m);
      e.setDate(e.getDate() + n);
      onChangeEnd?.(toIso(e));
    } else {
      const e = new Date(base);
      e.setDate(e.getDate() + n);
      onChangeEnd?.(toIso(e));
    }
    setPickingEnd(false);
    setOpen(false);
  };

  const clearDates = () => {
    onChangeStart("");
    onChangeEnd?.("");
    setPickingEnd(false);
  };

  const showDual = mode === "range" && dualMonth;

  const renderMonth = (title: string, cells: Array<{ iso: string; day: number } | null>, showPrev: boolean, showNext: boolean) => (
    <div style={{ minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, minHeight: 30 }}>
        {showPrev ? (
          <button type="button" className="counter-btn" onClick={() => shiftMonth(-1)} aria-label="Previous month">
            <ChevronLeft size={14} />
          </button>
        ) : (
          <span style={{ width: 28 }} />
        )}
        <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "var(--text)" }}>{title}</div>
        {showNext ? (
          <button type="button" className="counter-btn" onClick={() => shiftMonth(1)} aria-label="Next month">
            <ChevronRight size={14} />
          </button>
        ) : (
          <span style={{ width: 28 }} />
        )}
      </div>

      <div className="brand-cal-weekdays">
        {sundayFirstWeekdays.map((d, i) => (
          <span key={`${d}-${i}`}>{d}</span>
        ))}
      </div>

      <div className="brand-cal-grid">
        {cells.map((cell, idx) => {
          if (!cell) return <span key={`empty-${idx}`} />;
          const disabled = cell.iso < minAllowed;
          const isStart = cell.iso === startDate;
          const isEnd = mode === "range" && cell.iso === endDate;
          const previewEnd = pickingEnd && startDate && hoverIso > startDate ? hoverIso : endDate;
          const inRange = mode === "range" && startDate && previewEnd && cell.iso > startDate && cell.iso < previewEnd;
          const isToday = cell.iso === todayIso;
          return (
            <button
              key={cell.iso}
              type="button"
              disabled={disabled}
              onMouseEnter={() => {
                if (pickingEnd && !disabled) setHoverIso(cell.iso);
              }}
              onClick={() => handleDayClick(cell.iso)}
              className={`brand-cal-day ${isStart || isEnd ? "selected" : ""} ${inRange ? "in-range" : ""} ${isToday ? "today" : ""}`}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div ref={rootRef} className="brand-cal-wrap">
      {mode === "single" ? (
        <button
          type="button"
          className={`brand-cal-trigger ${open ? "open" : ""}`}
          onClick={() => setOpen((o) => !o)}
        >
          <CalendarIcon size={15} style={{ color: "var(--primary)", flexShrink: 0 }} />
          <div style={{ textAlign: "start" }}>
            {startLabel && (
              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
                {startLabel}
              </div>
            )}
            <div style={{ fontWeight: 700, fontSize: "0.86rem" }}>{formatReadable(startDate, dateLocale, tr("selectDate"))}</div>
          </div>
        </button>
      ) : (
        <div className="brand-cal-pair">
          <button
            type="button"
            className={`brand-cal-trigger ${open && !pickingEnd ? "open" : ""}`}
            onClick={() => {
              setPickingEnd(false);
              setOpen(true);
            }}
          >
            <CalendarIcon size={14} style={{ color: "var(--primary)", flexShrink: 0 }} />
            <div style={{ textAlign: "start", overflow: "hidden" }}>
              <div style={{ fontSize: "0.66rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
                {startLabel}
              </div>
              <div style={{ fontWeight: 700, fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                {formatReadable(startDate, dateLocale, tr("selectDate"))}
              </div>
            </div>
          </button>

          <button
            type="button"
            className={`brand-cal-trigger ${open && pickingEnd ? "open" : ""}`}
            onClick={() => {
              setPickingEnd(true);
              setOpen(true);
            }}
          >
            <CalendarIcon size={14} style={{ color: "var(--gold)", flexShrink: 0 }} />
            <div style={{ textAlign: "start", overflow: "hidden" }}>
              <div style={{ fontSize: "0.66rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
                {endLabel}
              </div>
              <div style={{ fontWeight: 700, fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                {formatReadable(endDate, dateLocale, tr("selectDate"))}
              </div>
            </div>
          </button>
        </div>
      )}

      {open && (
        <div
          className={`brand-cal-popover ${showDual ? "dual" : ""} ${align === "end" ? "align-end" : ""}`}
          onMouseLeave={() => setHoverIso("")}
        >
          {mode === "range" && (
            <div className="brand-cal-header">
              <div>
                <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text)" }}>
                  {nightsCount > 0
                    ? `${nightsCount} ${nightsCount === 1 ? tr("nightSingular") : tr("nightPlural")}`
                    : tr("selectDatesTitle")}
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 2 }}>
                  {startDate && endDate
                    ? `${formatReadable(startDate, dateLocale, "")} – ${formatReadable(endDate, dateLocale, "")}`
                    : tr("selectDatesSub")}
                </div>
              </div>

              <div className="brand-cal-pill-box">
                <button
                  type="button"
                  className={`brand-cal-pill-half ${!pickingEnd ? "active" : ""}`}
                  onClick={() => setPickingEnd(false)}
                >
                  <span style={{ fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)" }}>
                    {startLabel}
                  </span>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: startDate ? "var(--text)" : "var(--text-muted)" }}>
                    {formatReadable(startDate, dateLocale, tr("selectDate"))}
                  </span>
                </button>
                <button
                  type="button"
                  className={`brand-cal-pill-half ${pickingEnd ? "active" : ""}`}
                  onClick={() => setPickingEnd(true)}
                >
                  <span style={{ fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)" }}>
                    {endLabel}
                  </span>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: endDate ? "var(--text)" : "var(--text-muted)" }}>
                    {formatReadable(endDate, dateLocale, tr("selectDate"))}
                  </span>
                </button>
              </div>
            </div>
          )}

          {showDual ? (
            <div className="brand-cal-months-grid">
              {renderMonth(firstMonthTitle, firstMonthCells, true, false)}
              <div className="brand-cal-second-month">
                {renderMonth(secondMonthTitle, secondMonthCells, false, true)}
              </div>
            </div>
          ) : (
            renderMonth(firstMonthTitle, firstMonthCells, true, true)
          )}

          {mode === "range" && (
            <div
              style={{
                marginTop: 12,
                paddingTop: 10,
                borderTop: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
                {[2, 3, 5, 7].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className="btn btn-sm btn-outline"
                    style={{ padding: "3px 8px", fontSize: "0.72rem", borderRadius: 999 }}
                    onClick={() => applyQuickNights(n)}
                  >
                    +{n} {n === 1 ? tr("nightSingular") : tr("nightPlural")}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {(startDate || endDate) && (
                  <button
                    type="button"
                    onClick={clearDates}
                    style={{
                      background: "transparent",
                      border: 0,
                      color: "var(--text)",
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      textDecoration: "underline",
                      cursor: "pointer",
                    }}
                  >
                    {tr("clearDatesBtn")}
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  style={{ borderRadius: 999, padding: "5px 14px" }}
                  onClick={() => setOpen(false)}
                >
                  {tr("closeBtn")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
