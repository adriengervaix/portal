import { NextResponse } from "next/server";
import { fetchQontoClients } from "@/lib/qonto/fetch-clients";

/**
 * GET /api/qonto/clients/search?q=acme
 * Returns Qonto clients for lightweight import.
 */
export async function GET(request: Request) {
  const login = process.env.QONTO_LOGIN;
  const secretKey = process.env.QONTO_SECRET_KEY;
  if (!login || !secretKey) {
    return NextResponse.json({ error: "Qonto not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  try {
    const clients = await fetchQontoClients({ login, secretKey }, q);
    return NextResponse.json({ clients });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch Qonto clients";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
