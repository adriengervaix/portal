"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusIcon } from "lucide-react";
import { getFaviconUrlFromWebsite } from "@/lib/clients/favicon";

interface NewClientDialogProps {
  onSuccess?: () => void;
}

interface QontoClientSuggestion {
  id: string;
  name: string;
  email: string | null;
}

export function NewClientDialog({ onSuccess }: NewClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [qontoClientId, setQontoClientId] = useState<string | null>(null);
  const [status, setStatus] = useState<"ACTIVE" | "ARCHIVED">("ACTIVE");
  const [url, setUrl] = useState("");
  const [qontoQuery, setQontoQuery] = useState("");
  const [qontoLoading, setQontoLoading] = useState(false);
  const [qontoResults, setQontoResults] = useState<QontoClientSuggestion[]>([]);
  const [qontoError, setQontoError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function searchQontoClients() {
    setQontoLoading(true);
    setQontoError(null);
    try {
      const query = qontoQuery.trim();
      const res = await fetch(
        `/api/qonto/clients/search?q=${encodeURIComponent(query)}`
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to fetch Qonto clients");
      }
      const data = await res.json();
      setQontoResults(Array.isArray(data.clients) ? data.clients : []);
    } catch (error) {
      setQontoError(error instanceof Error ? error.message : "Unknown error");
      setQontoResults([]);
    } finally {
      setQontoLoading(false);
    }
  }

  function selectQontoClient(client: QontoClientSuggestion) {
    setQontoClientId(client.id);
    setName(client.name);
    if (!url.trim() && client.email) {
      setUrl(`mailto:${client.email}`);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const websiteUrl = url.trim();
      const faviconLogo = getFaviconUrlFromWebsite(websiteUrl);

      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          status,
          qontoClientId,
          url: websiteUrl || null,
          logo: faviconLogo,
        }),
      });
      if (res.ok) {
        setName("");
        setQontoClientId(null);
        setStatus("ACTIVE");
        setUrl("");
        setQontoQuery("");
        setQontoResults([]);
        setQontoError(null);
        setOpen(false);
        onSuccess?.();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="size-4" />
          Nouveau client
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="qonto-client-search">Importer depuis Qonto</Label>
            <div className="flex gap-2">
              <Input
                id="qonto-client-search"
                value={qontoQuery}
                onChange={(e) => setQontoQuery(e.target.value)}
                placeholder="Nom ou email"
              />
              <Button
                type="button"
                variant="outline"
                onClick={searchQontoClients}
                disabled={qontoLoading}
              >
                {qontoLoading ? "Recherche..." : "Rechercher"}
              </Button>
            </div>
            {qontoError && (
              <p className="text-xs text-destructive">{qontoError}</p>
            )}
            {qontoClientId && (
              <p className="text-xs text-muted-foreground">
                Client Qonto lié: {qontoClientId}
              </p>
            )}
            {qontoResults.length > 0 && (
              <div className="max-h-40 overflow-auto rounded-md border">
                {qontoResults.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => selectQontoClient(client)}
                  >
                    <span>{client.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {client.email ?? client.id}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-name">Nom</Label>
            <Input
              id="client-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom du client"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-url">URL</Label>
            <Input
              id="client-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground">
              Le logo sera automatiquement pris depuis le favicon du site.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Statut</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status"
                  value="ACTIVE"
                  checked={status === "ACTIVE"}
                  onChange={() => setStatus("ACTIVE")}
                />
                Actif
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status"
                  value="ARCHIVED"
                  checked={status === "ARCHIVED"}
                  onChange={() => setStatus("ARCHIVED")}
                />
                Archivé
              </label>
            </div>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Création..." : "Créer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
