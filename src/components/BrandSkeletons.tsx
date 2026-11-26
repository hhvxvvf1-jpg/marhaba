import React from "react";

export function CardTrace({ height = 190 }: { height?: number }) {
  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div className="skeleton-shimmer" style={{ width: "100%", height, borderRadius: 0 }} />
      <div className="card-body" style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="skeleton-shimmer" style={{ width: 84, height: 22, borderRadius: 999 }} />
          <div className="skeleton-shimmer" style={{ width: 44, height: 22, borderRadius: 8 }} />
        </div>
        <div className="skeleton-shimmer" style={{ width: "78%", height: 18 }} />
        <div className="skeleton-shimmer" style={{ width: "54%", height: 14 }} />
        <div style={{ display: "flex", gap: 6 }}>
          <div className="skeleton-shimmer" style={{ width: 62, height: 20, borderRadius: 999 }} />
          <div className="skeleton-shimmer" style={{ width: 68, height: 20, borderRadius: 999 }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid var(--border)" }}>
          <div className="skeleton-shimmer" style={{ width: 92, height: 24 }} />
          <div className="skeleton-shimmer" style={{ width: 94, height: 32, borderRadius: 999 }} />
        </div>
      </div>
    </div>
  );
}

export function HomePageSkeleton() {
  return (
    <div className="container" style={{ paddingTop: 16, paddingBottom: 36, display: "grid", gap: 24 }}>
      <div className="skeleton-shimmer" style={{ width: "100%", height: 285, borderRadius: 20 }} />

      <div style={{ display: "flex", gap: 10, overflow: "hidden" }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton-shimmer" style={{ width: 112, height: 34, borderRadius: 999, flexShrink: 0 }} />
        ))}
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <div className="skeleton-shimmer" style={{ width: 220, height: 26 }} />
        <div className="grid-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-shimmer" style={{ width: "100%", height: 150, borderRadius: 16 }} />
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <div className="skeleton-shimmer" style={{ width: 260, height: 26 }} />
        <div style={{ display: "flex", gap: 8, overflow: "hidden" }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton-shimmer" style={{ width: 118, height: 34, borderRadius: 999, flexShrink: 0 }} />
          ))}
        </div>
      </div>

      <div className="grid-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <CardTrace key={i} />
        ))}
      </div>
    </div>
  );
}

export function SearchPageSkeleton() {
  return (
    <div className="container" style={{ paddingTop: 22, paddingBottom: 44, display: "grid", gap: 14 }}>
      <div className="card card-body" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "grid", gap: 8 }}>
          <div className="skeleton-shimmer" style={{ width: 210, height: 26 }} />
          <div className="skeleton-shimmer" style={{ width: 120, height: 16 }} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div className="skeleton-shimmer" style={{ width: 140, height: 36, borderRadius: 10 }} />
          <div className="skeleton-shimmer" style={{ width: 180, height: 36, borderRadius: 10 }} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, overflow: "hidden" }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton-shimmer" style={{ width: 105, height: 32, borderRadius: 999, flexShrink: 0 }} />
        ))}
      </div>

      <div className="search-split-layout">
        <div className="search-split-cards">
          {[1, 2, 3, 4].map((i) => (
            <CardTrace key={i} height={170} />
          ))}
        </div>
        <div className="skeleton-shimmer" style={{ height: 520, borderRadius: 16 }} />
      </div>
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 44, display: "grid", gap: 18 }}>
      <div className="skeleton-shimmer" style={{ width: 220, height: 18 }} />
      <div className="skeleton-shimmer" style={{ width: "55%", height: 34 }} />
      <div className="skeleton-shimmer" style={{ width: "100%", height: 340, borderRadius: 18 }} />
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.7fr) minmax(0, 1fr)", gap: 20 }}>
        <div className="card card-body" style={{ display: "grid", gap: 12 }}>
          <div className="skeleton-shimmer" style={{ width: "45%", height: 24 }} />
          <div className="skeleton-shimmer" style={{ width: "100%", height: 16 }} />
          <div className="skeleton-shimmer" style={{ width: "92%", height: 16 }} />
          <div className="skeleton-shimmer" style={{ width: "75%", height: 16 }} />
          <div className="skeleton-shimmer" style={{ width: "100%", height: 120 }} />
        </div>
        <div className="card card-body" style={{ display: "grid", gap: 12, alignContent: "start" }}>
          <div className="skeleton-shimmer" style={{ width: "60%", height: 28 }} />
          <div className="skeleton-shimmer" style={{ width: "100%", height: 42 }} />
          <div className="skeleton-shimmer" style={{ width: "100%", height: 42 }} />
          <div className="skeleton-shimmer" style={{ width: "100%", height: 44, borderRadius: 12 }} />
        </div>
      </div>
    </div>
  );
}

export function WorkspacePageSkeleton() {
  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 44, display: "grid", gap: 18 }}>
      <div className="card card-body" style={{ display: "grid", gap: 10 }}>
        <div className="skeleton-shimmer" style={{ width: 260, height: 28 }} />
        <div className="skeleton-shimmer" style={{ width: "62%", height: 16 }} />
      </div>
      <div style={{ display: "flex", gap: 8, overflow: "hidden" }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-shimmer" style={{ width: 130, height: 36, borderRadius: 999, flexShrink: 0 }} />
        ))}
      </div>
      <div className="grid-2" style={{ gap: 18 }}>
        <div className="card card-body" style={{ display: "grid", gap: 12 }}>
          <div className="skeleton-shimmer" style={{ width: "50%", height: 22 }} />
          <div className="skeleton-shimmer" style={{ width: "100%", height: 40 }} />
          <div className="skeleton-shimmer" style={{ width: "100%", height: 40 }} />
          <div className="skeleton-shimmer" style={{ width: "100%", height: 96 }} />
        </div>
        <div className="card card-body" style={{ display: "grid", gap: 12 }}>
          <div className="skeleton-shimmer" style={{ width: "45%", height: 22 }} />
          <div className="skeleton-shimmer" style={{ width: "100%", height: 76 }} />
          <div className="skeleton-shimmer" style={{ width: "100%", height: 76 }} />
          <div className="skeleton-shimmer" style={{ width: "100%", height: 76 }} />
        </div>
      </div>
    </div>
  );
}
