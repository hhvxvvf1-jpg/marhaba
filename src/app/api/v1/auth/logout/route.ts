import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revokeSession, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token =
    cookieStore.get(SESSION_COOKIE_NAME)?.value ||
    req.headers.get("x-marhaba-session")?.trim() ||
    (req.headers.get("authorization")?.toLowerCase().startsWith("bearer ")
      ? req.headers.get("authorization")!.slice(7).trim()
      : undefined);
  if (token) {
    revokeSession(token);
  }
  const origin = req.headers.get("origin") || "";
  const referer = req.headers.get("referer") || "";
  const isHttps =
    req.headers.get("x-forwarded-proto") === "https" ||
    req.url.startsWith("https://") ||
    origin.startsWith("https://") ||
    referer.startsWith("https://");
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: isHttps ? "none" : "lax",
    secure: isHttps,
    path: "/",
    expires: new Date(0),
  });
  return response;
}
