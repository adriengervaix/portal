import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { taxDeclarations, taxRevenues, taxExpenses } from "@/lib/db/schema";
import { eq, desc, sql, and, notLike } from "drizzle-orm";
import { randomUUID } from "crypto";
import {
  getLastMonthKeys,
  getDaysRemaining,
  formatMonthLabel,
} from "@/lib/tax/declaration-utils";
import type { TaxDeclarationStatus } from "@/lib/db/schema";

/** GET /api/tax/declarations — List declarations, auto-creating missing months */
export async function GET() {
  const monthKeys = getLastMonthKeys(12);
  const existing = await db
    .select()
    .from(taxDeclarations)
    .orderBy(desc(taxDeclarations.monthKey));

  const byKey = new Map(existing.map((d) => [d.monthKey, d]));
  const declarations: Array<{
    id: string;
    monthKey: string;
    monthLabel: string;
    status: TaxDeclarationStatus;
    daysRemaining: number;
    caHt: number | null;
    totalExpenses: number | null;
  }> = [];

  for (const monthKey of monthKeys) {
    let decl = byKey.get(monthKey);
    if (!decl) {
      const daysRemaining = getDaysRemaining(monthKey);
      const status: TaxDeclarationStatus =
        daysRemaining === 0 ? "OVERDUE" : "OPEN";
      const id = randomUUID();
      await db.insert(taxDeclarations).values({
        id,
        monthKey,
        status,
      });
      decl = { id, monthKey, status, createdAt: new Date(), updatedAt: new Date() };
      byKey.set(monthKey, decl);
    }

    const [revenues] = await db
      .select({
        total: sql<number>`coalesce(sum(${taxRevenues.amountHt}), 0)`,
      })
      .from(taxRevenues)
      .where(eq(taxRevenues.declarationId, decl.id));
    const [expenses] = await db
      .select({
        total: sql<number>`coalesce(sum(${taxExpenses.amountTtc}), 0)`,
      })
      .from(taxExpenses)
      .where(
        and(
          eq(taxExpenses.declarationId, decl.id),
          notLike(taxExpenses.supplierName, "%DGFIP%")
        )
      );

    const daysRemaining = getDaysRemaining(monthKey);
    let status = decl.status;
    if (status === "OPEN" && daysRemaining === 0) {
      status = "OVERDUE";
      await db
        .update(taxDeclarations)
        .set({ status: "OVERDUE", updatedAt: new Date() })
        .where(eq(taxDeclarations.id, decl.id));
    }

    declarations.push({
      id: decl.id,
      monthKey: decl.monthKey,
      monthLabel: formatMonthLabel(decl.monthKey),
      status,
      daysRemaining,
      caHt: (revenues?.total ?? 0) > 0 ? Number(revenues?.total ?? 0) : null,
      totalExpenses:
        (expenses?.total ?? 0) > 0 ? Number(expenses?.total ?? 0) : null,
    });
  }

  return NextResponse.json(declarations);
}
