"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeftIcon,
  Building2Icon,
  ExternalLinkIcon,
  PlusIcon,
} from "lucide-react";
import { NewClientDialog } from "./new-client-dialog";
import { ClientActionsMenu } from "./client-actions-menu";
import type { Client } from "@/types";

type ProjectStatusFilter = "ALL" | "IN_PROGRESS" | "CLOSED";

function formatUrlDisplay(url: string): string {
  try {
    const parsed = new URL(
      url.startsWith("http") ? url : `https://${url}`
    );
    return parsed.hostname;
  } catch {
    return url.length > 30 ? `${url.slice(0, 30)}…` : url;
  }
}

/**
 * Client management view: list of clients with logo, name, status, URL.
 */
export function ClientManagement() {
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
    if (c.url?.toLowerCase().includes(q)) return true;
    const statusLabel = c.status === "ACTIVE" ? "actif" : "archivé";
    if (statusLabel.includes(q)) return true;
    return false;
  });

  const clientsToShow = filtered.filter((c) => {
    if (projectStatusFilter === "ALL") return true;
    const projects = c.projects ?? [];
    const hasMatching = projects.some(
      (p) => (p.status ?? "IN_PROGRESS") === projectStatusFilter
    );
    return hasMatching;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeftIcon className="size-4" />
            </Link>
          </Button>
          <Input
            placeholder="Rechercher un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <div
            className="flex gap-1"
            role="group"
            aria-label="Filtrer par statut projet"
          >
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
        <NewClientDialog onSuccess={fetchClients} />
      </div>

      {clientsToShow.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2Icon className="size-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Aucun client. Créez un client pour commencer.
            </p>
            <NewClientDialog onSuccess={fetchClients} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clientsToShow.map((client) => (
            <Card key={client.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-start gap-4 p-4">
                  <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                    {client.logo ? (
                      <img
                        src={client.logo}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <Building2Icon className="size-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold truncate">{client.name}</h3>
                        <Badge
                          variant={
                            client.status === "ACTIVE" ? "default" : "secondary"
                          }
                          className="mt-1 text-xs"
                        >
                          {client.status === "ACTIVE" ? "Actif" : "Archivé"}
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
                      <ClientActionsMenu
                        client={client}
                        onUpdated={fetchClients}
                      />
                    </div>
                    {client.url && (
                      <a
                        href={
                          client.url.startsWith("http")
                            ? client.url
                            : `https://${client.url}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline truncate block"
                      >
                        {formatUrlDisplay(client.url)}
                        <ExternalLinkIcon className="size-3 shrink-0" />
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
