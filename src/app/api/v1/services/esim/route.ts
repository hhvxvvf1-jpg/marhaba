import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { getCurrentUser, isAdminRole, logAudit } from "@/lib/auth";
import { checkRateLimit, getClientIp, sanitizeString } from "@/lib/security";
import {
  ESIM_PACKAGES,
  MOROCCO_COVERAGE_ZONES,
  TELECOM_OPERATORS,
} from "@/lib/services-catalog";

const EsimSchema = z.object({
  packageCode: z.string(),
  customerEmail: z.string().email(),
  deviceUnlockedConfirmed: z
    .boolean()
    .refine((v) => v === true, "Unlocked eSIM-compatible device confirmation is required."),
  preferredOperator: z.enum(["auto", "iam", "orange", "inwi"]).optional().default("auto"),
  arrivalDate: z.string().max(20).optional().default(""),
  deviceModel: z.string().max(80).optional().default(""),
});

export async function GET() {
  ensureSeeded();
  const user = await getCurrentUser();
  const db = getDb();
  const requests = user
    ? isAdminRole(user.role)
      ? db.prepare(`SELECT * FROM esim_requests ORDER BY created_at DESC LIMIT 100`).all()
      : db.prepare(`SELECT * FROM esim_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`).all(user.id)
    : [];

  return NextResponse.json({
    packages: ESIM_PACKAGES,
    operators: TELECOM_OPERATORS,
    coverageZones: MOROCCO_COVERAGE_ZONES,
    requests,
  });
}

export async function POST(req: Request) {
  ensureSeeded();
  const ip = getClientIp(req);
  if (!checkRateLimit(`esim:${ip}`, 15, 60_000)) {
    return NextResponse.json({ error: "Too many eSIM requests. Please wait a minute." }, { status: 429 });
  }
  const user = await getCurrentUser();
  const body = await req.json();
  const parsed = EsimSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Valid email, package, and unlocked-device confirmation required." }, { status: 400 });
  }

  const pkg = ESIM_PACKAGES.find((p) => p.code === parsed.data.packageCode);
  if (!pkg) return NextResponse.json({ error: "Invalid eSIM package selected." }, { status: 400 });

  const resolvedOpId =
    parsed.data.preferredOperator === "auto" ? pkg.bestOperator : parsed.data.preferredOperator;
  const operator = TELECOM_OPERATORS.find((op) => op.id === resolvedOpId) || TELECOM_OPERATORS[0];

  const db = getDb();
  const ref = `SIM-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const smdpAddress = "smdp.marhaba.ma";
  const activationCode = `MARHABA-${ref}-${pkg.code}`;
  const qrPayload = `LPA:1$${smdpAddress}$${activationCode}`;

  const res = db
    .prepare(
      `INSERT INTO esim_requests (
        request_ref, user_id, package_code, data_gb, duration_days, price_mad,
        customer_email, device_unlocked_confirmed, qr_payload, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, 'pending_provider')`
    )
    .run(
      ref,
      user?.id ?? null,
      pkg.code,
      pkg.dataGb,
      pkg.durationDays,
      pkg.priceMad,
      sanitizeString(parsed.data.customerEmail.toLowerCase(), 120),
      qrPayload
    );

  logAudit(user?.id ?? null, "service.esim_requested", "esim_request", Number(res.lastInsertRowid), {
    ref,
    packageCode: pkg.code,
    operator: operator.id,
    arrivalDate: sanitizeString(parsed.data.arrivalDate, 20),
    deviceModel: sanitizeString(parsed.data.deviceModel, 80),
  });

  return NextResponse.json(
    {
      id: Number(res.lastInsertRowid),
      requestRef: ref,
      package: pkg,
      operator,
      smdpAddress,
      activationCode,
      qrPayload,
      arrivalDate: sanitizeString(parsed.data.arrivalDate, 20) || null,
      deviceModel: sanitizeString(parsed.data.deviceModel, 80) || null,
      status: "pending_provider",
      note: "eSIM order request registered (pending_provider). Live carrier QR provisioning requires connecting an approved eSIM API provider (e.g. Airalo / eSIM Access).",
    },
    { status: 201 }
  );
}
