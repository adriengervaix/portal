import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  taxDeclarations,
  taxRevenues,
  taxExpenses,
  counterpartyMappings,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

interface RevenueInput {
  date: string;
  counterpartyName: string;
  amountTtc: number;
  amountHt: number;
}

interface ExpenseInput {
  date: string;
  counterpartyName: string;
  amountTtc: number;
  amountHt: number;
}

/**
 * POST /api/tax/declarations/[monthKey]/import
 * Body: { monthKey, revenues?: RevenueInput[], expenses?: ExpenseInput[], confirm?: boolean }
 * If confirm=true, saves to DB and closes declaration.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ monthKey: string }> }
) {
  const { monthKey } = await params;
  const body = await request.json();
  let {
    revenues = [],
    expenses = [],
    confirm = false,
    clientAssignments = {},
  } = body as {
    revenues?: RevenueInput[];
    expenses?: ExpenseInput[];
    confirm?: boolean;
    clientAssignments?: Record<string, string>;
  };

  expenses = expenses.filter(
    (e: ExpenseInput) =>
      !e.counterpartyName.toUpperCase().includes("DGFIP")
  );

  let [decl] = await db
    .select()
    .from(taxDeclarations)
    .where(eq(taxDeclarations.monthKey, monthKey));

  if (!decl) {
    const id = randomUUID();
    await db.insert(taxDeclarations).values({
      id,
      monthKey,
      status: "OPEN",
    });
    [decl] = await db
      .select()
      .from(taxDeclarations)
      .where(eq(taxDeclarations.monthKey, monthKey));
  }

  if (!decl) {
    return NextResponse.json(
      { error: "Declaration not found" },
      { status: 404 }
    );
  }

  if (decl.status === "CLOSED" && !confirm) {
    return NextResponse.json(
      { error: "Declaration already closed" },
      { status: 400 }
    );
  }

  const mappings = await db.select().from(counterpartyMappings);
  const mappingByCounterparty = new Map(
    mappings.map((m) => [m.counterpartyName.toLowerCase(), m.clientId])
  );

  for (const [counterparty, clientId] of Object.entries(clientAssignments)) {
    if (clientId) {
      mappingByCounterparty.set(counterparty.toLowerCase(), clientId);
    }
  }

  const resolveClient = (name: string): string | null => {
    const lower = name.toLowerCase().trim();
    return mappingByCounterparty.get(lower) ?? null;
  };

  if (confirm) {
    if (revenues.length > 0) {
      await db.delete(taxRevenues).where(eq(taxRevenues.declarationId, decl.id));
    }
    if (expenses.length > 0) {
      await db.delete(taxExpenses).where(eq(taxExpenses.declarationId, decl.id));
    }

    const newMappings: Array<{ counterpartyName: string; clientId: string }> = [];
    for (const r of revenues) {
      const clientId = resolveClient(r.counterpartyName) ?? clientAssignments?.[r.counterpartyName];
      if (clientId && !mappingByCounterparty.has(r.counterpartyName.toLowerCase())) {
        newMappings.push({ counterpartyName: r.counterpartyName, clientId });
      }
    }

    for (const m of newMappings) {
      const existing = mappings.find(
        (x) => x.counterpartyName.toLowerCase() === m.counterpartyName.toLowerCase()
      );
      if (!existing) {
        await db.insert(counterpartyMappings).values({
          id: randomUUID(),
          counterpartyName: m.counterpartyName,
          clientId: m.clientId,
        });
      }
    }

    for (const r of revenues) {
      const clientId = resolveClient(r.counterpartyName) ?? clientAssignments?.[r.counterpartyName] ?? null;
      await db.insert(taxRevenues).values({
        id: randomUUID(),
        declarationId: decl.id,
        counterpartyName: r.counterpartyName,
        amountTtc: r.amountTtc,
        amountHt: r.amountHt,
        clientId: clientId || null,
      });
    }

    for (const e of expenses) {
      const ttc = Math.abs(e.amountTtc);
      const ht = Math.abs(e.amountHt);
      const vatAmount = ttc - ht;
      await db.insert(taxExpenses).values({
        id: randomUUID(),
        declarationId: decl.id,
        supplierName: e.counterpartyName,
        amountTtc: ttc,
        amountHt: ht,
        vatAmount,
      });
    }

    await db
      .update(taxDeclarations)
      .set({ status: "CLOSED", updatedAt: new Date() })
      .where(eq(taxDeclarations.id, decl.id));
  }

  const totalRevenuesHt = revenues.reduce((s, r) => s + r.amountHt, 0);
  const totalRevenuesTtc = revenues.reduce((s, r) => s + r.amountTtc, 0);
  const totalExpensesTtc = expenses.reduce(
    (s, e) => s + Math.abs(e.amountTtc),
    0
  );
  const totalExpensesHt = expenses.reduce(
    (s, e) => s + Math.abs(e.amountHt),
    0
  );

  return NextResponse.json({
    ok: true,
    confirm,
    summary: {
      revenuesCount: revenues.length,
      expensesCount: expenses.length,
      totalRevenuesHt,
      totalRevenuesTtc,
      totalExpensesTtc,
      totalExpensesHt,
    },
  });
}
