"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2Icon, ChevronRightIcon } from "lucide-react";
import { ProjectActionsMenu } from "./project-actions-menu";
import type { Client } from "@/types";

interface ClientCardProps {
  client: Client;
  /** Projects to display (e.g. filtered by status). Falls back to client.projects if not provided. */
  displayProjects?: Client["projects"];
  onProjectUpdated?: () => void;
}

export function ClientCard({
  client,
  displayProjects,
  onProjectUpdated,
}: ClientCardProps) {
  const projects = displayProjects ?? client.projects ?? [];
  const status = client.status ?? "ACTIVE";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-muted flex items-center justify-center">
            {client.logo ? (
              <img
                src={client.logo}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <Building2Icon className="size-5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-medium truncate">{client.name}</h2>
            <Badge
              variant={status === "ACTIVE" ? "default" : "secondary"}
              className="text-xs mt-0.5"
            >
              {status === "ACTIVE" ? "Actif" : "Archivé"}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              {(() => {
                const projects = client.projects ?? [];
                const inProgress = projects.filter(
                  (p) => (p.status ?? "IN_PROGRESS") === "IN_PROGRESS"
                ).length;
                const closed = projects.filter(
                  (p) => (p.status ?? "IN_PROGRESS") === "CLOSED"
                ).length;
                return (
                  <>
                    {inProgress} en cours
                    {closed > 0 && ` · ${closed} clôturé${closed > 1 ? "s" : ""}`}
                  </>
                );
              })()}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun projet</p>
        ) : (
          <ul className="space-y-1">
            {projects.map((project) => (
              <li key={project.id}>
                <div className="flex items-center gap-1 rounded-md p-2 hover:bg-muted/50 transition-colors group">
                  <Link
                    href={`/project/${project.id}`}
                    className="flex flex-1 items-center justify-between min-w-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium truncate">{project.name}</span>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {project.type}
                      </Badge>
                      {(project.status ?? "IN_PROGRESS") === "CLOSED" && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          Clôturé
                        </Badge>
                      )}
                    </div>
                    <ChevronRightIcon className="size-4 text-muted-foreground shrink-0 ml-2" />
                  </Link>
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
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
