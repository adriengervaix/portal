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
import {
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
  ExternalLinkIcon,
} from "lucide-react";
import { ProjectInformationForm } from "./project-information-form";
import type { Project } from "@/types";

interface ProjectActionsMenuProps {
  project: Project;
  /** Called after edit or delete. For delete, redirect happens so this may not run. */
  onUpdated?: () => void;
  /** If true, show compact trigger (icon only). If false, show next to project name. */
  compact?: boolean;
}

/**
 * Dropdown menu with project actions: Edit, Open in new tab, Delete.
 */
export function ProjectActionsMenu({
  project,
  onUpdated,
  compact = true,
}: ProjectActionsMenuProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  function openEdit() {
    setEditOpen(true);
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit project</DialogTitle>
          </DialogHeader>
          <ProjectInformationForm
            project={project}
            onUpdated={() => {
              setEditOpen(false);
              onUpdated?.();
            }}
            onCancel={() => setEditOpen(false)}
            showCancel
          />
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
