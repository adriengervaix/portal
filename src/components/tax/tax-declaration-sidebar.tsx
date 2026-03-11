"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AlertTriangleIcon } from "lucide-react";

/** Charges sociales rate (25.6%) */
const CHARGES_RATE = 0.256;

interface RevenueRow {
  id: string;
  counterpartyName: string;
  amountTtc: number;
  amountHt: number;
  vatAmount: number | null;
  clientId: string | null;
  clientName: string | null;
  reference?: string | null;
}

interface ExpenseRow {
  id: string;
  supplierName: string;
  amountTtc: number;
  amountHt: number;
  vatAmount: number;
}

type DeclarationStatus = "OPEN" | "CLOSED" | "OVERDUE";

interface TaxDeclarationSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  monthKey: string;
  monthLabel: string;
  status: DeclarationStatus;
  onStatusChange?: (status: DeclarationStatus) => void;
  summary: {
    totalRevenuesHt: number;
    totalRevenuesTtc: number;
    totalExpensesTtc: number;
    totalExpensesHt: number;
    totalExpensesVat: number;
    vatCollected: number;
    vatNet: number;
    byClient: Array<{ name: string; amountHt: number }>;
  };
  revenues: RevenueRow[];
  expenses: ExpenseRow[];
  foreignSuppliers: string[];
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function groupBy<T, K extends string>(
  items: T[],
  getKey: (item: T) => K
): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const key = getKey(item);
    const arr = map.get(key) ?? [];
    arr.push(item);
    map.set(key, arr);
  }
  return map;
}

/**
 * Sidebar dashboard showing full month detail: KPIs, revenues, expenses and autoliquidation.
 */
export function TaxDeclarationSidebar({
  open,
  onOpenChange,
  monthKey,
  monthLabel,
  status,
  onStatusChange,
  summary,
  revenues,
  expenses,
  foreignSuppliers,
}: TaxDeclarationSidebarProps): React.ReactElement {
  const [updating, setUpdating] = useState(false);
  const isClosed = status === "CLOSED";

  async function handleStatusToggle(checked: boolean) {
    if (!onStatusChange) return;
    const newStatus: DeclarationStatus = checked ? "CLOSED" : "OPEN";
    setUpdating(true);
    try {
      const res = await fetch(`/api/tax/declarations/${monthKey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Update failed");
      }
      onStatusChange(newStatus);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-[90vw] sm:w-[50vw] sm:max-w-[50vw] min-w-[320px] overflow-y-auto px-6"
        side="right"
      >
        <SheetHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center justify-between gap-4">
            <SheetTitle className="text-xl font-medium">{monthLabel}</SheetTitle>
            <div className="flex items-center gap-2 shrink-0">
              <Label
                htmlFor="status-switch"
                className="text-sm font-normal text-muted-foreground cursor-pointer"
              >
                {isClosed ? "Clôturé" : "Ouvert"}
              </Label>
              <Switch
                id="status-switch"
                checked={isClosed}
                onCheckedChange={handleStatusToggle}
                disabled={updating}
              />
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-8 pt-6">
          {/* KPIs — same style as main page */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-4xl font-light">
                {formatCents(summary.totalRevenuesHt)}
              </p>
              <p className="text-base font-light text-muted-foreground mt-2">
                CA HT
              </p>
            </div>
            <div>
              <p className="text-4xl font-light">
                {formatCents(summary.totalExpensesHt)}
              </p>
              <p className="text-base font-light text-muted-foreground mt-2">
                Dépenses HT
              </p>
            </div>
          </div>

          {/* Revenues table */}
          <section>
            <h3 className="text-sm font-medium text-muted-foreground uppercase mb-3">
              Revenus
            </h3>
            <div className="overflow-x-auto rounded-lg bg-muted/30">
              <div className="min-w-[500px]">
                <div className="grid grid-cols-[1fr_80px_80px_80px_80px_80px] gap-4 px-4 py-2 text-xs font-medium uppercase text-muted-foreground">
                  <div className="text-left">Client</div>
                  <div className="text-right">N° facture</div>
                  <div className="text-right">TTC</div>
                  <div className="text-right">HT</div>
                  <div className="text-right">TVA</div>
                  <div className="text-right">Charges (25,6%)</div>
                </div>
                <Accordion type="single" collapsible className="w-full">
                    {Array.from(
                      groupBy(
                        revenues,
                        (r) => r.clientName ?? r.counterpartyName
                      ).entries()
                    ).map(([client, items]) => {
                      if (items.length === 1) {
                        const r = items[0];
                        const vatCents =
                          r.vatAmount ?? r.amountTtc - r.amountHt;
                        const chargesCents = Math.round(
                          r.amountHt * CHARGES_RATE
                        );
                        return (
                          <div
                            key={r.id}
                            className="grid grid-cols-[1fr_80px_80px_80px_80px_80px] gap-4 px-4 py-3 text-sm hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-colors rounded"
                          >
                            <div className="font-medium">
                              {r.clientName ?? r.counterpartyName}
                            </div>
                            <div
                              className="text-right text-muted-foreground truncate max-w-[80px] ml-auto"
                              title={r.reference ?? undefined}
                            >
                              {r.reference ?? "—"}
                            </div>
                            <div className="text-right">
                              {formatCents(r.amountTtc)}
                            </div>
                            <div className="text-right">
                              {formatCents(r.amountHt)}
                            </div>
                            <div className="text-right">
                              {vatCents > 0 ? formatCents(vatCents) : "—"}
                            </div>
                            <div className="text-right text-amber-600 dark:text-amber-400">
                              {formatCents(chargesCents)}
                            </div>
                          </div>
                        );
                      }
                      const totalTtc = items.reduce((s, x) => s + x.amountTtc, 0);
                      const totalHt = items.reduce((s, x) => s + x.amountHt, 0);
                      const totalVat = items.reduce(
                        (s, x) =>
                          s + (x.vatAmount ?? x.amountTtc - x.amountHt),
                        0
                      );
                      const totalCharges = Math.round(
                        totalHt * CHARGES_RATE
                      );
                      return (
                        <AccordionItem
                          key={`rev-${client}-${items[0].id}`}
                          value={`rev-${client}-${items[0].id}`}
                          className="border-0"
                        >
                          <AccordionTrigger className="cursor-pointer px-4 py-3 hover:no-underline hover:bg-amber-50/50 dark:hover:bg-amber-950/20 rounded [&>svg]:hidden">
                            <div className="grid grid-cols-[1fr_80px_80px_80px_80px_80px] gap-4 w-full text-left text-sm">
                              <div className="flex items-center gap-2">
                                {client}
                                <span className="text-muted-foreground font-normal">
                                  ({items.length} transactions)
                                </span>
                              </div>
                              <div className="text-right text-muted-foreground">
                                —
                              </div>
                              <div className="text-right font-medium">
                                {formatCents(totalTtc)}
                              </div>
                              <div className="text-right font-medium">
                                {formatCents(totalHt)}
                              </div>
                              <div className="text-right font-medium">
                                {totalVat > 0 ? formatCents(totalVat) : "—"}
                              </div>
                              <div className="text-right font-medium text-amber-600 dark:text-amber-400">
                                {formatCents(totalCharges)}
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-0 pt-0">
                            <div>
                              {items.map((r) => {
                                const vatCents =
                                  r.vatAmount ?? r.amountTtc - r.amountHt;
                                const chargesCents = Math.round(
                                  r.amountHt * CHARGES_RATE
                                );
                                return (
                                  <div
                                    key={r.id}
                                    className="grid grid-cols-[1fr_80px_80px_80px_80px_80px] gap-4 px-4 py-2 pl-10 text-sm text-muted-foreground hover:bg-amber-50/30 dark:hover:bg-amber-950/10 rounded"
                                  >
                                    <div className="text-muted-foreground">
                                      —
                                    </div>
                                    <div
                                      className="text-right text-muted-foreground truncate max-w-[80px] ml-auto"
                                      title={r.reference ?? undefined}
                                    >
                                      {r.reference ?? "—"}
                                    </div>
                                    <div className="text-right">
                                      {formatCents(r.amountTtc)}
                                    </div>
                                    <div className="text-right">
                                      {formatCents(r.amountHt)}
                                    </div>
                                    <div className="text-right">
                                      {vatCents > 0
                                        ? formatCents(vatCents)
                                        : "—"}
                                    </div>
                                    <div className="text-right text-amber-600 dark:text-amber-400">
                                      {formatCents(chargesCents)}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                <div className="grid grid-cols-[1fr_80px_80px_80px_80px_80px] gap-4 px-4 py-2 text-sm font-medium">
                    <div>Total</div>
                    <div className="text-right">—</div>
                    <div className="text-right">
                      {formatCents(summary.totalRevenuesTtc)}
                    </div>
                    <div className="text-right">
                      {formatCents(summary.totalRevenuesHt)}
                    </div>
                    <div className="text-right">
                      {formatCents(summary.vatCollected)}
                    </div>
                    <div className="text-right text-amber-600 dark:text-amber-400">
                      {formatCents(
                        Math.round(summary.totalRevenuesHt * CHARGES_RATE)
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

          {/* Foreign suppliers */}
          {foreignSuppliers.length > 0 && (
            <section>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="autoliquidation" className="border-0">
                  <AccordionTrigger className="py-0 hover:no-underline hover:bg-amber-50/50 dark:hover:bg-amber-950/20 cursor-pointer rounded transition-colors">
                    <div className="flex gap-3 items-center">
                      <AlertTriangleIcon className="size-5 text-amber-600 shrink-0" />
                      <div className="text-left">
                        <p className="font-medium text-amber-800 dark:text-amber-400">
                          Autoliquidation TVA
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          Certaines dépenses proviennent de fournisseurs hors
                          France.
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="mt-2 text-sm space-y-1 pl-8">
                      {foreignSuppliers.map((s, i) => (
                        <li key={`${s}-${i}`} className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </section>
          )}

          {/* Expenses table */}
          <section>
            <h3 className="text-sm font-medium text-muted-foreground uppercase mb-3">
              Dépenses / Abonnements
            </h3>
            <div className="overflow-x-auto rounded-lg bg-muted/30">
              <div className="min-w-[400px]">
                <div className="grid grid-cols-[1fr_80px_80px_80px] gap-4 px-4 py-2 text-xs font-medium uppercase text-muted-foreground">
                  <div className="text-left">Fournisseur</div>
                  <div className="text-right">TTC</div>
                  <div className="text-right">HT</div>
                  <div className="text-right">TVA</div>
                </div>
                <Accordion type="single" collapsible className="w-full">
                    {Array.from(
                      groupBy(expenses, (e) => e.supplierName).entries()
                    ).map(([supplier, items]) => {
                      if (items.length === 1) {
                        const e = items[0];
                        return (
                          <div
                            key={e.id}
                            className="grid grid-cols-[1fr_80px_80px_80px] gap-4 px-4 py-3 text-sm hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-colors rounded"
                          >
                            <div className="font-medium">{e.supplierName}</div>
                            <div className="text-right">
                              {formatCents(e.amountTtc)}
                            </div>
                            <div className="text-right">
                              {formatCents(e.amountHt)}
                            </div>
                            <div className="text-right">
                              {formatCents(e.vatAmount)}
                            </div>
                          </div>
                        );
                      }
                      const totalTtc = items.reduce((s, x) => s + x.amountTtc, 0);
                      const totalHt = items.reduce((s, x) => s + x.amountHt, 0);
                      const totalVat = items.reduce((s, x) => s + x.vatAmount, 0);
                      return (
                        <AccordionItem
                          key={`exp-${supplier}-${items[0].id}`}
                          value={`exp-${supplier}-${items[0].id}`}
                          className="border-0"
                        >
                          <AccordionTrigger className="cursor-pointer px-4 py-3 hover:no-underline hover:bg-amber-50/50 dark:hover:bg-amber-950/20 rounded [&>svg]:hidden">
                            <div className="grid grid-cols-[1fr_80px_80px_80px] gap-4 w-full text-left text-sm">
                              <div className="flex items-center gap-2">
                                {supplier}
                                <span className="text-muted-foreground font-normal">
                                  ({items.length} transactions)
                                </span>
                              </div>
                              <div className="text-right font-medium">
                                {formatCents(totalTtc)}
                              </div>
                              <div className="text-right font-medium">
                                {formatCents(totalHt)}
                              </div>
                              <div className="text-right font-medium">
                                {formatCents(totalVat)}
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-0 pt-0">
                            <div>
                              {items.map((e) => (
                                <div
                                  key={e.id}
                                  className="grid grid-cols-[1fr_80px_80px_80px] gap-4 px-4 py-2 pl-10 text-sm text-muted-foreground hover:bg-amber-50/30 dark:hover:bg-amber-950/10 rounded"
                                >
                                  <div>—</div>
                                  <div className="text-right">
                                    {formatCents(e.amountTtc)}
                                  </div>
                                  <div className="text-right">
                                    {formatCents(e.amountHt)}
                                  </div>
                                  <div className="text-right">
                                    {formatCents(e.vatAmount)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                <div className="grid grid-cols-[1fr_80px_80px_80px] gap-4 px-4 py-2 text-sm font-medium">
                    <div>Total</div>
                    <div className="text-right">
                      {formatCents(summary.totalExpensesTtc)}
                    </div>
                    <div className="text-right">
                      {formatCents(summary.totalExpensesHt)}
                    </div>
                    <div className="text-right">
                      {formatCents(summary.totalExpensesVat)}
                    </div>
                  </div>
                </div>
              </div>
            </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
