import { NextResponse } from "next/server";
import { fetchQontoQuotesByClient } from "@/lib/qonto/fetch-quotes";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/qonto/quotes?clientId=qonto-client-id
 * Returns quotes for one Qonto client.
 */
export async function GET(request: Request) {
  const login = process.env.QONTO_LOGIN;
  const secretKey = process.env.QONTO_SECRET_KEY;
  if (!login || !secretKey) {
    return NextResponse.json({ error: "Qonto not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId")?.trim();
  const portalClientId = searchParams.get("portalClientId")?.trim();
  if (!clientId) {
    return NextResponse.json(
      { error: "clientId query param required" },
      { status: 400 }
    );
  }

  try {
    const quotes = await fetchQontoQuotesByClient({ login, secretKey }, clientId);

    if (!portalClientId) {
      return NextResponse.json({ quotes });
    }

    const existingProjects = await db
      .select({
        id: projects.id,
        qontoQuoteId: projects.qontoQuoteId,
        quoteNumber: projects.quoteNumber,
        devisReference: projects.devisReference,
      })
      .from(projects)
      .where(eq(projects.clientId, portalClientId));

    const usedQontoQuoteIds = new Set(
      existingProjects
        .map((project) => project.qontoQuoteId)
        .filter((value): value is string => Boolean(value))
    );
    const usedQuoteNumbers = new Set(
      existingProjects
        .flatMap((project) => [project.quoteNumber, project.devisReference])
        .filter((value): value is string => Boolean(value))
        .map((value) => value.trim().toLowerCase())
    );

    const unassignedQuotes = quotes.filter((quote) => {
      if (usedQontoQuoteIds.has(quote.id)) return false;
      return !usedQuoteNumbers.has(quote.number.trim().toLowerCase());
    });

    return NextResponse.json({ quotes: unassignedQuotes });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch Qonto quotes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
