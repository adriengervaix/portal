"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImportCsvDialog } from "./import-csv-dialog";
import { TaxDeclarationSidebar } from "./tax-declaration-sidebar";
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react";
import type { Client } from "@/types";

interface DeclarationRow {
  id: string;
  monthKey: string;
  monthLabel: string;
  status: "OPEN" | "CLOSED" | "OVERDUE";
  daysRemaining: number;
  caHt: number | null;
  totalExpenses: number | null;
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function sumOrNull(
  rows: DeclarationRow[],
  getter: (r: DeclarationRow) => number | null
): number | null {
  let total = 0;
  let hasAny = false;
  for (const r of rows) {
    const v = getter(r);
    if (v != null) {
      total += v;
      hasAny = true;
    }
  }
  return hasAny ? total : null;
}

/**
 * Main tax declarations list with import buttons and sidebar.
 */
export function TaxDeclarationList(): React.ReactElement {
  const [declarations, setDeclarations] = useState<DeclarationRow[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [counterpartyMappings, setCounterpartyMappings] = useState<
    Array<{ counterpartyName: string; clientId: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [importDialog, setImportDialog] = useState<{
    open: boolean;
    monthKey: string;
    type: "revenues" | "expenses";
  } | null>(null);
  const [sidebarMonth, setSidebarMonth] = useState<string | null>(null);
  const [sidebarData, setSidebarData] = useState<{
    monthLabel: string;
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
    revenues: Array<{
      id: string;
      counterpartyName: string;
      amountTtc: number;
      amountHt: number;
      clientId: string | null;
      clientName: string | null;
    }>;
    expenses: Array<{
      id: string;
      supplierName: string;
      amountTtc: number;
      amountHt: number;
      vatAmount: number;
    }>;
    foreignSuppliers: string[];
  } | null>(null);

  async function fetchDeclarations() {
    const res = await fetch("/api/tax/declarations");
    if (res.ok) {
      const data = await res.json();
      setDeclarations(data);
    }
    setLoading(false);
  }

  async function fetchClients() {
    const res = await fetch("/api/clients");
    if (res.ok) {
      const data = await res.json();
      setClients(data);
    }
  }

  async function fetchMappings() {
    const res = await fetch("/api/tax/counterparty-mappings");
    if (res.ok) {
      const data = await res.json();
      setCounterpartyMappings(
        data.map((m: { counterpartyName: string; clientId: string }) => ({
          counterpartyName: m.counterpartyName,
          clientId: m.clientId,
        }))
      );
    }
  }

  useEffect(() => {
    fetchDeclarations();
    fetchClients();
    fetchMappings();
  }, []);

  useEffect(() => {
    if (!sidebarMonth) return;
    (async () => {
      const res = await fetch(`/api/tax/declarations/${sidebarMonth}`);
      if (!res.ok) return;
      const data = await res.json();
      const decl = declarations.find((d) => d.monthKey === sidebarMonth);
      setSidebarData({
        monthLabel: decl?.monthLabel ?? sidebarMonth,
        summary: data.summary,
        revenues: data.revenues,
        expenses: data.expenses,
        foreignSuppliers: data.foreignSuppliers ?? [],
      });
    })();
  }, [sidebarMonth, declarations]);

  function getStatusBadge(row: DeclarationRow) {
    if (row.status === "CLOSED") {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800 border-0 dark:bg-green-950/50 dark:text-green-300">
          Clôturé
        </Badge>
      );
    }
    if (row.status === "OVERDUE") {
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800 border-0 dark:bg-red-950/50 dark:text-red-300">
          En retard · 0 jour restant
        </Badge>
      );
    }
    const days = row.daysRemaining;
    const colorClass =
      days <= 3
        ? "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300"
        : days <= 7
          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
          : "bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300";
    return (
      <Badge variant="secondary" className={`${colorClass} border-0`}>
        Déclaration ouverte · {days} jour{days > 1 ? "s" : ""} restant{days > 1 ? "s" : ""}
      </Badge>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  const totalCaHt = sumOrNull(declarations, (r) => r.caHt);
  const totalExpenses = sumOrNull(declarations, (r) => r.totalExpenses);
  const openCount = declarations.filter(
    (r) => r.status === "OPEN" || r.status === "OVERDUE"
  ).length;

  return (
    <div className="space-y-6">
      {/* Data — metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 bg-transparent shadow-none py-0">
          <CardContent className="pt-0 flex flex-col items-start text-left">
            <p className="text-4xl font-light">
              {totalCaHt != null ? formatCents(totalCaHt) : "—"}
            </p>
            <p className="text-base font-light text-muted-foreground mt-2">
              CA HT total
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-transparent shadow-none py-0">
          <CardContent className="pt-0 flex flex-col items-start text-left">
            <p className="text-4xl font-light">
              {totalExpenses != null ? formatCents(totalExpenses) : "—"}
            </p>
            <p className="text-base font-light text-muted-foreground mt-2">
              Dépenses totales
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-transparent shadow-none py-0">
          <CardContent className="pt-0 flex flex-col items-start text-left">
            <p className="text-4xl font-light">{openCount}</p>
            <p className="text-base font-light text-muted-foreground mt-2">
              Déclarations ouvertes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table — main content card */}
      <Card className="bg-white shadow-md rounded-xl border-border/80 overflow-hidden py-0">
        <div className="overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-muted/60 backdrop-blur-sm z-10">
              <tr className="border-b border-border">
                <th className="text-left p-4 text-xs font-medium uppercase text-muted-foreground">Mois</th>
                <th className="text-right p-4 text-xs font-medium uppercase text-muted-foreground">CA HT</th>
                <th className="text-right p-4 text-xs font-medium uppercase text-muted-foreground">Dépenses</th>
                <th className="p-4 text-xs font-medium uppercase text-muted-foreground">Statut</th>
                <th className="p-4 text-xs font-medium w-48 uppercase text-muted-foreground">Import</th>
              </tr>
            </thead>
            <tbody>
              {declarations.map((row) => (
                <tr
                  key={row.id}
                  className="border-b last:border-b-0 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-colors cursor-pointer"
                  onClick={() => setSidebarMonth(row.monthKey)}
                >
                  <td className="p-4 font-medium">{row.monthLabel}</td>
                  <td className="p-4 text-right">
{row.caHt != null ? (
                    <span className="font-medium">{formatCents(row.caHt)}</span>
                  ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {row.totalExpenses != null ? (
                      formatCents(row.totalExpenses)
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-4">{getStatusBadge(row)}</td>
                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                      {row.caHt == null && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setImportDialog({
                              open: true,
                              monthKey: row.monthKey,
                              type: "revenues",
                            })
                          }
                        >
                          <TrendingUpIcon className="size-4" />
                          Revenus
                        </Button>
                      )}
                      {row.totalExpenses == null && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setImportDialog({
                              open: true,
                              monthKey: row.monthKey,
                              type: "expenses",
                            })
                          }
                        >
                          <TrendingDownIcon className="size-4" />
                          Dépenses
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {importDialog && (
        <ImportCsvDialog
          open={importDialog.open}
          onOpenChange={(open) => !open && setImportDialog(null)}
          monthKey={importDialog.monthKey}
          type={importDialog.type}
          clients={clients}
          counterpartyMappings={counterpartyMappings}
          onSuccess={() => {
            fetchDeclarations();
            if (sidebarMonth === importDialog.monthKey) {
              setSidebarMonth(importDialog.monthKey);
            }
          }}
          onClientsRefresh={fetchClients}
        />
      )}

      {sidebarMonth && (
        <TaxDeclarationSidebar
          open={!!sidebarMonth}
          onOpenChange={(open) => {
            if (!open) setSidebarMonth(null);
          }}
          monthLabel={
            sidebarData?.monthLabel ??
            declarations.find((d) => d.monthKey === sidebarMonth)?.monthLabel ??
            sidebarMonth
          }
          summary={
            sidebarData?.summary ?? {
              totalRevenuesHt: 0,
              totalRevenuesTtc: 0,
              totalExpensesTtc: 0,
              totalExpensesHt: 0,
              totalExpensesVat: 0,
              vatCollected: 0,
              vatNet: 0,
              byClient: [],
            }
          }
          revenues={sidebarData?.revenues ?? []}
          expenses={sidebarData?.expenses ?? []}
          foreignSuppliers={sidebarData?.foreignSuppliers ?? []}
          onImportRevenues={() =>
            setImportDialog({
              open: true,
              monthKey: sidebarMonth,
              type: "revenues",
            })
          }
          onImportExpenses={() =>
            setImportDialog({
              open: true,
              monthKey: sidebarMonth,
              type: "expenses",
            })
          }
        />
      )}
    </div>
  );
}
