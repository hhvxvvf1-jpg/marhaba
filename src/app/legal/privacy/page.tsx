import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

export default function PrivacyLegalPage() {
  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 56, maxWidth: 860 }}>
      <div className="card card-body brand-zellige" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 20 }}>
        <div>
          <span className="badge badge-warning">Prepared for Legal Review (Beta Policy)</span>
          <h1 style={{ margin: "10px 0 6px", fontSize: "1.6rem" }}>Privacy Notice & Data Protection Policy</h1>
          <p style={{ color: "var(--text-muted)", margin: 0 }}>
            MARHABA Travel Marketplace — Draft privacy policy prepared in alignment with Moroccan Law No. 09-08 (CNDP) and EU GDPR principles, pending formal legal counsel review prior to commercial launch.
          </p>
        </div>
        <BrandLogo size="md" showArabic={false} />
      </div>

      <div className="card card-body" style={{ display: "grid", gap: 16 }}>
        <section>
          <h3>1. Data We Collect</h3>
          <p style={{ color: "var(--text-muted)", margin: 0 }}>
            Account registration fields (name, email, optional phone), booking request details, travel service inquiries (flights, transport, eSIM), in-app messages, and optional beta feedback. We never store raw payment card numbers.
          </p>
        </section>

        <section>
          <h3>2. Purpose & Security</h3>
          <p style={{ color: "var(--text-muted)", margin: 0 }}>
            Data is processed strictly to coordinate reservation requests between travelers and listed service providers, prevent double bookings, maintain financial audit logs, and secure sessions via scrypt password hashing and HTTP-only HMAC cookies.
          </p>
        </section>

        <section>
          <h3>3. Your Rights (Access, Correction & Deletion)</h3>
          <p style={{ color: "var(--text-muted)", margin: 0 }}>
            Registered users can view, update, or anonymize/delete their personal account data directly inside My Account → Profile & Privacy.
          </p>
        </section>

        <div style={{ display: "flex", gap: 10, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
          <Link href="/legal/terms" className="btn btn-sm btn-outline">Read Terms of Service</Link>
          <Link href="/feedback" className="btn btn-sm btn-outline">Contact Beta Team</Link>
        </div>
      </div>
    </div>
  );
}
