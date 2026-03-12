"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_CATEGORIES,
} from "@/lib/project-status";
import type { Project } from "@/types";
import type { ProjectStatus } from "@/types";

interface QontoClientPayload {
  id: string;
  qontoClientId: string | null;
}

interface QontoQuoteItem {
  id: string;
  number: string;
  status: string;
  amountHt: number | null;
  clientId: string | null;
  quoteUrl: string | null;
  attachmentId: string | null;
}

interface ProjectInformationFormProps {
  project: Project;
  onUpdated?: () => void;
  onCancel?: () => void;
  /** If true, show Cancel button (e.g. in dialog). */
  showCancel?: boolean;
}

/**
 * Form to view and edit project information (name, type, status, devis, URLs).
 * Used in the project page Information tab and in the edit dialog.
 */
export function ProjectInformationForm({
  project,
  onUpdated,
  onCancel,
  showCancel = false,
}: ProjectInformationFormProps) {
  /**
   * Formats a value stored in cents to a readable EUR amount.
   */
  function formatEuroFromCents(value: number | null): string {
    if (value == null) return "—";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(value / 100);
  }

  const [name, setName] = useState(project.name);
  const [type, setType] = useState<"SITE" | "SAAS">(project.type);
  const [status, setStatus] = useState<ProjectStatus>(
    (project.status ?? "PRODUCTION_WORKING") as ProjectStatus
  );
  const [devisReference, setDevisReference] = useState(
    project.devisReference ?? ""
  );
  const [qontoQuoteId, setQontoQuoteId] = useState(project.qontoQuoteId ?? "");
  const [quoteStatus, setQuoteStatus] = useState(project.quoteStatus ?? "");
  const [quoteAnnotation, setQuoteAnnotation] = useState(
    project.quoteAnnotation ?? ""
  );
  const [projectedAmountHt, setProjectedAmountHt] = useState(
    project.projectedAmountHt != null ? String(project.projectedAmountHt / 100) : ""
  );
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [quotes, setQuotes] = useState<QontoQuoteItem[]>([]);
  const [clientQontoId, setClientQontoId] = useState<string | null>(null);
  const [vercelUrl, setVercelUrl] = useState(project.vercelUrl ?? "");
  const [githubUrl, setGithubUrl] = useState(project.githubUrl ?? "");
  const [loading, setLoading] = useState(false);
  const selectedQuote =
    qontoQuoteId.trim().length > 0
      ? quotes.find((quote) => quote.id === qontoQuoteId) ?? null
      : null;

  useEffect(() => {
    setName(project.name);
    setType(project.type);
    setStatus((project.status ?? "PRODUCTION_WORKING") as ProjectStatus);
    setDevisReference(project.devisReference ?? "");
    setQontoQuoteId(project.qontoQuoteId ?? "");
    setQuoteStatus(project.quoteStatus ?? "");
    setQuoteAnnotation(project.quoteAnnotation ?? "");
    setProjectedAmountHt(
      project.projectedAmountHt != null ? String(project.projectedAmountHt / 100) : ""
    );
    setVercelUrl(project.vercelUrl ?? "");
    setGithubUrl(project.githubUrl ?? "");
  }, [project]);

  useEffect(() => {
    async function fetchClientQontoLink() {
      setClientQontoId(null);
      setQuotes([]);
      const res = await fetch(`/api/clients/${project.clientId}`);
      if (!res.ok) return;
      const data: QontoClientPayload = await res.json();
      setClientQontoId(data.qontoClientId ?? null);
    }
    fetchClientQontoLink();
  }, [project.clientId]);

  useEffect(() => {
    if (!clientQontoId || !qontoQuoteId.trim() || quotes.length > 0) return;
    loadQuotes();
  }, [clientQontoId, qontoQuoteId, quotes.length]);

  async function loadQuotes() {
    if (!clientQontoId) return;
    setQuotesLoading(true);
    try {
      const res = await fetch(
        `/api/qonto/quotes?clientId=${encodeURIComponent(clientQontoId)}`
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to load quotes");
      }
      const data = await res.json();
      setQuotes(Array.isArray(data.quotes) ? data.quotes : []);
    } catch {
      setQuotes([]);
    } finally {
      setQuotesLoading(false);
    }
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const parsedProjected = projectedAmountHt.trim()
        ? parseFloat(projectedAmountHt)
        : NaN;
      const projectedAmountHtValue =
        !Number.isNaN(parsedProjected) && parsedProjected >= 0
          ? Math.round(parsedProjected * 100)
          : null;

      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          status,
          devisReference: devisReference.trim() || null,
          qontoQuoteId: qontoQuoteId.trim() || null,
          quoteNumber: devisReference.trim() || null,
          quoteStatus: quoteStatus.trim() || null,
          quoteAmountHt: projectedAmountHtValue,
          quoteAnnotation: quoteAnnotation.trim() || null,
          projectedAmountHt: projectedAmountHtValue,
          vercelUrl: vercelUrl.trim() || null,
          githubUrl: githubUrl.trim() || null,
        }),
      });
      if (res.ok) {
        onUpdated?.();
      }
    } finally {
      setLoading(false);
    }
  }

  function handleDownloadQuotePdf(): void {
    const quoteId = qontoQuoteId.trim();
    if (!quoteId) return;
    const downloadUrl = `/api/qonto/quotes/${encodeURIComponent(quoteId)}/pdf`;
    window.open(downloadUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(e);
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="edit-name">Name</Label>
        <Input
          id="edit-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Project name"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Type</Label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="edit-type"
              value="SITE"
              checked={type === "SITE"}
              onChange={() => setType("SITE")}
            />
            Site
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="edit-type"
              value="SAAS"
              checked={type === "SAAS"}
              onChange={() => setType("SAAS")}
            />
            SaaS
          </label>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-status">Statut</Label>
        <select
          id="edit-status"
          value={status}
          onChange={(e) => setStatus(e.target.value as ProjectStatus)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <optgroup label="Production">
            {PROJECT_STATUS_CATEGORIES.PRODUCTION.map((s) => (
              <option key={s} value={s}>
                {PROJECT_STATUS_LABELS[s]}
              </option>
            ))}
          </optgroup>
          <optgroup label="Commercial">
            {PROJECT_STATUS_CATEGORIES.COMMERCIAL.map((s) => (
              <option key={s} value={s}>
                {PROJECT_STATUS_LABELS[s]}
              </option>
            ))}
          </optgroup>
          <optgroup label="Autre">
            {PROJECT_STATUS_CATEGORIES.OTHER.map((s) => (
              <option key={s} value={s}>
                {PROJECT_STATUS_LABELS[s]}
              </option>
            ))}
          </optgroup>
          <optgroup label="Terminé">
            {PROJECT_STATUS_CATEGORIES.CLOSED.map((s) => (
              <option key={s} value={s}>
                {PROJECT_STATUS_LABELS[s]}
              </option>
            ))}
          </optgroup>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-devis">Quote name</Label>
        <div className="flex gap-2">
          <Input
            id="edit-devis"
            value={devisReference}
            onChange={(e) => setDevisReference(e.target.value)}
            placeholder="D-XXXX-XX"
            className="flex-1"
          />
        </div>
        <div className="flex items-center gap-2">
          {selectedQuote?.quoteUrl ? (
            <a
              href={selectedQuote.quoteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center rounded-md border border-input px-3 text-sm hover:bg-accent"
            >
              Open link
            </a>
          ) : (
            <span className="text-xs text-muted-foreground">
              {quotesLoading ? "Loading quote link..." : "No quote link available"}
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadQuotePdf}
            disabled={!qontoQuoteId.trim()}
          >
            Download PDF
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Quote amount (fixed):{" "}
          {formatEuroFromCents(project.quoteAmountHt ?? project.projectedAmountHt)}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-quote-annotation">Annotation devis</Label>
        <Input
          id="edit-quote-annotation"
          value={quoteAnnotation}
          onChange={(e) => setQuoteAnnotation(e.target.value)}
          placeholder="Nom projet métier / note interne"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-projected">CA projeté HT (€)</Label>
        <Input
          id="edit-projected"
          type="number"
          step="0.01"
          min="0"
          value={projectedAmountHt}
          onChange={(e) => setProjectedAmountHt(e.target.value)}
          placeholder="0.00"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-vercel">Vercel URL</Label>
        <Input
          id="edit-vercel"
          type="text"
          value={vercelUrl}
          onChange={(e) => setVercelUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-github">GitHub URL</Label>
        <Input
          id="edit-github"
          type="text"
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>
      <div className="flex gap-2">
        {showCancel && onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
