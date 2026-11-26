import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { getPaymentProviderStatus } from "@/lib/config";
import { getIntegrationReadiness } from "@/lib/providers";

export async function GET() {
  try {
    ensureSeeded();
    const db = getDb();
    const listings = (db.prepare(`SELECT COUNT(*) AS cnt FROM properties WHERE status = 'active'`).get() as { cnt: number }).cnt;
    const destinations = (db.prepare(`SELECT COUNT(*) AS cnt FROM destinations`).get() as { cnt: number }).cnt;
    const providers = getPaymentProviderStatus();
    const integrations = getIntegrationReadiness();

    return NextResponse.json({
      status: "ok",
      service: "marhaba-v14",
      environment: process.env.NODE_ENV || "development",
      betaMode: integrations.liveCount === 0,
      database: "connected",
      activeListings: listings,
      destinations,
      paymentSandboxActive: providers.sandbox_card.mode === "sandbox",
      integrations: {
        liveCount: integrations.liveCount,
        sandboxCount: integrations.sandboxCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ status: "error", database: "unavailable" }, { status: 500 });
  }
}
