"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  parseQontoCsv,
  detectDominantMonth,
  type QontoCsvRow,
} from "@/lib/tax/parse-qonto-csv";
import { formatMonthLabel } from "@/lib/tax/declaration-utils";
import { UploadIcon, FileTextIcon } from "lucide-react";
import type { Client } from "@/types";

interface ImportCsvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  monthKey: string;
  type: "revenues" | "expenses";
  clients: Client[];
  counterpartyMappings: Array<{ counterpartyName: string; clientId: string }>;
  onSuccess: () => void;
  onClientsRefresh?: () => void;
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

/**
 * Dialog for importing Qonto CSV (revenues or expenses).
 * Parses file client-side, shows summary, allows client attribution for revenues.
 */
export function ImportCsvDialog({
  open,
  onOpenChange,
  monthKey,
  type,
  clients,
  counterpartyMappings,
  onSuccess,
  onClientsRefresh,
}: ImportCsvDialogProps): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<QontoCsvRow[]>([]);
  const [detectedMonth, setDetectedMonth] = useState<string | null>(null);
  const [clientAssignments, setClientAssignments] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newClientFor, setNewClientFor] = useState<string | null>(null);
  const [newClientName, setNewClientName] = useState("");

  const mappingByCounterparty = new Map(
    counterpartyMappings.map((m) => [m.counterpartyName.toLowerCase(), m.clientId])
  );

  function resolveClient(name: string): string | null {
    return mappingByCounterparty.get(name.toLowerCase().trim()) ?? null;
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const content = reader.result as string;
        let parsed = parseQontoCsv(content);
        if (type === "expenses") {
          parsed = parsed.filter(
            (r) => !r.counterpartyName.toUpperCase().includes("DGFIP")
          );
        }
        if (parsed.length === 0) {
          setError("Aucune ligne valide trouvée dans le fichier");
          return;
        }
        const dominant = detectDominantMonth(parsed.map((r) => r.date));
        setDetectedMonth(dominant);
        setRows(parsed);

        const assignments: Record<string, string> = {};
        for (const r of parsed) {
          const clientId = resolveClient(r.counterpartyName);
          if (clientId) assignments[r.counterpartyName] = clientId;
        }
        setClientAssignments(assignments);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de parsing");
      }
    };
    reader.readAsText(file, "utf-8");
    e.target.value = "";
  }

  async function handleConfirm() {
    if (rows.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const payload = {
        monthKey,
        [type === "revenues" ? "revenues" : "expenses"]:
          type === "revenues"
            ? rows.map((r) => ({
                date: r.date,
                counterpartyName: r.counterpartyName,
                amountTtc: r.amountTtc,
                amountHt: r.amountHt,
              }))
            : rows.map((r) => ({
                date: r.date,
                counterpartyName: r.counterpartyName,
                amountTtc: r.amountTtc,
                amountHt: r.amountHt,
              })),
        [type === "revenues" ? "expenses" : "revenues"]: [],
        confirm: true,
        clientAssignments: type === "revenues" ? clientAssignments : {},
      };

      const res = await fetch(`/api/tax/declarations/${monthKey}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Erreur lors de l'import");
      }
      onSuccess();
      onOpenChange(false);
      setRows([]);
      setDetectedMonth(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setRows([]);
      setError(null);
      setDetectedMonth(null);
    }
    onOpenChange(next);
  }

  const totalHt = rows.reduce((s, r) => s + r.amountHt, 0);
  const totalTtc = rows.reduce((s, r) => s + r.amountTtc, 0);

  const monthMismatch =
    detectedMonth && detectedMonth !== monthKey;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            Import {type === "revenues" ? "revenus" : "dépenses"} —{" "}
            {formatMonthLabel(monthKey)}
          </DialogTitle>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
        />

        {rows.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sélectionnez votre fichier CSV exporté depuis Qonto.
            </p>
            <Button
              onClick={() => inputRef.current?.click()}
              variant="outline"
              className="w-full"
            >
              <UploadIcon className="size-4" />
              Choisir le fichier {type === "revenues" ? "revenus" : "dépenses"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {monthMismatch && (
              <div className="rounded-md bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
                ⚠️ Les dates du fichier correspondent majoritairement à{" "}
                {detectedMonth && formatMonthLabel(detectedMonth)}. Vous importez
                pour {formatMonthLabel(monthKey)}.
              </div>
            )}

            <div className="rounded-lg border p-4 space-y-2">
              <p className="font-medium">
                {rows.length} ligne{rows.length > 1 ? "s" : ""} détectée
                {rows.length > 1 ? "s" : ""}
              </p>
              <p>
                Total HT : <strong>{formatCents(totalHt)}</strong>
              </p>
              <p>
                Total TTC : <strong>{formatCents(totalTtc)}</strong>
              </p>
            </div>

            {type === "revenues" && clients.length > 0 && (
              <div className="max-h-48 overflow-y-auto rounded border p-2 space-y-1">
                <Label className="text-xs">Attribution clients</Label>
                {Array.from(
                  new Set(rows.map((r) => r.counterpartyName))
                ).map((name) => (
                  <div
                    key={name}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="truncate flex-1 min-w-0">{name}</span>
                    <div className="flex gap-1 min-w-[180px]">
                      {newClientFor === name ? (
                        <>
                          <input
                            type="text"
                            value={newClientName}
                            onChange={(e) => setNewClientName(e.target.value)}
                            placeholder="Nom du client"
                            className="rounded border px-2 py-1 text-sm flex-1"
                            autoFocus
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={async () => {
                              if (!newClientName.trim()) return;
                              const res = await fetch("/api/clients", {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                  name: newClientName.trim(),
                                  status: "ACTIVE",
                                }),
                              });
                              if (res.ok) {
                                const client = await res.json();
                                setClientAssignments((prev) => ({
                                  ...prev,
                                  [name]: client.id,
                                }));
                                setNewClientFor(null);
                                setNewClientName("");
                                onClientsRefresh?.();
                              }
                            }}
                          >
                            Créer
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setNewClientFor(null);
                              setNewClientName("");
                            }}
                          >
                            Annuler
                          </Button>
                        </>
                      ) : (
                        <select
                          value={clientAssignments[name] ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "__new__") {
                              setNewClientFor(name);
                              setNewClientName("");
                            } else {
                              setClientAssignments((prev) => ({
                                ...prev,
                                [name]: val,
                              }));
                            }
                          }}
                          className="rounded border px-2 py-1 text-sm flex-1"
                        >
                          <option value="">— Non attribué</option>
                          {clients.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                          <option value="__new__">+ Nouveau client</option>
                        </select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => inputRef.current?.click()}
              >
                <FileTextIcon className="size-4" />
                Autre fichier
              </Button>
              <Button onClick={handleConfirm} disabled={loading}>
                {loading ? "Enregistrement..." : "Confirmer"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
