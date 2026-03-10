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

interface NewClientDialogProps {
  onSuccess?: () => void;
}

export function NewClientDialog({ onSuccess }: NewClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "ARCHIVED">("ACTIVE");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          logo: logo.trim() || undefined,
          status,
          url: url.trim() || undefined,
        }),
      });
      if (res.ok) {
        setName("");
        setLogo("");
        setStatus("ACTIVE");
        setUrl("");
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
            <Label htmlFor="client-logo">Logo (URL)</Label>
            <Input
              id="client-logo"
              type="url"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              placeholder="https://..."
            />
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
          <div className="space-y-2">
            <Label htmlFor="client-url">URL</Label>
            <Input
              id="client-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
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
