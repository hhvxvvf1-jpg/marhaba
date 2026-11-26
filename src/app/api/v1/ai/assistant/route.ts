import { NextResponse } from "next/server";
import { runAssistantQuery } from "@/lib/ai-assistant";
import { checkRateLimit, getClientIp } from "@/lib/security";
import type { Currency } from "@/lib/config";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`ai:${ip}`, 40, 60_000)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
  try {
    const body = await req.json();
    const message = String(body.message || "").trim();
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }
    const result = runAssistantQuery({
      message,
      lang: body.lang,
      currency: (body.currency as Currency) || "MAD",
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      guests: body.guests ? Number(body.guests) : undefined,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("AI assistant error:", err);
    return NextResponse.json({ error: "Assistant failed" }, { status: 500 });
  }
}
