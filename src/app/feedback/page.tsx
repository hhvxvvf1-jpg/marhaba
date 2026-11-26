"use client";

import React, { useEffect, useState } from "react";
import { Bug, CheckCircle2, MessageSquarePlus } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { BrandLogo } from "@/components/BrandLogo";
import { BrandSelect } from "@/components/BrandSelect";

export default function FeedbackPage() {
  const { lang, tr } = useApp();
  const isAr = lang === "ar";
  const isFr = lang === "fr";
  const [category, setCategory] = useState("bug");
  const [severity, setSeverity] = useState("medium");
  const [pageUrl, setPageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ feedbackRef?: string; message?: string; error?: string } | null>(null);

  useEffect(() => {
    if (typeof document !== "undefined" && document.referrer) {
      setPageUrl(document.referrer);
    }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    const res = await fetch("/api/v1/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category,
        severity,
        pageUrl,
        locale: lang,
        description,
      }),
    });
    const data = await res.json();
    setResult(res.ok ? data : { error: data.error || "Failed to submit feedback." });
    if (res.ok) setDescription("");
    setBusy(false);
  };

  return (
    <div className="container" style={{ paddingTop: 28, paddingBottom: 48, maxWidth: 720 }}>
      <div className="card card-body brand-zellige" style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
        <div>
          <span className="badge badge-gold">MARHABA Public Beta</span>
          <h1 style={{ margin: "8px 0 4px", display: "flex", alignItems: "center", gap: 10, fontSize: "1.5rem" }}>
            <MessageSquarePlus size={24} /> {tr("feedbackTitle")}
          </h1>
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.9rem" }}>{tr("feedbackSubtitle")}</p>
        </div>
        <BrandLogo size="sm" showArabic={false} />
      </div>

      <form onSubmit={submit} className="card card-body" style={{ display: "grid", gap: 14 }}>
        <div className="grid-2">
          <div>
            <label className="field-label">{isAr ? "الفئة" : isFr ? "Catégorie" : "Category"}</label>
            <BrandSelect
              value={category}
              ariaLabel="Feedback Category"
              onChange={setCategory}
              options={[
                { value: "bug", label: isAr ? "خطأ تقني / عطل" : isFr ? "Bug / Erreur technique" : "Bug / Technical Error" },
                { value: "design", label: isAr ? "مشكلة في التصميم" : isFr ? "Design / Mise en page" : "Design / Layout Issue" },
                { value: "confusing", label: isAr ? "واجهة غير واضحة" : isFr ? "Expérience peu claire" : "Confusing Feature / UX" },
                { value: "missing", label: isAr ? "ميزة ناقصة" : isFr ? "Fonctionnalité manquante" : "Missing Functionality" },
                { value: "slow", label: isAr ? "بطء الأداء" : isFr ? "Performance lente" : "Slow Page / Performance" },
                { value: "booking", label: isAr ? "مسار الحجز والدفع" : isFr ? "Parcours réservation / paiement" : "Booking / Payment Flow" },
                { value: "language", label: isAr ? "مشكلة ترجمة أو RTL" : isFr ? "Traduction / Alignement RTL" : "Translation / RTL Issue" },
                { value: "suggestion", label: isAr ? "اقتراح عام" : isFr ? "Suggestion générale" : "General Suggestion" },
              ]}
            />
          </div>
          <div>
            <label className="field-label">{isAr ? "الأهمية" : isFr ? "Gravité" : "Severity"}</label>
            <BrandSelect
              value={severity}
              ariaLabel="Feedback Severity"
              onChange={setSeverity}
              options={[
                { value: "low", label: isAr ? "منخفضة (تحسين بسيط)" : isFr ? "Faible (Détail)" : "Low (Minor polish)" },
                { value: "medium", label: isAr ? "متوسطة" : isFr ? "Moyenne" : "Medium (Affects usability)" },
                { value: "high", label: isAr ? "عالية (تعطل سير العمل)" : isFr ? "Élevée (Bloque un flux)" : "High (Blocks a workflow)" },
                { value: "critical", label: isAr ? "حرجة" : isFr ? "Critique" : "Critical (Crash / Security / Data)" },
              ]}
            />
          </div>
        </div>

        <div>
          <label className="field-label">{isAr ? "رابط الصفحة أو الميزة (اختياري)" : isFr ? "URL de la page (optionnel)" : "Page URL or Feature Name (optional)"}</label>
          <input className="input" placeholder="e.g. /search, /services?tab=esim, /planner" value={pageUrl} onChange={(e) => setPageUrl(e.target.value)} />
        </div>

        <div>
          <label className="field-label">{isAr ? "التفاصيل" : isFr ? "Détails" : "Details (steps to reproduce, expected vs actual)"}</label>
          <textarea
            className="textarea"
            rows={5}
            required
            minLength={10}
            placeholder={isAr ? "اشرح ما حدث بالتفصيل..." : isFr ? "Décrivez ce qui s’est passé..." : "Describe what happened..."}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={busy}>
          <Bug size={16} />
          <span>{busy ? tr("feedbackSubmitting") : tr("feedbackSubmitBtn")}</span>
        </button>

        {result?.error && <div className="badge badge-danger">{result.error}</div>}
        {result?.feedbackRef && (
          <div style={{ padding: 12, borderRadius: 10, background: "var(--success-bg)" }}>
            <strong style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <CheckCircle2 size={16} /> {isAr ? "تم التسجيل برقم:" : isFr ? "Enregistré sous :" : "Recorded as"} {result.feedbackRef}
            </strong>
            <p style={{ margin: "4px 0 0", fontSize: "0.86rem" }}>{result.message}</p>
          </div>
        )}
      </form>
    </div>
  );
}
