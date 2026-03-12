"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusIcon } from "lucide-react";
import type { Client } from "@/types";

interface NewProjectDialogProps {
  clients: Client[];
  preselectedClientId?: string;
  onSuccess?: () => void;
}

interface QontoQuoteItem {
  id: string;
  number: string;
  status: string;
  amountHt: number | null;
  clientId: string | null;
}

export function NewProjectDialog({
  clients,
  preselectedClientId,
  onSuccess,
}: NewProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState(preselectedClientId ?? clients[0]?.id ?? "");
  const [name, setName] = useState("");
  const [type, setType] = useState<"SITE" | "SAAS">("SITE");
  const [devisReference, setDevisReference] = useState("");
  const [projectedAmountHt, setProjectedAmountHt] = useState("");
  const [qontoQuoteId, setQontoQuoteId] = useState<string | null>(null);
  const [quoteStatus, setQuoteStatus] = useState<string | null>(null);
  const [quoteAnnotation, setQuoteAnnotation] = useState("");
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<QontoQuoteItem[]>([]);
  const [vercelUrl, setVercelUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (clients.length && !clientId) {
      setClientId(preselectedClientId ?? clients[0].id);
    }
  }, [clients, clientId, preselectedClientId]);

  const selectedClient = clients.find((client) => client.id === clientId) ?? null;

  useEffect(() => {
    setQuotes([]);
    setQontoQuoteId(null);
    setDevisReference("");
    setQuoteStatus(null);
    setProjectedAmountHt("");
    setQuoteAnnotation("");
    setQuoteError(null);
  }, [clientId]);

  async function fetchQontoQuotesForClient() {
    if (!selectedClient?.qontoClientId) return;
    setQuoteLoading(true);
    setQuoteError(null);
    try {
      const res = await fetch(
        `/api/qonto/quotes?clientId=${encodeURIComponent(selectedClient.qontoClientId)}&portalClientId=${encodeURIComponent(selectedClient.id)}`
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to load quotes");
      }
      const data = await res.json();
      const nextQuotes: QontoQuoteItem[] = Array.isArray(data.quotes)
        ? data.quotes
        : [];
      setQuotes(nextQuotes);

      const firstQuote = nextQuotes[0];
      if (firstQuote) {
        setQontoQuoteId(firstQuote.id);
        setDevisReference(firstQuote.number);
        setQuoteStatus(firstQuote.status);
        setProjectedAmountHt(
          firstQuote.amountHt != null
            ? String((firstQuote.amountHt / 100).toFixed(2))
            : ""
        );
      } else {
        setQontoQuoteId(null);
      }
    } catch (error) {
      setQuotes([]);
      setQuoteError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setQuoteLoading(false);
    }
  }

  function selectQuoteById(quoteId: string) {
    const selectedQuote = quotes.find((quote) => quote.id === quoteId);
    if (!selectedQuote) return;
    setQontoQuoteId(selectedQuote.id);
    setDevisReference(selectedQuote.number);
    setQuoteStatus(selectedQuote.status);
    setProjectedAmountHt(
      selectedQuote.amountHt != null
        ? String((selectedQuote.amountHt / 100).toFixed(2))
        : ""
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId || !name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          name: name.trim(),
          type,
          devisReference: devisReference.trim() || null,
          projectedAmountHt: projectedAmountHt.trim()
            ? Math.round(parseFloat(projectedAmountHt) * 100)
            : null,
          qontoQuoteId,
          quoteNumber: devisReference.trim() || null,
          quoteStatus,
          quoteAmountHt: projectedAmountHt.trim()
            ? Math.round(parseFloat(projectedAmountHt) * 100)
            : null,
          quoteAnnotation: quoteAnnotation.trim() || null,
          vercelUrl: vercelUrl.trim() || undefined,
        }),
      });
      if (res.ok) {
        setName("");
        setDevisReference("");
        setProjectedAmountHt("");
        setQontoQuoteId(null);
        setQuoteStatus(null);
        setQuoteAnnotation("");
        setQuotes([]);
        setVercelUrl("");
        setOpen(false);
        onSuccess?.();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={clients.length === 0}>
          <PlusIcon className="size-4" />
          Nouveau projet
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau projet</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-client">Client</Label>
            <select
              id="project-client"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={clients.length === 0}
            >
              {clients.length === 0 ? (
                <option value="">Créez d&apos;abord un client</option>
              ) : (
                clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-name">Nom</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom du projet"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Devis Qonto</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={fetchQontoQuotesForClient}
                disabled={!selectedClient?.qontoClientId || quoteLoading}
              >
                {quoteLoading ? "Chargement..." : "Charger les devis"}
              </Button>
              {!selectedClient?.qontoClientId && (
                <p className="text-xs text-muted-foreground self-center">
                  Ce client n&apos;est pas lié à Qonto.
                </p>
              )}
            </div>
            {quoteError && (
              <p className="text-xs text-destructive">{quoteError}</p>
            )}
            {!quoteLoading &&
              !quoteError &&
              selectedClient?.qontoClientId &&
              quotes.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Aucun devis non attribue pour ce client.
                </p>
              )}
            <select
              value={qontoQuoteId ?? ""}
              onChange={(e) => selectQuoteById(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={quotes.length === 0}
            >
              <option value="">
                {quotes.length === 0
                  ? "Aucun devis chargé"
                  : "Sélectionner un devis"}
              </option>
              {quotes.map((quote) => (
                <option key={quote.id} value={quote.id}>
                  {quote.number} · {quote.status}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-devis-reference">Référence devis</Label>
            <Input
              id="project-devis-reference"
              value={devisReference}
              onChange={(e) => setDevisReference(e.target.value)}
              placeholder="ex: DE-2026-001"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-projected-amount">Montant HT devis (€)</Label>
            <Input
              id="project-projected-amount"
              type="number"
              step="0.01"
              min="0"
              value={projectedAmountHt}
              onChange={(e) => setProjectedAmountHt(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-quote-annotation">Annotation devis</Label>
            <Input
              id="project-quote-annotation"
              value={quoteAnnotation}
              onChange={(e) => setQuoteAnnotation(e.target.value)}
              placeholder="Nom projet métier / note interne"
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  value="SITE"
                  checked={type === "SITE"}
                  onChange={() => setType("SITE")}
                />
                Site
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  value="SAAS"
                  checked={type === "SAAS"}
                  onChange={() => setType("SAAS")}
                />
                SaaS
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-vercel">Lien Vercel (optionnel)</Label>
            <Input
              id="project-vercel"
              type="url"
              value={vercelUrl}
              onChange={(e) => setVercelUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Création..." : "Créer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
