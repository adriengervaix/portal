import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { taxRevenues, counterpartyMappings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

/** PATCH /api/tax/revenues/[id] — Update client attribution and save mapping */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { clientId } = body as { clientId: string | null };

  const [rev] = await db
    .select()
    .from(taxRevenues)
    .where(eq(taxRevenues.id, id));

  if (!rev) {
    return NextResponse.json({ error: "Revenue not found" }, { status: 404 });
  }

  await db
    .update(taxRevenues)
    .set({ clientId: clientId || null })
    .where(eq(taxRevenues.id, id));

  if (clientId && rev.counterpartyName) {
    const existing = await db
      .select()
      .from(counterpartyMappings)
      .where(eq(counterpartyMappings.counterpartyName, rev.counterpartyName));

    if (existing.length === 0) {
      await db.insert(counterpartyMappings).values({
        id: randomUUID(),
        counterpartyName: rev.counterpartyName,
        clientId,
      });
    } else {
      await db
        .update(counterpartyMappings)
        .set({ clientId })
        .where(eq(counterpartyMappings.counterpartyName, rev.counterpartyName));
    }
  }

  return NextResponse.json({ ok: true });
}
