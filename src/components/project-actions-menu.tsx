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
import type { Project } from "@/types";

interface ProjectActionsMenuProps {
  project: Project;
  /** Called after rename, edit, or delete. For delete, redirect happens so this may not run. */
  onUpdated?: () => void;
  /** If true, show compact trigger (icon only). If false, show next to project name. */
  compact?: boolean;
}

/**
 * Dropdown menu with project actions: Rename, Edit, Open in new tab, Delete.
 */
export function ProjectActionsMenu({
  project,
  onUpdated,
  compact = true,
}: ProjectActionsMenuProps) {
  const router = useRouter();
  const [renameOpen, setRenameOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [name, setName] = useState(project.name);
  const [type, setType] = useState<"SITE" | "SAAS">(project.type);
  const [status, setStatus] = useState<"IN_PROGRESS" | "CLOSED">(
    (project.status ?? "IN_PROGRESS") as "IN_PROGRESS" | "CLOSED"
  );
  const [vercelUrl, setVercelUrl] = useState(project.vercelUrl ?? "");
  const [githubUrl, setGithubUrl] = useState(project.githubUrl ?? "");
  const [loading, setLoading] = useState(false);

  function openRename() {
    setName(project.name);
    setRenameOpen(true);
  }

  function openEdit() {
    setName(project.name);
    setType(project.type);
    setStatus((project.status ?? "IN_PROGRESS") as "IN_PROGRESS" | "CLOSED");
    setVercelUrl(project.vercelUrl ?? "");
    setGithubUrl(project.githubUrl ?? "");
    setEditOpen(true);
  }

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
        setRenameOpen(false);
        onUpdated?.();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          status,
          vercelUrl: vercelUrl.trim() || null,
          githubUrl: githubUrl.trim() || null,
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
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteOpen(false);
        onUpdated?.();
        router.push("/");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size={compact ? "icon" : "sm"}
            className={compact ? "size-8 shrink-0" : ""}
            onClick={(e) => e.preventDefault()}
          >
            <MoreHorizontalIcon className="size-4" />
            <span className="sr-only">Project actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); openRename(); }}>
            <PencilIcon className="size-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); openEdit(); }}>
            <PencilIcon className="size-4" />
            Edit
          </DropdownMenuItem>
          {project.vercelUrl && (
            <DropdownMenuItem asChild>
              <Link
                href={project.vercelUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLinkIcon className="size-4" />
                Open in new tab
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

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRename} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rename-name">Name</Label>
              <Input
                id="rename-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Project name"
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRenameOpen(false)}
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Project name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="edit-type"
                    value="SITE"
                    checked={type === "SITE"}
                    onChange={() => setType("SITE")}
                  />
                  Site
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="edit-type"
                    value="SAAS"
                    checked={type === "SAAS"}
                    onChange={() => setType("SAAS")}
                  />
                  SaaS
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="edit-status"
                    value="IN_PROGRESS"
                    checked={status === "IN_PROGRESS"}
                    onChange={() => setStatus("IN_PROGRESS")}
                  />
                  En cours
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="edit-status"
                    value="CLOSED"
                    checked={status === "CLOSED"}
                    onChange={() => setStatus("CLOSED")}
                  />
                  Clôturé
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-vercel">Vercel URL</Label>
              <Input
                id="edit-vercel"
                type="url"
                value={vercelUrl}
                onChange={(e) => setVercelUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-github">GitHub URL</Label>
              <Input
                id="edit-github"
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://..."
              />
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
            <DialogTitle>Delete project</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete &quot;{project.name}&quot;? This
              will also delete all categories and content. This action cannot be
              undone.
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
