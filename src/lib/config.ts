import crypto from "crypto";
import fs from "fs";
import path from "path";
export * from "./currency";

export function getSessionSecret(): string {
  if (process.env.MARHABA_SESSION_SECRET && process.env.MARHABA_SESSION_SECRET.length >= 32) {
    return process.env.MARHABA_SESSION_SECRET;
  }
  const secretPath = path.join(process.cwd(), "data", ".session-secret");
  try {
    if (fs.existsSync(secretPath)) {
      return fs.readFileSync(secretPath, "utf8").trim();
    }
    fs.mkdirSync(path.dirname(secretPath), { recursive: true });
    const generated = crypto.randomBytes(48).toString("hex");
    fs.writeFileSync(secretPath, generated, { mode: 0o600 });
    return generated;
  } catch {
    // Ephemeral fallback for read-only environments
    return crypto.createHash("sha256").update(process.cwd() + "-marhaba-dev").digest("hex");
  }
}

export function getPaymentProviderStatus() {
  return {
    stripe: {
      configured: Boolean(process.env.STRIPE_SECRET_KEY),
      mode: process.env.STRIPE_SECRET_KEY ? "live_or_keyed" : "sandbox_simulation",
    },
    paypal: {
      configured: Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
      mode: process.env.PAYPAL_CLIENT_ID ? "live_or_keyed" : "sandbox_simulation",
    },
    cmi: {
      configured: Boolean(process.env.CMI_MERCHANT_ID && process.env.CMI_STORE_KEY),
      mode: process.env.CMI_MERCHANT_ID ? "live_or_keyed" : "integration_ready",
      note: "Centre Monétique Interbancaire (Morocco) requires merchant credentials and HMAC store key.",
    },
    sandbox_card: {
      configured: true,
      mode: "sandbox",
    },
    pay_at_property: {
      configured: true,
      mode: "active",
    },
  };
}
