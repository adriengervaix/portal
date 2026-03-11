"use client";

import { useEffect, useState } from "react";
import { ProjectLine } from "./project-line";
import { NewProjectDialog } from "./new-project-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getStatusCategory } from "@/lib/project-status";
import type { Client } from "@/types";

type ProjectStatusFilter = "PRODUCTION" | "COMMERCIAL" | "CLOSED";

const SECTION_LABELS = {
  PRODUCTION: "Production",
  COMMERCIAL: "Commercial",
  CLOSED: "Terminé",
} as const;

/** Statuses to exclude (prospection, on hold, paused). */
const EXCLUDED_STATUSES = ["PROSPECT", "ON_HOLD", "PAUSED"] as const;

export function ClientList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] =
    useState<ProjectStatusFilter>("PRODUCTION");

  async function fetchClients() {
    const res = await fetch("/api/clients");
    if (res.ok) {
      const data = await res.json();
      setClients(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchClients();
  }, []);

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    if (!q) return true;
    if (c.name.toLowerCase().includes(q)) return true;
    const projectMatch = c.projects?.some(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q)
    );
    return !!projectMatch;
  });

  const clientsToShow = filtered
    .map((c) => {
      const projects = (c.projects ?? []).filter(
        (p) => !EXCLUDED_STATUSES.includes(p.status as (typeof EXCLUDED_STATUSES)[number])
      );
      const displayProjects = projects.filter((p) => {
        const category = getStatusCategory(
          (p.status ?? "PRODUCTION_WORKING") as import("@/types").ProjectStatus
        );
        return category === projectStatusFilter;
      });
      return { ...c, displayProjects };
    })
    .filter((c) => c.displayProjects.length > 0);

  const projectLines = clientsToShow.flatMap((client) =>
    client.displayProjects.map((project) => ({ client, project }))
  );

  const sections = [
    { key: "PRODUCTION" as const, label: SECTION_LABELS.PRODUCTION },
    { key: "COMMERCIAL" as const, label: SECTION_LABELS.COMMERCIAL },
    { key: "CLOSED" as const, label: SECTION_LABELS.CLOSED },
  ];

  const linesBySection = sections.map(({ key, label }) => ({
    key,
    label,
    lines: projectLines.filter(
      ({ project }) => getStatusCategory(project.status ?? "PRODUCTION_WORKING") === key
    ),
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 sm:justify-between">
        <div className="flex flex-nowrap items-center gap-2">
          <Input
            placeholder="Rechercher par client ou projet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm shrink-0"
          />
          <div className="flex shrink-0 gap-1" role="group" aria-label="Filtrer par statut projet">
            <Button
              variant={
                projectStatusFilter === "PRODUCTION" ? "default" : "outline"
              }
              size="sm"
              onClick={() => setProjectStatusFilter("PRODUCTION")}
            >
              Production
            </Button>
            <Button
              variant={
                projectStatusFilter === "COMMERCIAL" ? "default" : "outline"
              }
              size="sm"
              onClick={() => setProjectStatusFilter("COMMERCIAL")}
            >
              Commercial
            </Button>
            <Button
              variant={projectStatusFilter === "CLOSED" ? "default" : "outline"}
              size="sm"
              onClick={() => setProjectStatusFilter("CLOSED")}
            >
              Terminé
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <NewProjectDialog
            clients={clients}
            onSuccess={fetchClients}
          />
        </div>
      </div>

      {projectLines.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          {clientsToShow.length === 0
            ? "Aucun client. Créez un client pour commencer."
            : "Aucun projet à afficher pour les filtres sélectionnés."}
        </p>
      ) : (
        <div className="space-y-6">
          {linesBySection.map(
            ({ key, label, lines }) =>
              lines.length > 0 && (
                <section key={key} className="space-y-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {label}
                  </h2>
                  <div className="space-y-2">
                    {lines.map(({ client, project }) => (
                      <ProjectLine
                        key={project.id}
                        client={client}
                        project={project}
                        onProjectUpdated={fetchClients}
                      />
                    ))}
                  </div>
                </section>
              )
          )}
        </div>
      )}
    </div>
  );
}
