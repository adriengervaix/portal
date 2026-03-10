"use client";

import { useEffect, useState } from "react";
import { ProjectLine } from "./project-line";
import { NewClientDialog } from "./new-client-dialog";
import { NewProjectDialog } from "./new-project-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Client } from "@/types";

type ProjectStatusFilter = "ALL" | "IN_PROGRESS" | "CLOSED";

export function ClientList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] =
    useState<ProjectStatusFilter>("ALL");

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
      const projects = c.projects ?? [];
      const displayProjects =
        projectStatusFilter === "ALL"
          ? projects
          : projects.filter(
              (p) => (p.status ?? "IN_PROGRESS") === projectStatusFilter
            );
      return { ...c, displayProjects };
    })
    .filter((c) => c.displayProjects.length > 0 || projectStatusFilter === "ALL");

  const projectLines = clientsToShow.flatMap((client) =>
    client.displayProjects.map((project) => ({ client, project }))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Rechercher par client ou projet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <div className="flex gap-1" role="group" aria-label="Filtrer par statut projet">
            <Button
              variant={projectStatusFilter === "ALL" ? "default" : "outline"}
              size="sm"
              onClick={() => setProjectStatusFilter("ALL")}
            >
              Tous
            </Button>
            <Button
              variant={
                projectStatusFilter === "IN_PROGRESS" ? "default" : "outline"
              }
              size="sm"
              onClick={() => setProjectStatusFilter("IN_PROGRESS")}
            >
              En cours
            </Button>
            <Button
              variant={projectStatusFilter === "CLOSED" ? "default" : "outline"}
              size="sm"
              onClick={() => setProjectStatusFilter("CLOSED")}
            >
              Clôturés
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <NewClientDialog onSuccess={fetchClients} />
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
        <div className="space-y-2">
          {projectLines.map(({ client, project }) => (
            <ProjectLine
              key={project.id}
              client={client}
              project={project}
              onProjectUpdated={fetchClients}
            />
          ))}
        </div>
      )}
    </div>
  );
}
