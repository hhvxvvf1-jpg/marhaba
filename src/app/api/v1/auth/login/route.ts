import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { createSession, logAudit, SESSION_COOKIE_NAME, verifyPassword } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/security";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  ensureSeeded();
  const ip = getClientIp(req);
  if (!checkRateLimit(`login:${ip}`, 25, 60_000)) {
    return NextResponse.json({ error: "Too many login attempts. Try again in a minute." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Valid email and password are required." }, { status: 400 });
    }

    const db = getDb();
    const user = db
      .prepare(`SELECT * FROM users WHERE email = ?`)
      .get(parsed.data.email.trim().toLowerCase()) as
      | {
          id: number;
          email: string;
          password_hash: string;
          full_name: string;
          phone: string;
          role: string;
          status: string;
          preferred_lang: string;
          preferred_currency: string;
          loyalty_points: number;
          referral_code: string | null;
        }
      | undefined;

    if (!user || !verifyPassword(parsed.data.password, user.password_hash)) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    if (user.status !== "active") {
      return NextResponse.json({ error: `Account is currently ${user.status}. Contact support.` }, { status: 403 });
    }

    const session = createSession(user.id, ip, req.headers.get("user-agent") || "");
    logAudit(user.id, "user.login", "user", user.id, { role: user.role }, ip);

    const response = NextResponse.json({
      sessionToken: session.token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        role: user.role,
        preferred_lang: user.preferred_lang,
        preferred_currency: user.preferred_currency,
        loyalty_points: user.loyalty_points,
        referral_code: user.referral_code,
      },
    });

    const origin = req.headers.get("origin") || "";
    const referer = req.headers.get("referer") || "";
    const isHttps =
      req.headers.get("x-forwarded-proto") === "https" ||
      req.url.startsWith("https://") ||
      origin.startsWith("https://") ||
      referer.startsWith("https://");
    response.cookies.set(SESSION_COOKIE_NAME, session.token, {
      httpOnly: true,
      sameSite: isHttps ? "none" : "lax",
      secure: isHttps,
      path: "/",
      expires: new Date(session.expiresAt),
    });

    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Authentication failed." }, { status: 500 });
  }
}
