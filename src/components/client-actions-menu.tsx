"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
  ExternalLinkIcon,
} from "lucide-react";
import type { Client } from "@/types";
import { getFaviconUrlFromWebsite } from "@/lib/clients/favicon";

interface ClientActionsMenuProps {
  client: Client;
  onUpdated?: () => void;
}

/**
 * Dropdown menu with client actions: Edit, Open URL, Delete.
 */
export function ClientActionsMenu({
  client,
  onUpdated,
}: ClientActionsMenuProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [name, setName] = useState(client.name);
  const [status, setStatus] = useState<"ACTIVE" | "ARCHIVED">(
    client.status ?? "ACTIVE"
  );
  const [url, setUrl] = useState(client.url ?? "");
  const [loading, setLoading] = useState(false);

  function openEdit() {
    setName(client.name);
    setStatus((client.status ?? "ACTIVE") as "ACTIVE" | "ARCHIVED");
    setUrl(client.url ?? "");
    setEditOpen(true);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const websiteUrl = url.trim();
      const faviconLogo = getFaviconUrlFromWebsite(websiteUrl);

      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          status,
          url: websiteUrl || null,
          logo: faviconLogo,
        }),
      });
      if (res.ok) {
        setEditOpen(false);
        onUpdated?.();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteOpen(false);
        onUpdated?.();
        router.push("/clients");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8 shrink-0">
            <MoreHorizontalIcon className="size-4" />
            <span className="sr-only">Client actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); openEdit(); }}>
            <PencilIcon className="size-4" />
            Edit
          </DropdownMenuItem>
          {client.url && (
            <DropdownMenuItem asChild>
              <Link
                href={client.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLinkIcon className="size-4" />
                Open URL
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => { e.preventDefault(); setDeleteOpen(true); }}
            className="text-destructive focus:text-destructive"
          >
            <Trash2Icon className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit client</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Client name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="edit-status"
                    value="ACTIVE"
                    checked={status === "ACTIVE"}
                    onChange={() => setStatus("ACTIVE")}
                  />
                  Actif
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="edit-status"
                    value="ARCHIVED"
                    checked={status === "ARCHIVED"}
                    onChange={() => setStatus("ARCHIVED")}
                  />
                  Archivé
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-url">URL</Label>
              <Input
                id="edit-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
              />
              <p className="text-xs text-muted-foreground">
                Le logo sera automatiquement pris depuis le favicon du site.
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete client</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete &quot;{client.name}&quot;? This
              will also delete all associated projects and categories. This
              action cannot be undone.
            </p>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
