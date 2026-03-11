import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  taxDeclarations,
  taxRevenues,
  taxExpenses,
  clients,
} from "@/lib/db/schema";
import { eq, and, notLike } from "drizzle-orm";
import type { TaxDeclarationStatus } from "@/lib/db/schema";

/** GET /api/tax/declarations/[monthKey] — Full declaration detail */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ monthKey: string }> }
) {
  const { monthKey } = await params;
  const [decl] = await db
    .select()
    .from(taxDeclarations)
    .where(eq(taxDeclarations.monthKey, monthKey));

  if (!decl) {
    return NextResponse.json({ error: "Declaration not found" }, { status: 404 });
  }

  const revs = await db
    .select({
      id: taxRevenues.id,
      counterpartyName: taxRevenues.counterpartyName,
      amountTtc: taxRevenues.amountTtc,
      amountHt: taxRevenues.amountHt,
      vatAmount: taxRevenues.vatAmount,
      clientId: taxRevenues.clientId,
      clientName: clients.name,
      reference: taxRevenues.reference,
    })
    .from(taxRevenues)
    .leftJoin(clients, eq(taxRevenues.clientId, clients.id))
    .where(eq(taxRevenues.declarationId, decl.id));

  const exps = await db
    .select()
    .from(taxExpenses)
    .where(
      and(
        eq(taxExpenses.declarationId, decl.id),
        notLike(taxExpenses.supplierName, "%DGFIP%")
      )
    );

  const totalRevenuesHt = revs.reduce((s, r) => s + r.amountHt, 0);
  const totalRevenuesTtc = revs.reduce((s, r) => s + r.amountTtc, 0);
  const totalExpensesTtc = exps.reduce((s, e) => s + e.amountTtc, 0);
  const totalExpensesHt = exps.reduce((s, e) => s + e.amountHt, 0);
  const totalExpensesVat = exps.reduce((s, e) => s + e.vatAmount, 0);
  const vatCollected = revs.reduce(
    (s, r) => s + (r.vatAmount ?? r.amountTtc - r.amountHt),
    0
  );
  const vatNet = vatCollected - totalExpensesVat;

  const byClient = new Map<string, { name: string; amountHt: number }>();
  for (const r of revs) {
    const name = r.clientName ?? r.counterpartyName;
    const cur = byClient.get(name) ?? { name, amountHt: 0 };
    cur.amountHt += r.amountHt;
    byClient.set(name, cur);
  }

  const foreignSuppliers = exps.filter((e) => e.vatAmount === 0 && e.amountTtc !== 0);

  return NextResponse.json({
    declaration: decl,
    revenues: revs,
    expenses: exps,
    summary: {
      totalRevenuesHt,
      totalRevenuesTtc,
      totalExpensesTtc,
      totalExpensesHt,
      totalExpensesVat,
      vatCollected,
      vatNet,
      byClient: Array.from(byClient.values()),
    },
    foreignSuppliers: foreignSuppliers.map((e) => e.supplierName),
  });
}

/** PATCH /api/tax/declarations/[monthKey] — Update declaration status */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ monthKey: string }> }
) {
  const { monthKey } = await params;
  const body = (await request.json()) as { status?: TaxDeclarationStatus };

  if (!body.status || !["OPEN", "CLOSED", "OVERDUE"].includes(body.status)) {
    return NextResponse.json(
      { error: "Invalid status. Must be OPEN, CLOSED, or OVERDUE" },
      { status: 400 }
    );
  }

  const [decl] = await db
    .select()
    .from(taxDeclarations)
    .where(eq(taxDeclarations.monthKey, monthKey));

  if (!decl) {
    return NextResponse.json({ error: "Declaration not found" }, { status: 404 });
  }

  await db
    .update(taxDeclarations)
    .set({ status: body.status, updatedAt: new Date() })
    .where(eq(taxDeclarations.id, decl.id));

  return NextResponse.json({ ok: true, status: body.status });
}
