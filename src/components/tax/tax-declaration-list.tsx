"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaxDeclarationSidebar } from "./tax-declaration-sidebar";
import { RefreshCwIcon } from "lucide-react";

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
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [sidebarMonth, setSidebarMonth] = useState<string | null>(null);
  const [projectedRevenue, setProjectedRevenue] = useState<number | null>(null);
  const [sidebarData, setSidebarData] = useState<{
    monthLabel: string;
    status: "OPEN" | "CLOSED" | "OVERDUE";
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
      vatAmount: number | null;
      clientId: string | null;
      clientName: string | null;
      reference: string | null;
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

  async function fetchProjectedRevenue() {
    const res = await fetch("/api/projects/projected-revenue");
    if (res.ok) {
      const data = await res.json();
      setProjectedRevenue(data.totalProjectedHt);
    }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/qonto/sync", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Sync failed");
      }
      await fetchDeclarations();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    fetchDeclarations();
    fetchProjectedRevenue();
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
        status: data.declaration?.status ?? decl?.status ?? "OPEN",
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
      {/* Sync + metric cards */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 flex-1">
          <div className="flex flex-col items-start text-left">
            <p className="text-4xl font-light">
              {totalCaHt != null ? formatCents(totalCaHt) : "—"}
            </p>
            <p className="text-base font-light text-muted-foreground mt-2">
              CA HT réalisé
            </p>
          </div>
          <div className="flex flex-col items-start text-left">
            <p className="text-4xl font-light">
              {projectedRevenue != null && projectedRevenue > 0
                ? formatCents(projectedRevenue)
                : "—"}
            </p>
            <p className="text-base font-light text-muted-foreground mt-2">
              CA projeté (devis)
            </p>
          </div>
          <div className="flex flex-col items-start text-left">
            <p className="text-4xl font-light">
              {totalExpenses != null ? formatCents(totalExpenses) : "—"}
            </p>
            <p className="text-base font-light text-muted-foreground mt-2">
              Dépenses totales
            </p>
          </div>
          <div className="flex flex-col items-start text-left">
            <p className="text-4xl font-light">{openCount}</p>
            <p className="text-base font-light text-muted-foreground mt-2">
              Déclarations ouvertes
            </p>
          </div>
        </div>
        <Button
          onClick={handleSync}
          disabled={syncing}
          variant="outline"
          className="shrink-0"
        >
          <RefreshCwIcon
            className={`size-4 mr-2 ${syncing ? "animate-spin" : ""}`}
          />
          {syncing ? "Sync…" : "Sync Qonto"}
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-auto rounded-lg bg-muted/30">
        <table className="w-full">
            <thead className="sticky top-0 bg-muted/60 backdrop-blur-sm z-10">
              <tr className="border-b border-border">
                <th className="text-left p-4 text-xs font-medium uppercase text-muted-foreground">Mois</th>
                <th className="text-right p-4 text-xs font-medium uppercase text-muted-foreground">CA HT</th>
                <th className="text-right p-4 text-xs font-medium uppercase text-muted-foreground">Dépenses</th>
                <th className="p-4 text-xs font-medium uppercase text-muted-foreground">Statut</th>
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
                </tr>
              ))}
            </tbody>
        </table>
      </div>

      {sidebarMonth && (
        <TaxDeclarationSidebar
          open={!!sidebarMonth}
          onOpenChange={(open) => {
            if (!open) setSidebarMonth(null);
          }}
          monthKey={sidebarMonth}
          monthLabel={
            sidebarData?.monthLabel ??
            declarations.find((d) => d.monthKey === sidebarMonth)?.monthLabel ??
            sidebarMonth
          }
          status={
            sidebarData?.status ??
            declarations.find((d) => d.monthKey === sidebarMonth)?.status ??
            "OPEN"
          }
          onStatusChange={(newStatus) => {
            fetchDeclarations();
            setSidebarData((prev) =>
              prev ? { ...prev, status: newStatus } : null
            );
          }}
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
        />
      )}
    </div>
  );
}
