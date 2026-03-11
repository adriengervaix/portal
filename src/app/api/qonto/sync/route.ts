import { NextResponse } from "next/server";
import { syncMonth } from "@/lib/qonto/sync-month";
import { getLastMonthKeys } from "@/lib/tax/declaration-utils";

/**
 * POST /api/qonto/sync
 * Body: { monthKey?: string } — if provided, sync only that month; else sync last 12 months.
 */
export async function POST(request: Request) {
  const login = process.env.QONTO_LOGIN;
  const secretKey = process.env.QONTO_SECRET_KEY;
  const iban = process.env.QONTO_IBAN;

  if (!login || !secretKey || !iban) {
    return NextResponse.json(
      { error: "QONTO_LOGIN, QONTO_SECRET_KEY, QONTO_IBAN must be set" },
      { status: 500 }
    );
  }

  let body: { monthKey?: string } = {};
  try {
    body = await request.json();
  } catch {
    // empty body is ok
  }

  const config = { login, secretKey };

  if (body.monthKey) {
    try {
      const result = await syncMonth(config, iban, body.monthKey);
      return NextResponse.json({ ok: true, ...result });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sync failed";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  const monthKeys = getLastMonthKeys(12);
  const results: Array<{
    monthKey: string;
    revenuesCount: number;
    expensesCount: number;
    totalRevenuesHt: number;
    totalExpensesHt: number;
  }> = [];

  for (const monthKey of monthKeys) {
    try {
      const result = await syncMonth(config, iban, monthKey);
      results.push({ monthKey, ...result });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sync failed";
      return NextResponse.json(
        { error: `Sync failed for ${monthKey}: ${msg}` },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true, synced: results });
}
