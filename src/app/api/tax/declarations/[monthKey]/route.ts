import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  taxDeclarations,
  taxRevenues,
  taxExpenses,
  clients,
} from "@/lib/db/schema";
import { eq, and, notLike } from "drizzle-orm";

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
      clientId: taxRevenues.clientId,
      clientName: clients.name,
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
  const vatCollected = totalRevenuesTtc - totalRevenuesHt;
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
