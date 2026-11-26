export interface IntegrationItem {
  id: string;
  name: string;
  category: "payment" | "messaging" | "mobility" | "infrastructure";
  mode: "live" | "sandbox";
  envKeys: string[];
  description: string;
}

export function getIntegrationReadiness(): {
  liveCount: number;
  sandboxCount: number;
  items: IntegrationItem[];
} {
  const hasAll = (keys: string[]) => keys.every((k) => Boolean(process.env[k]?.trim()));

  const items: IntegrationItem[] = [
    {
      id: "cmi",
      name: "CMI (Maroc Telecommerce)",
      category: "payment",
      mode: hasAll(["CMI_MERCHANT_ID", "CMI_STORE_KEY"]) ? "live" : "sandbox",
      envKeys: ["CMI_MERCHANT_ID", "CMI_STORE_KEY"],
      description: "Moroccan MAD bank card checkout & 3D-Secure callback",
    },
    {
      id: "stripe",
      name: "Stripe International Cards",
      category: "payment",
      mode: hasAll(["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"]) ? "live" : "sandbox",
      envKeys: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
      description: "EUR / USD / Apple Pay international checkout",
    },
    {
      id: "email",
      name: "Transactional Email (Resend / SMTP)",
      category: "messaging",
      mode: hasAll(["RESEND_API_KEY"]) ? "live" : "sandbox",
      envKeys: ["RESEND_API_KEY"],
      description: "Booking receipts, QR eSIM delivery & partner alerts",
    },
    {
      id: "whatsapp",
      name: "WhatsApp / SMS OTP",
      category: "messaging",
      mode: hasAll(["WHATSAPP_CLOUD_API_TOKEN"]) ? "live" : "sandbox",
      envKeys: ["WHATSAPP_CLOUD_API_TOKEN"],
      description: "Instant boarding pass & phone verification",
    },
    {
      id: "esim",
      name: "eSIM Access / Airalo Partner API",
      category: "mobility",
      mode: hasAll(["ESIM_PROVIDER_API_KEY"]) ? "live" : "sandbox",
      envKeys: ["ESIM_PROVIDER_API_KEY"],
      description: "Live SM-DP+ LPA provisioning for IAM / Orange / inwi",
    },
    {
      id: "flights_gds",
      name: "Amadeus / Duffel Flight GDS",
      category: "mobility",
      mode: hasAll(["FLIGHT_GDS_API_KEY"]) ? "live" : "sandbox",
      envKeys: ["FLIGHT_GDS_API_KEY"],
      description: "Live fare search & PNR ticketing for RAM / Air Arabia",
    },
    {
      id: "postgres",
      name: "PostgreSQL Production Database",
      category: "infrastructure",
      mode: hasAll(["DATABASE_URL"]) ? "live" : "sandbox",
      envKeys: ["DATABASE_URL"],
      description: "Managed multi-instance database (currently SQLite WAL)",
    },
    {
      id: "storage",
      name: "Cloudflare R2 / S3 Media",
      category: "infrastructure",
      mode: hasAll(["R2_BUCKET", "R2_ACCESS_KEY_ID"]) ? "live" : "sandbox",
      envKeys: ["R2_BUCKET", "R2_ACCESS_KEY_ID"],
      description: "Partner image uploads & CDN edge delivery",
    },
  ];

  const liveCount = items.filter((i) => i.mode === "live").length;
  return {
    liveCount,
    sandboxCount: items.length - liveCount,
    items,
  };
}

export function generateBookingIcs(booking: {
  bookingRef: string;
  title: string;
  city: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  guestName: string;
  status: string;
}): string {
  const fmtDate = (iso: string) => iso.replaceAll("-", "").slice(0, 8);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const esc = (s: string) => s.replace(/[\r\n]+/g, " ").replace(/([,;\\])/g, "\\$1");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MARHABA//Morocco Travel Marketplace//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${esc(booking.bookingRef)}@marhaba.ma`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${fmtDate(booking.checkIn)}`,
    `DTEND;VALUE=DATE:${fmtDate(booking.checkOut)}`,
    `SUMMARY:MARHABA — ${esc(booking.title)} (${esc(booking.bookingRef)})`,
    `LOCATION:${esc(booking.city)}, Morocco`,
    `DESCRIPTION:Guest: ${esc(booking.guestName)}\\nUnit: ${esc(booking.roomName)}\\nStatus: ${esc(booking.status)}\\nRef: ${esc(booking.bookingRef)}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
