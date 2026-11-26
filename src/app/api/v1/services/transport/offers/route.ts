import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { checkRateLimit, getClientIp } from "@/lib/security";
import {
  queryActiveTransportOffers,
  runLiveOfferWatchdog,
  type OfferCarrierType,
} from "@/lib/transport-offers";

export async function GET(req: Request) {
  ensureSeeded();
  const { searchParams } = new URL(req.url);
  const origin = searchParams.get("origin") || "Casablanca";
  const destination = searchParams.get("destination") || "Marrakech";
  const mode = searchParams.get("mode") === "intracity" ? "intracity" : "intercity";
  const carrier = (searchParams.get("carrier") || "all") as "all" | OfferCarrierType;
  const vtRaw = searchParams.get("vehicleType") || "all";
  const vehicleType = (vtRaw === "bus" || vtRaw === "train" || vtRaw === "tram" ? vtRaw : "all") as
    | "all"
    | "bus"
    | "train"
    | "tram";
  const brandFilter = (searchParams.get("brand") || "all").trim();

  const db = getDb();
  const result = queryActiveTransportOffers(db, {
    originCity: origin,
    destCity: destination,
    mode,
    carrierFilter: carrier,
    vehicleType,
    brandFilter,
  });

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  ensureSeeded();
  const ip = getClientIp(req);
  if (!checkRateLimit(`watchdog:${ip}`, 12, 60_000)) {
    return NextResponse.json({ error: "Watchdog cooldown active. Try again shortly." }, { status: 429 });
  }
  const db = getDb();
  const report = await runLiveOfferWatchdog(db);
  return NextResponse.json(report);
}
