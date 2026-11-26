import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit, getClientIp, isSameOriginRequest } from "@/lib/security";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const PRIVATE_API_PREFIXES = [
  "/api/v1/auth",
  "/api/v1/account",
  "/api/v1/bookings",
  "/api/v1/admin",
  "/api/v1/partner",
  "/api/v1/messages",
  "/api/v1/notifications",
  "/api/v1/wishlists",
];

function buildSecurityCsp(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://tiles.openfreemap.org https://server.arcgisonline.com https://images.unsplash.com",
    "connect-src 'self' https://tiles.openfreemap.org https://server.arcgisonline.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self' https://*.e2b.app https://arena.ai https://*.arena.ai",
  ].join("; ");
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/") && MUTATING_METHODS.has(req.method)) {
    if (!isSameOriginRequest(req)) {
      return NextResponse.json({ error: "Cross-origin request blocked by CSRF protection." }, { status: 403 });
    }
    const ip = getClientIp(req);
    if (!checkRateLimit(`api-mut:${ip}`, 90, 60_000)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
  }

  const res = NextResponse.next();
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-DNS-Prefetch-Control", "off");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self), payment=(self)");
  res.headers.set("Content-Security-Policy", buildSecurityCsp());

  if (PRIVATE_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    res.headers.set("Cache-Control", "no-store, private, max-age=0");
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js).*)"],
};
