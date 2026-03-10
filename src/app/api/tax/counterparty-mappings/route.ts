import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { counterpartyMappings, clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/** GET /api/tax/counterparty-mappings — List all counterparty → client mappings */
export async function GET() {
  const rows = await db
    .select({
      id: counterpartyMappings.id,
      counterpartyName: counterpartyMappings.counterpartyName,
      clientId: counterpartyMappings.clientId,
      clientName: clients.name,
    })
    .from(counterpartyMappings)
    .leftJoin(clients, eq(counterpartyMappings.clientId, clients.id));

  return NextResponse.json(rows);
}
