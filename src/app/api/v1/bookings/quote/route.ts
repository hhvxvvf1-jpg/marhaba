import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureSeeded } from "@/db/seed";
import { getCurrentUser } from "@/lib/auth";
import { calculateQuote } from "@/lib/booking-engine";

const QuoteSchema = z.object({
  propertyId: z.number().int().positive(),
  roomTypeId: z.number().int().positive(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  adults: z.number().int().min(1).max(20).optional().default(2),
  children: z.number().int().min(0).max(20).optional().default(0),
  units: z.number().int().min(1).max(10).optional().default(1),
  promoCode: z.string().max(40).optional(),
  currency: z.enum(["MAD", "EUR", "USD"]).optional().default("MAD"),
  guestEmail: z.string().email().optional(),
});

export async function POST(req: Request) {
  ensureSeeded();
  const user = await getCurrentUser();
  try {
    const body = await req.json();
    const parsed = QuoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid quote parameters", details: parsed.error.flatten() }, { status: 400 });
    }
    const quote = calculateQuote({
      ...parsed.data,
      travelerId: user?.id ?? null,
      guestEmail: parsed.data.guestEmail || user?.email,
    });
    return NextResponse.json({ quote });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
