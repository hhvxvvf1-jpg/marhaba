import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { createSession, hashPassword, logAudit, SESSION_COOKIE_NAME } from "@/lib/auth";
import { checkRateLimit, getClientIp, sanitizeString } from "@/lib/security";

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  fullName: z.string().min(2).max(100),
  phone: z.string().max(40).optional().default(""),
  accountType: z.enum(["traveler", "partner", "affiliate"]).optional().default("traveler"),
  businessName: z.string().max(120).optional(),
  city: z.string().max(80).optional(),
  referralCode: z.string().max(40).optional(),
});

export async function POST(req: Request) {
  ensureSeeded();
  const ip = getClientIp(req);
  if (!checkRateLimit(`reg:${ip}`, 15, 60_000)) {
    return NextResponse.json({ error: "Too many registration attempts. Please try again later." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const db = getDb();
    const email = parsed.data.email.trim().toLowerCase();
    const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email);
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    let referredByUserId: number | null = null;
    if (parsed.data.referralCode) {
      const refUser = db
        .prepare(`SELECT id FROM users WHERE UPPER(referral_code) = ?`)
        .get(parsed.data.referralCode.trim().toUpperCase()) as { id: number } | undefined;
      if (refUser) referredByUserId = refUser.id;
    }

    const role =
      parsed.data.accountType === "partner"
        ? "partner_owner"
        : parsed.data.accountType === "affiliate"
        ? "affiliate"
        : "traveler";

    const myReferralCode = `MRH-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const passwordHash = hashPassword(parsed.data.password);

    const res = db
      .prepare(
        `INSERT INTO users (email, password_hash, full_name, phone, role, status, email_verified, referral_code, referred_by_user_id)
         VALUES (?, ?, ?, ?, ?, 'active', 0, ?, ?)`
      )
      .run(
        email,
        passwordHash,
        sanitizeString(parsed.data.fullName, 100),
        sanitizeString(parsed.data.phone, 40),
        role,
        myReferralCode,
        referredByUserId
      );

    const userId = Number(res.lastInsertRowid);

    if (role === "partner_owner") {
      db.prepare(
        `INSERT INTO partners (user_id, business_name, contact_email, contact_phone, city, verification_status)
         VALUES (?, ?, ?, ?, ?, 'pending')`
      ).run(
        userId,
        sanitizeString(parsed.data.businessName || `${parsed.data.fullName} Hospitality`, 120),
        email,
        sanitizeString(parsed.data.phone || "+212 600 00 00 00", 40),
        sanitizeString(parsed.data.city || "Marrakech", 80)
      );
    } else if (role === "affiliate") {
      db.prepare(
        `INSERT INTO affiliates (user_id, code, commission_pct, status)
         VALUES (?, ?, 5, 'pending')`
      ).run(userId, myReferralCode);
    }

    if (referredByUserId) {
      db.prepare(
        `INSERT INTO referrals (referrer_user_id, referred_email, referred_user_id, reward_mad, status)
         VALUES (?, ?, ?, 150, 'pending')`
      ).run(referredByUserId, email, userId);
    }

    db.prepare(
      `INSERT INTO notifications (user_id, type, title, body, link_url)
       VALUES (?, 'welcome', 'Welcome to MARHABA', 'Your account is active. Explore verified stays across Morocco.', '/account')`
    ).run(userId);

    const session = createSession(userId, ip, req.headers.get("user-agent") || "");
    logAudit(userId, "user.registered", "user", userId, { role }, ip);

    const response = NextResponse.json(
      {
        sessionToken: session.token,
        user: {
          id: userId,
          email,
          full_name: parsed.data.fullName,
          role,
          referral_code: myReferralCode,
        },
      },
      { status: 201 }
    );

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
    console.error("Register error:", err);
    return NextResponse.json({ error: "Failed to register user." }, { status: 500 });
  }
}
