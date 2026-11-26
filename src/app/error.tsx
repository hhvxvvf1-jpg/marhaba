"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, Home } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const msg = String(error?.message || "");
    const isChunkErr =
      msg.includes("ChunkLoadError") ||
      msg.includes("Loading chunk") ||
      msg.includes("Failed to fetch dynamically imported module");
    if (isChunkErr && typeof window !== "undefined") {
      const key = "marhaba_chunk_reload";
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <div className="container" style={{ paddingTop: 48, paddingBottom: 64 }}>
      <div className="card card-body" style={{ maxWidth: 520, marginInline: "auto", textAlign: "center", display: "grid", gap: 14 }}>
        <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800 }}>MARHABA</h2>
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.92rem" }}>
          Something interrupted loading this view. Refresh to restore the latest page.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              if (typeof window !== "undefined") {
                sessionStorage.removeItem("marhaba_chunk_reload");
                window.location.reload();
              } else {
                reset();
              }
            }}
          >
            <RefreshCw size={15} /> Reload
          </button>
          <Link href="/" className="btn btn-outline">
            <Home size={15} /> Home
          </Link>
        </div>
      </div>
    </div>
  );
}
