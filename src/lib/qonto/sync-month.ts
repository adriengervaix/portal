/**
 * Syncs Qonto transactions for a given month into tax_revenues and tax_expenses.
 */

import { db } from "@/lib/db";
import {
  taxDeclarations,
  taxRevenues,
  taxExpenses,
  counterpartyMappings,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { fetchTransactions } from "./fetch-transactions";
import type { QontoClientConfig } from "./client";
import type { QontoTransaction } from "./fetch-transactions";

/** Counterparty labels to exclude (internal transfers, remuneration) */
const EXCLUDED_COUNTERPARTIES = [
  "adrien gervaix — boursorama",
  "adrien gervaix — revolut",
  "adrien gervaix — crédit mutuel",
  "louis gervaix darmont",
  "tva / charges",
];

function isExcludedCounterparty(label: string): boolean {
  const normalized = label.toLowerCase().trim();
  return EXCLUDED_COUNTERPARTIES.some((excl) => normalized.includes(excl));
}

/** Returns ISO date range for a month key (YYYY-MM) */
function getMonthDateRange(monthKey: string): { from: string; to: string } {
  const [y, m] = monthKey.split("-").map(Number);
  const from = new Date(y, m - 1, 1);
  const to = new Date(y, m, 0, 23, 59, 59, 999);
  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

/**
 * Syncs a single month: fetches Qonto transactions and upserts into DB.
 */
export async function syncMonth(
  config: QontoClientConfig,
  iban: string,
  monthKey: string
): Promise<{
  revenuesCount: number;
  expensesCount: number;
  totalRevenuesHt: number;
  totalExpensesHt: number;
}> {
  const { from, to } = getMonthDateRange(monthKey);

  const [credits, debits] = await Promise.all([
    fetchTransactions(config, { iban, settledAtFrom: from, settledAtTo: to, side: "credit" }),
    fetchTransactions(config, { iban, settledAtFrom: from, settledAtTo: to, side: "debit" }),
  ]);

  const revenues = credits
    .filter(
      (t) =>
        !isExcludedCounterparty(t.label) &&
        !isExcludedCounterparty(t.clean_counterparty_name ?? "")
    )
    .map((t) => mapTransactionToRevenue(t));
  const expenses = debits
    .filter(
      (t) =>
        !t.label.toUpperCase().includes("DGFIP") &&
        !isExcludedCounterparty(t.label) &&
        !isExcludedCounterparty(t.clean_counterparty_name ?? "")
    )
    .map((t) => mapTransactionToExpense(t));

  const mappings = await db.select().from(counterpartyMappings);
  const mappingByCounterparty = new Map(
    mappings.map((m) => [m.counterpartyName.toLowerCase(), m.clientId])
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
    throw new Error("Declaration not found after create");
  }

  await db.delete(taxRevenues).where(eq(taxRevenues.declarationId, decl.id));
  await db.delete(taxExpenses).where(eq(taxExpenses.declarationId, decl.id));

  for (const r of revenues) {
    const clientId =
      mappingByCounterparty.get(r.counterpartyName.toLowerCase()) ?? null;
    await db.insert(taxRevenues).values({
      id: randomUUID(),
      declarationId: decl.id,
      counterpartyName: r.counterpartyName,
      amountTtc: r.amountTtc,
      amountHt: r.amountHt,
      vatAmount: r.vatAmount,
      clientId,
      reference: r.reference,
    });
  }

  for (const e of expenses) {
    await db.insert(taxExpenses).values({
      id: randomUUID(),
      declarationId: decl.id,
      supplierName: e.supplierName,
      amountTtc: e.amountTtc,
      amountHt: e.amountHt,
      vatAmount: e.vatAmount,
    });
  }

  const totalRevenuesHt = revenues.reduce((s, r) => s + r.amountHt, 0);
  const totalExpensesHt = expenses.reduce((s, e) => s + e.amountHt, 0);

  return {
    revenuesCount: revenues.length,
    expensesCount: expenses.length,
    totalRevenuesHt,
    totalExpensesHt,
  };
}

function mapTransactionToRevenue(t: QontoTransaction): {
  counterpartyName: string;
  amountTtc: number;
  amountHt: number;
  vatAmount: number | null;
  reference: string | null;
} {
  const counterpartyName =
    t.clean_counterparty_name?.trim() || t.label?.trim() || "Inconnu";
  const amountTtc = Math.abs(t.amount_cents);
  const vatCents = t.vat_amount_cents ?? 0;
  const amountHt = amountTtc - vatCents;
  const reference = t.label?.trim() || null;

  return {
    counterpartyName,
    amountTtc,
    amountHt: Math.max(0, amountHt),
    vatAmount: vatCents > 0 ? vatCents : null,
    reference,
  };
}

function mapTransactionToExpense(t: QontoTransaction): {
  supplierName: string;
  amountTtc: number;
  amountHt: number;
  vatAmount: number;
} {
  const supplierName =
    t.clean_counterparty_name?.trim() || t.label?.trim() || "Inconnu";
  const amountTtc = Math.abs(t.amount_cents);
  const vatCents = t.vat_amount_cents ?? 0;
  const amountHt = amountTtc - vatCents;

  return {
    supplierName,
    amountTtc,
    amountHt: Math.max(0, amountHt),
    vatAmount: vatCents,
  };
}
