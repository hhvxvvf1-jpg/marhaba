import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

export default function TermsLegalPage() {
  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 56, maxWidth: 860 }}>
      <div className="card card-body brand-zellige" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 20 }}>
        <div>
          <span className="badge badge-warning">Prepared for Legal Review (Beta Terms)</span>
          <h1 style={{ margin: "10px 0 6px", fontSize: "1.6rem" }}>Terms of Service & Marketplace Intermediary Rules</h1>
          <p style={{ color: "var(--text-muted)", margin: 0 }}>
            MARHABA acts as a travel discovery and intermediary booking platform connecting travelers with independent Moroccan hospitality, car rental, dining, and tour providers.
          </p>
        </div>
        <BrandLogo size="md" showArabic={false} />
      </div>

      <div className="card card-body" style={{ display: "grid", gap: 16 }}>
        <section>
          <h3>1. Public Beta & Sandbox Payments</h3>
          <p style={{ color: "var(--text-muted)", margin: 0 }}>
            During Public Beta, listings include seeded demonstration records and payment checkout operates in Sandbox mode. No real monetary charges are processed unless live merchant gateways are explicitly enabled.
          </p>
        </section>

        <section>
          <h3>2. Provider Confirmation & Multi-Service Trips</h3>
          <p style={{ color: "var(--text-muted)", margin: 0 }}>
            External travel inquiries (flights, ONCF/CTM transport, eSIM) and multi-service trip plans retain separate provider confirmation statuses. A suggested itinerary or pending request is not a confirmed reservation until validated by the respective provider.
          </p>
        </section>

        <section>
          <h3>3. Cancellations & Refunds</h3>
          <p style={{ color: "var(--text-muted)", margin: 0 }}>
            Cancellation eligibility and deposit terms depend on the policy displayed on each listing prior to confirmation.
          </p>
        </section>

        <div style={{ display: "flex", gap: 10, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
          <Link href="/legal/privacy" className="btn btn-sm btn-outline">Read Privacy Policy</Link>
          <Link href="/feedback" className="btn btn-sm btn-outline">Contact Beta Team</Link>
        </div>
      </div>
    </div>
  );
}
