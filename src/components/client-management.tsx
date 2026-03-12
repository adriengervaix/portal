"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeftIcon, Building2Icon, ExternalLinkIcon, PlusIcon } from "lucide-react";
import { NewClientDialog } from "./new-client-dialog";
import { ClientActionsMenu } from "./client-actions-menu";
import type { Client } from "@/types";
import { getFaviconUrlFromWebsite } from "@/lib/clients/favicon";

type ClientStatusFilter = "ALL" | "ACTIVE" | "ARCHIVED";

/**
 * Client management view: list of clients with logo, name, status, URL.
 */
export function ClientManagement() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [clientStatusFilter, setClientStatusFilter] =
    useState<ClientStatusFilter>("ACTIVE");

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
    if (clientStatusFilter === "ALL") return true;
    return (c.status ?? "ACTIVE") === clientStatusFilter;
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
            aria-label="Filtrer par statut client"
          >
            <Button
              variant={clientStatusFilter === "ALL" ? "default" : "outline"}
              size="sm"
              onClick={() => setClientStatusFilter("ALL")}
            >
              Tous
            </Button>
            <Button
              variant={
                clientStatusFilter === "ACTIVE" ? "default" : "outline"
              }
              size="sm"
              onClick={() => setClientStatusFilter("ACTIVE")}
            >
              Actif
            </Button>
            <Button
              variant={
                clientStatusFilter === "ARCHIVED" ? "default" : "outline"
              }
              size="sm"
              onClick={() => setClientStatusFilter("ARCHIVED")}
            >
              Archivé
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {clientsToShow.map((client) => (
            <Card key={client.id} className="overflow-hidden py-4 gap-2">
              <div className="p-0">
                <div className="flex items-start gap-3 px-3 py-0">
                  <div className="size-6 shrink-0 overflow-hidden rounded-lg flex items-center justify-center">
                    {client.logo || getFaviconUrlFromWebsite(client.url ?? "") ? (
                      <img
                        src={client.logo ?? getFaviconUrlFromWebsite(client.url ?? "") ?? ""}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <Building2Icon className="size-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-normal truncate">{client.name}</h3>
                          {client.url && (
                            <a
                              href={
                                client.url.startsWith("http")
                                  ? client.url
                                  : `https://${client.url}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary"
                              aria-label={`Open ${client.name} website`}
                            >
                              <ExternalLinkIcon className="size-3 shrink-0" />
                            </a>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(() => {
                            const projects = client.projects ?? [];
                            const inProgress = projects.filter(
                              (p) => (p.status ?? "PRODUCTION_WORKING") !== "CLOSED"
                            ).length;
                            const closed = projects.filter(
                              (p) => (p.status ?? "PRODUCTION_WORKING") === "CLOSED"
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
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
