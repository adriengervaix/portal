"use client";

import { useState, useEffect } from "react";
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
import type { Client } from "@/types";

interface NewProjectDialogProps {
  clients: Client[];
  preselectedClientId?: string;
  onSuccess?: () => void;
}

export function NewProjectDialog({
  clients,
  preselectedClientId,
  onSuccess,
}: NewProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState(preselectedClientId ?? clients[0]?.id ?? "");
  const [name, setName] = useState("");
  const [type, setType] = useState<"SITE" | "SAAS">("SITE");
  const [vercelUrl, setVercelUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (clients.length && !clientId) {
      setClientId(preselectedClientId ?? clients[0].id);
    }
  }, [clients, clientId, preselectedClientId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId || !name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          name: name.trim(),
          type,
          vercelUrl: vercelUrl.trim() || undefined,
        }),
      });
      if (res.ok) {
        setName("");
        setVercelUrl("");
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
        <Button variant="outline" disabled={clients.length === 0}>
          <PlusIcon className="size-4" />
          Nouveau projet
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau projet</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-client">Client</Label>
            <select
              id="project-client"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={clients.length === 0}
            >
              {clients.length === 0 ? (
                <option value="">Créez d&apos;abord un client</option>
              ) : (
                clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-name">Nom</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom du projet"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  value="SITE"
                  checked={type === "SITE"}
                  onChange={() => setType("SITE")}
                />
                Site
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  value="SAAS"
                  checked={type === "SAAS"}
                  onChange={() => setType("SAAS")}
                />
                SaaS
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-vercel">Lien Vercel (optionnel)</Label>
            <Input
              id="project-vercel"
              type="url"
              value={vercelUrl}
              onChange={(e) => setVercelUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Création..." : "Créer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
