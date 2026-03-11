/**
 * GET /api/qonto/devis/amount?ref=003
 * Returns the amount (HT) for a devis reference from Qonto transactions.
 */

import { NextResponse } from "next/server";
import { fetchDevisAmountFromQonto } from "@/lib/qonto/fetch-devis-refs";

export async function GET(request: Request) {
  const login = process.env.QONTO_LOGIN;
  const secretKey = process.env.QONTO_SECRET_KEY;
  const iban = process.env.QONTO_IBAN;

  if (!login || !secretKey || !iban) {
    return NextResponse.json(
      { error: "Qonto not configured" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const ref = searchParams.get("ref")?.trim();

  if (!ref) {
    return NextResponse.json(
      { error: "ref query param required" },
      { status: 400 }
    );
  }

  try {
    const result = await fetchDevisAmountFromQonto(
      { login, secretKey },
      iban,
      ref
    );

    if (!result) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({
      found: true,
      amountHt: result.amountHt,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch amount";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
