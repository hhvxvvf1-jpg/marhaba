const rateBuckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, maxRequests = 60, windowMs = 60_000): boolean {
  const now = Date.now();
  if (rateBuckets.size > 5000) {
    for (const [k, v] of rateBuckets.entries()) {
      if (v.resetAt <= now) rateBuckets.delete(k);
    }
  }
  const entry = rateBuckets.get(key);
  if (!entry || entry.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) {
    return false;
  }
  entry.count += 1;
  return true;
}

export function sanitizeString(input: unknown, maxLen = 500): string {
  return String(input ?? "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLen);
}

export function sanitizePhone(input: unknown, maxLen = 32): string {
  return String(input ?? "")
    .replace(/[^\d+\s()-]/g, "")
    .trim()
    .slice(0, maxLen);
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  const prefix = local.slice(0, Math.min(2, local.length));
  return `${prefix}***@${domain}`;
}

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export function isSameOriginRequest(req: Request): boolean {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const targetUrl = origin || referer;
  if (!targetUrl) {
    // Non-browser API clients / curl / server-side tests without Origin header
    return true;
  }
  const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").split(",")[0].trim().toLowerCase();
  if (!host) return true;
  try {
    const parsed = new URL(targetUrl);
    return parsed.host.toLowerCase() === host;
  } catch {
    return false;
  }
}
