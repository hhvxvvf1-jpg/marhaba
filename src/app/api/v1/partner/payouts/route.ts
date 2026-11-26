import { NextResponse } from "next/server";
import { getDb, runInTransaction } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { logAudit } from "@/lib/auth";
import { requirePartnerContext } from "@/lib/partner-helper";

export async function GET() {
  ensureSeeded();
  const ctx = await requirePartnerContext();
  if (ctx.error || !ctx.partner) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const db = getDb();
  const payouts = db
    .prepare(`SELECT * FROM payouts WHERE partner_id = ? ORDER BY created_at DESC`)
    .all(ctx.partner.id);
  const ledger = db
    .prepare(`SELECT * FROM ledger_entries WHERE partner_id = ? ORDER BY created_at DESC LIMIT 50`)
    .all(ctx.partner.id);

  const summary = db
    .prepare(
      `SELECT
        COALESCE(SUM(CASE WHEN entry_type = 'partner_payable' AND direction = 'credit' THEN amount_mad ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN entry_type IN ('partner_payable','payout') AND direction = 'debit' THEN amount_mad ELSE 0 END), 0) AS eligible_balance_mad
       FROM ledger_entries WHERE partner_id = ?`
    )
    .get(ctx.partner.id) as { eligible_balance_mad: number };

  return NextResponse.json({ payouts, ledger, eligibleBalanceMad: Math.max(0, summary.eligible_balance_mad) });
}

export async function POST(req: Request) {
  ensureSeeded();
  const ctx = await requirePartnerContext();
  if (ctx.error || !ctx.partner || !ctx.user) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const body = await req.json();
  const requestedAmount = Number(body.amountMad);
  if (!requestedAmount || requestedAmount < 100) {
    return NextResponse.json({ error: "Minimum payout request is 100 MAD." }, { status: 400 });
  }

  try {
    const payoutId = runInTransaction((db) => {
      const summary = db
        .prepare(
          `SELECT
            COALESCE(SUM(CASE WHEN entry_type = 'partner_payable' AND direction = 'credit' THEN amount_mad ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN entry_type IN ('partner_payable','payout') AND direction = 'debit' THEN amount_mad ELSE 0 END), 0) AS eligible_balance_mad
           FROM ledger_entries WHERE partner_id = ?`
        )
        .get(ctx.partner!.id) as { eligible_balance_mad: number };

      if (requestedAmount > summary.eligible_balance_mad) {
        throw new Error(`Requested amount exceeds eligible balance (${summary.eligible_balance_mad} MAD).`);
      }

      const res = db
        .prepare(
          `INSERT INTO payouts (partner_id, amount_mad, status, requested_by_user_id, notes)
           VALUES (?, ?, 'requested', ?, ?)`
        )
        .run(ctx.partner!.id, requestedAmount, ctx.user!.id, body.notes || "Partner payout request (auditable workflow)");

      db.prepare(
        `INSERT INTO ledger_entries (partner_id, entry_type, amount_mad, direction, description)
         VALUES (?, 'payout', ?, 'debit', ?)`
      ).run(ctx.partner!.id, requestedAmount, `Payout request #${Number(res.lastInsertRowid)}`);

      return Number(res.lastInsertRowid);
    });

    logAudit(ctx.user.id, "partner.payout_requested", "payout", payoutId, { amountMad: requestedAmount });
    return NextResponse.json({ id: payoutId, status: "requested" }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
