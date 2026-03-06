"use client";

import { useEffect, useState } from "react";
import { ClientCard } from "./client-card";
import { NewClientDialog } from "./new-client-dialog";
import { NewProjectDialog } from "./new-project-dialog";
import { Input } from "@/components/ui/input";
import type { Client } from "@/types";

export function ClientList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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
        <Input
          placeholder="Rechercher par client ou projet..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-2">
          <NewClientDialog onSuccess={fetchClients} />
          <NewProjectDialog
            clients={clients}
            onSuccess={fetchClients}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          Aucun client. Créez un client pour commencer.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}
    </div>
  );
}
