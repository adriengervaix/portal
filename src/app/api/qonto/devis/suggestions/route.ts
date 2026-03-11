/**
 * GET /api/qonto/devis/suggestions?q=003
 * Returns devis references from Qonto for autocomplete.
 */

import { NextResponse } from "next/server";
import {
  fetchDevisRefsFromQonto,
  normalizeDevisRef,
} from "@/lib/qonto/fetch-devis-refs";

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
  const q = searchParams.get("q")?.trim() ?? "";

  try {
    const refs = await fetchDevisRefsFromQonto(
      { login, secretKey },
      iban
    );

    if (!q) {
      return NextResponse.json({ suggestions: refs.slice(0, 20) });
    }

    const normalized = normalizeDevisRef(q);
    const filtered = refs.filter((r) =>
      r.toLowerCase().includes(normalized.toLowerCase())
    );

    if (filtered.length === 0 && /^\d+$/.test(q.replace(/\D/g, ""))) {
      filtered.push(normalized);
    }

    return NextResponse.json({
      suggestions: filtered.slice(0, 10),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch devis";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
