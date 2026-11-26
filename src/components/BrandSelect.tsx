"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

export interface BrandSelectOption {
  value: string;
  label: string;
  hint?: string;
}

export function BrandSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  ariaLabel,
  style,
  compact = false,
  searchable,
}: {
  value: string;
  onChange: (value: string) => void;
  options: BrandSelectOption[];
  placeholder?: string;
  ariaLabel?: string;
  style?: React.CSSProperties;
  compact?: boolean;
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const showSearch = searchable ?? options.length >= 10;

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q) ||
        (o.hint && o.hint.toLowerCase().includes(q))
    );
  }, [options, query]);

  const current = options.find((o) => o.value === value);

  return (
    <div ref={rootRef} className="brand-select-wrap" style={style}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        className={`brand-select-trigger ${open ? "open" : ""} ${compact ? "compact" : ""}`}
        onClick={() => {
          setOpen((o) => {
            if (!o) setQuery("");
            return !o;
          });
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {current ? current.label : placeholder}
        </span>
        <ChevronDown
          size={15}
          style={{
            flexShrink: 0,
            color: "var(--primary)",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.15s ease",
          }}
        />
      </button>

      {open && (
        <div className="brand-select-menu" role="listbox">
          {showSearch && (
            <div className="brand-select-search-wrap">
              <Search size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
              <input
                type="text"
                className="brand-select-search"
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
          )}
          {filtered.length === 0 ? (
            <div style={{ padding: "10px 12px", fontSize: "0.8rem", color: "var(--text-muted)" }}>No match found</div>
          ) : (
            filtered.map((opt) => {
              const active = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`brand-select-option ${active ? "active" : ""}`}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <div style={{ textAlign: "start" }}>
                    <div style={{ fontWeight: active ? 700 : 500 }}>{opt.label}</div>
                    {opt.hint && <div style={{ fontSize: "0.72rem", opacity: 0.8 }}>{opt.hint}</div>}
                  </div>
                  {active && <Check size={14} style={{ flexShrink: 0, color: "var(--gold)" }} />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
