"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Building2Icon, ChevronRightIcon } from "lucide-react";
import { ProjectActionsMenu } from "./project-actions-menu";
import type { Client, Project } from "@/types";

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
  const status = client.status ?? "ACTIVE";
  const projectStatus = project.status ?? "IN_PROGRESS";

  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-muted/30 group">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="flex min-w-0 shrink-0 items-center gap-3">
          <div className="size-9 shrink-0 overflow-hidden rounded-md bg-muted flex items-center justify-center">
            {client.logo ? (
              <img
                src={client.logo}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <Building2Icon className="size-4 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{client.name}</p>
            <Badge
              variant={status === "ACTIVE" ? "default" : "secondary"}
              className="text-xs"
            >
              {status === "ACTIVE" ? "Actif" : "Archivé"}
            </Badge>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Link
            href={`/project/${project.id}`}
            className="flex min-w-0 flex-1 items-center gap-2 py-1"
          >
            <span className="truncate font-medium">{project.name}</span>
            <Badge variant="secondary" className="text-xs shrink-0">
              {project.type}
            </Badge>
            {projectStatus === "CLOSED" && (
              <Badge variant="outline" className="text-xs shrink-0">
                Clôturé
              </Badge>
            )}
            <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        </div>
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
