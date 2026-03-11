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
  const [name, setName] = useState(project.name);
  const [type, setType] = useState<"SITE" | "SAAS">(project.type);
  const [status, setStatus] = useState<ProjectStatus>(
    (project.status ?? "PRODUCTION_WORKING") as ProjectStatus
  );
  const [devisReference, setDevisReference] = useState(
    project.devisReference ?? ""
  );
  const [projectedAmountHt, setProjectedAmountHt] = useState(
    project.projectedAmountHt != null ? String(project.projectedAmountHt / 100) : ""
  );
  const [devisFetching, setDevisFetching] = useState(false);
  const [vercelUrl, setVercelUrl] = useState(project.vercelUrl ?? "");
  const [githubUrl, setGithubUrl] = useState(project.githubUrl ?? "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(project.name);
    setType(project.type);
    setStatus((project.status ?? "PRODUCTION_WORKING") as ProjectStatus);
    setDevisReference(project.devisReference ?? "");
    setProjectedAmountHt(
      project.projectedAmountHt != null ? String(project.projectedAmountHt / 100) : ""
    );
    setVercelUrl(project.vercelUrl ?? "");
    setGithubUrl(project.githubUrl ?? "");
  }, [project]);

  function normalizeDevisRef(ref: string): string {
    const trimmed = ref.trim();
    const digits = trimmed.replace(/\D/g, "");
    if (!digits) return trimmed;
    return `devis-${digits.padStart(3, "0")}`;
  }

  async function fetchDevisAmount() {
    if (!devisReference.trim()) return;
    setDevisFetching(true);
    try {
      const ref = normalizeDevisRef(devisReference);
      const res = await fetch(
        `/api/qonto/devis/amount?ref=${encodeURIComponent(ref)}`
      );
      const data = await res.json();
      if (data.found && typeof data.amountHt === "number") {
        setProjectedAmountHt(String((data.amountHt / 100).toFixed(2)));
      }
    } finally {
      setDevisFetching(false);
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
        <Label htmlFor="edit-devis">Réf. devis</Label>
        <div className="flex gap-2">
          <Input
            id="edit-devis"
            value={devisReference}
            onChange={(e) => setDevisReference(e.target.value)}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v && /^\d+$/.test(v.replace(/\D/g, ""))) {
                setDevisReference(normalizeDevisRef(v));
              }
            }}
            placeholder="003 (→ devis-003)"
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchDevisAmount}
            disabled={!devisReference.trim() || devisFetching}
          >
            {devisFetching ? "..." : "Qonto"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Saisissez 003 pour devis-003. Cliquez Qonto pour récupérer le montant.
        </p>
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
