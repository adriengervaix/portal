"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangleIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  EuroIcon,
  ReceiptIcon,
  ScaleIcon,
} from "lucide-react";

interface RevenueRow {
  id: string;
  counterpartyName: string;
  amountTtc: number;
  amountHt: number;
  clientId: string | null;
  clientName: string | null;
}

interface ExpenseRow {
  id: string;
  supplierName: string;
  amountTtc: number;
  amountHt: number;
  vatAmount: number;
}

interface TaxDeclarationSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  monthLabel: string;
  onImportRevenues: () => void;
  onImportExpenses: () => void;
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
  }).format(cents / 100);
}

/**
 * Sidebar dashboard showing full month detail: KPIs, URSSAF, TVA, expenses and revenues.
 */
export function TaxDeclarationSidebar({
  open,
  onOpenChange,
  monthLabel,
  onImportRevenues,
  onImportExpenses,
  summary,
  revenues,
  expenses,
  foreignSuppliers,
}: TaxDeclarationSidebarProps): React.ReactElement {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-[90vw] sm:w-[50vw] sm:max-w-[50vw] min-w-[320px] overflow-y-auto p-6"
        side="right"
      >
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="text-xl">{monthLabel}</SheetTitle>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onImportRevenues}>
              <TrendingUpIcon className="size-4" />
              Importer revenus
            </Button>
            <Button variant="outline" size="sm" onClick={onImportExpenses}>
              <TrendingDownIcon className="size-4" />
              Importer dépenses
            </Button>
          </div>
        </SheetHeader>

        <div className="space-y-6 pt-6">
          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-emerald-500/10 border-emerald-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <EuroIcon className="size-4" />
                  CA HT
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                  {formatCents(summary.totalRevenuesHt)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-slate-500/10 border-slate-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <ReceiptIcon className="size-4" />
                  Dépenses HT
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatCents(summary.totalExpensesHt)}
                </p>
              </CardContent>
            </Card>
            <Card
              className={
                summary.vatNet >= 0
                  ? "bg-amber-500/10 border-amber-500/30"
                  : "bg-green-500/10 border-green-500/30"
              }
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <ScaleIcon className="size-4" />
                  TVA nette
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p
                  className={`text-2xl font-bold ${
                    summary.vatNet >= 0
                      ? "text-amber-700 dark:text-amber-400"
                      : "text-green-700 dark:text-green-400"
                  }`}
                >
                  {formatCents(summary.vatNet)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary.vatNet >= 0 ? "À payer" : "Crédit"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* URSSAF + TVA detail grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">URSSAF</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">
                    Chiffre d&apos;affaires encaissé HT
                  </p>
                  <p className="text-lg font-semibold">
                    {formatCents(summary.totalRevenuesHt)}
                  </p>
                </div>
                {summary.byClient.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-2">
                      Par client
                    </p>
                    <ul className="space-y-1.5 text-sm">
                      {summary.byClient.map((c) => (
                        <li
                          key={c.name}
                          className="flex justify-between items-center"
                        >
                          <span className="truncate mr-2">{c.name}</span>
                          <span className="font-medium shrink-0">
                            {formatCents(c.amountHt)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">TVA (Impôts)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CA HT réalisé</span>
                  <span className="font-medium">
                    {formatCents(summary.totalRevenuesHt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">TVA collectée</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    {formatCents(summary.vatCollected)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">TVA déductible</span>
                  <span className="font-medium">
                    {formatCents(summary.totalExpensesVat)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t font-semibold">
                  <span>TVA nette à payer</span>
                  <span
                    className={
                      summary.vatNet >= 0
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-green-600 dark:text-green-400"
                    }
                  >
                    {formatCents(summary.vatNet)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Foreign suppliers alert */}
          {foreignSuppliers.length > 0 && (
            <Card className="border-amber-500/50 bg-amber-500/10">
              <CardContent className="pt-4">
                <div className="flex gap-3 items-start">
                  <AlertTriangleIcon className="size-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-800 dark:text-amber-400">
                      Autoliquidation TVA
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-500 mt-1">
                      Certaines dépenses proviennent de fournisseurs hors France et
                      pourraient nécessiter une autoliquidation de TVA.
                    </p>
                    <ul className="mt-2 text-sm space-y-1">
                      {foreignSuppliers.map((s, i) => (
                        <li key={`${s}-${i}`} className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Expenses table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Dépenses / Abonnements
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-y">
                      <th className="text-left p-3 font-medium">
                        Fournisseur
                      </th>
                      <th className="text-right p-3 font-medium">TTC</th>
                      <th className="text-right p-3 font-medium">HT</th>
                      <th className="text-right p-3 font-medium">TVA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((e) => (
                      <tr
                        key={e.id}
                        className={
                          e.vatAmount > 0
                            ? "bg-green-500/5 border-b border-border"
                            : "border-b border-border"
                        }
                      >
                        <td className="p-3">{e.supplierName}</td>
                        <td className="p-3 text-right">
                          {formatCents(e.amountTtc)}
                        </td>
                        <td className="p-3 text-right">
                          {formatCents(e.amountHt)}
                        </td>
                        <td className="p-3 text-right">
                          {formatCents(e.vatAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/50 font-semibold border-t-2">
                      <td className="p-3">Total</td>
                      <td className="p-3 text-right">
                        {formatCents(summary.totalExpensesTtc)}
                      </td>
                      <td className="p-3 text-right">
                        {formatCents(summary.totalExpensesHt)}
                      </td>
                      <td className="p-3 text-right">
                        {formatCents(summary.totalExpensesVat)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Revenues table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenus</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-y">
                      <th className="text-left p-3 font-medium">Client</th>
                      <th className="text-right p-3 font-medium">TTC</th>
                      <th className="text-right p-3 font-medium">HT</th>
                      <th className="text-right p-3 font-medium">TVA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenues.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-border"
                      >
                        <td className="p-3">
                          {r.clientName ?? r.counterpartyName}
                        </td>
                        <td className="p-3 text-right">
                          {formatCents(r.amountTtc)}
                        </td>
                        <td className="p-3 text-right">
                          {formatCents(r.amountHt)}
                        </td>
                        <td className="p-3 text-right">
                          {formatCents(r.amountTtc - r.amountHt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/50 font-semibold border-t-2">
                      <td className="p-3">Total</td>
                      <td className="p-3 text-right">
                        {formatCents(summary.totalRevenuesTtc)}
                      </td>
                      <td className="p-3 text-right">
                        {formatCents(summary.totalRevenuesHt)}
                      </td>
                      <td className="p-3 text-right">
                        {formatCents(summary.vatCollected)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}
