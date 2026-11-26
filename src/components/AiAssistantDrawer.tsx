"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Send, X, ArrowRight, Calendar } from "lucide-react";
import { useApp } from "./AppProvider";
import { tCity, tUnit } from "@/lib/i18n";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  recommendations?: Array<{
    id: number;
    slug: string;
    title: string;
    city: string;
    category: string;
    rating: number;
    formatted_price: string;
    formatted_quote?: string;
    available: boolean;
    image_url: string;
  }>;
  itinerary?: Array<{ day: number; city: string; activity: string; staySuggestion?: string }>;
}

export function AiAssistantDrawer() {
  const { aiOpen, setAiOpen, lang, currency, tr } = useApp();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!aiOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAiOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aiOpen, setAiOpen]);

  const welcomeMsg: ChatMessage = { role: "assistant", text: tr("aiWelcome") };
  const displayMessages = messages.length > 0 ? messages : [welcomeMsg];

  async function sendQuery(queryText?: string) {
    const q = (queryText ?? input).trim();
    if (!q || loading) return;
    if (!queryText) setInput("");
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setLoading(true);
    try {
      const res = await fetch("/api/v1/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, lang, currency }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.reply || "No response",
          recommendations: data.recommendations || [],
          itinerary: data.itinerary || [],
        },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Unable to reach assistant right now." }]);
    } finally {
      setLoading(false);
    }
  }

  if (!aiOpen) return null;

  return (
    <div className="ai-drawer" role="dialog" aria-label="MARHABA AI Travel Assistant">
          <div
            style={{
              background: "linear-gradient(135deg, var(--primary), var(--navy))",
              color: "#fff",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src="/brand/emblem-only-dark.png" alt="MARHABA" style={{ height: 22, width: "auto" }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{tr("ai.title")}</div>
                <div style={{ fontSize: "0.72rem", opacity: 0.85 }}>{tr("aiLiveDbBadge")}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAiOpen(false)}
              style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer" }}
              aria-label={tr("closeBtn")}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", display: "flex", gap: 6, flexWrap: "wrap", background: "var(--surface-muted)" }}>
            <button type="button" className="btn btn-sm btn-outline" onClick={() => sendQuery("3-day itinerary in Marrakech under 3000 MAD")}>
              {tr("aiQuick1")}
            </button>
            <button type="button" className="btn btn-sm btn-outline" onClick={() => sendQuery("Compare riads in Fes and Chefchaouen")}>
              {tr("aiQuick2")}
            </button>
            <button type="button" className="btn btn-sm btn-outline" onClick={() => sendQuery("Active promo codes")}>
              {tr("aiQuick3")}
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "grid", gap: 12 }}>
            {displayMessages.map((m, idx) => (
              <div key={idx} style={{ justifySelf: m.role === "user" ? "end" : "start", maxWidth: "92%" }}>
                <div
                  style={{
                    padding: "10px 13px",
                    borderRadius: 12,
                    fontSize: "0.88rem",
                    background: m.role === "user" ? "var(--primary)" : "var(--surface-muted)",
                    color: m.role === "user" ? "#fff" : "var(--text)",
                  }}
                >
                  {m.text}
                </div>

                {m.itinerary && m.itinerary.length > 0 && (
                  <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                    {m.itinerary.map((step) => (
                      <div key={step.day} style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", fontSize: "0.8rem" }}>
                        <strong>
                          <Calendar size={12} style={{ verticalAlign: "middle" }} /> {tr("dayLabel")} {step.day} ({tCity(lang, step.city)}):
                        </strong>{" "}
                        {step.activity}
                        {step.staySuggestion && <div style={{ color: "var(--text-muted)" }}>{step.staySuggestion}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {m.recommendations && m.recommendations.length > 0 && (
                  <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                    {m.recommendations.slice(0, 4).map((r) => (
                      <Link
                        key={r.id}
                        href={`/properties/${r.slug}`}
                        onClick={() => setAiOpen(false)}
                        style={{
                          display: "flex",
                          gap: 10,
                          alignItems: "center",
                          padding: 8,
                          borderRadius: 10,
                          border: "1px solid var(--border)",
                          background: "var(--surface)",
                          color: "var(--text)",
                        }}
                      >
                        <img src={r.image_url} alt={r.title} style={{ width: 54, height: 42, objectFit: "cover", borderRadius: 7 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: "0.82rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {r.title}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {tCity(lang, r.city)} · ★{r.rating} · {r.formatted_price}/{tUnit(lang, "night")}
                          </div>
                        </div>
                        <ArrowRight size={14} />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{tr("aiSearching")}</div>}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendQuery();
            }}
            style={{ padding: 10, borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}
          >
            <input
              className="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={tr("ai.placeholder")}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
              <Send size={15} />
            </button>
          </form>
    </div>
  );
}
