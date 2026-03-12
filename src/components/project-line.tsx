"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Building2Icon } from "lucide-react";
import { ProjectActionsMenu } from "./project-actions-menu";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_CATEGORIES,
} from "@/lib/project-status";
import { getFaviconUrlFromWebsite } from "@/lib/clients/favicon";
import type { Client, Project } from "@/types";
import type { ProjectStatus } from "@/types";

interface ProjectLineProps {
  client: Client;
  project: Project;
  onProjectUpdated?: () => void;
}

/**
 * Renders a single project as a row (one line = one project).
 * Used when a client has multiple projects, each displayed on its own line.
 */
export function ProjectLine({
  client,
  project,
  onProjectUpdated,
}: ProjectLineProps) {
  const clientLogoUrl =
    client.logo ?? getFaviconUrlFromWebsite(client.url ?? "") ?? null;
  const [status, setStatus] = useState<ProjectStatus>(
    (project.status ?? "PRODUCTION_WORKING") as ProjectStatus
  );
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    setStatus((project.status ?? "PRODUCTION_WORKING") as ProjectStatus);
  }, [project.status]);

  async function handleStatusChange(newStatus: ProjectStatus) {
    setStatus(newStatus);
    setUpdating(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        onProjectUpdated?.();
      } else {
        setStatus(project.status ?? "PRODUCTION_WORKING");
      }
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card px-4 py-2 transition-colors hover:bg-muted/30 group">
      <Link
        href={`/project/${project.id}`}
        className="grid min-w-0 flex-1 grid-cols-[1fr_1fr] items-center gap-6 py-0.5"
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium">{project.name}</span>
        </div>
        <div className="flex min-w-0 items-center gap-3">
          <div className="size-5 shrink-0 overflow-hidden rounded-md flex items-center justify-center">
            {clientLogoUrl ? (
              <img
                src={clientLogoUrl}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <Building2Icon className="size-4 text-muted-foreground" />
            )}
          </div>
          <p className="truncate text-sm font-medium">{client.name}</p>
        </div>
      </Link>
      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
        <Select
          value={status}
          onValueChange={(value) => handleStatusChange(value as ProjectStatus)}
          disabled={updating}
        >
          <SelectTrigger className="h-auto w-fit py-4 [&_svg]:hidden">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end" position="popper">
            <SelectGroup>
              <SelectLabel>Production</SelectLabel>
              {PROJECT_STATUS_CATEGORIES.PRODUCTION.map((s) => (
                <SelectItem key={s} value={s}>
                  {PROJECT_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Commercial</SelectLabel>
              {PROJECT_STATUS_CATEGORIES.COMMERCIAL.map((s) => (
                <SelectItem key={s} value={s}>
                  {PROJECT_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Terminé</SelectLabel>
              {PROJECT_STATUS_CATEGORIES.CLOSED.map((s) => (
                <SelectItem key={s} value={s}>
                  {PROJECT_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div
        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        onClick={(e) => e.preventDefault()}
      >
        <ProjectActionsMenu
          project={project}
          onUpdated={onProjectUpdated}
          compact
        />
      </div>
    </div>
  );
}
