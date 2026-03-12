"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DropboxFile } from "./bookmarks-masonry-grid";

interface ProjectOption {
  projectId: string;
  projectName: string;
  clientName: string;
}

interface BookmarksSendBarProps {
  selectedFiles: DropboxFile[];
  onSent?: () => void;
  onClearSelection?: () => void;
}

/**
 * Floating bar at bottom when images are selected.
 * Allows sending selected images to a project's Moodboard category.
 */
export function BookmarksSendBar({
  selectedFiles,
  onSent,
  onClearSelection,
}: BookmarksSendBarProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/clients")
      .then((res) => res.json())
      .then((clients: { id: string; name: string; projects?: { id: string; name: string }[] }[]) => {
        const flat: ProjectOption[] = [];
        for (const client of clients) {
          for (const project of client.projects ?? []) {
            flat.push({
              projectId: project.id,
              projectName: project.name,
              clientName: client.name,
            });
          }
        }
        setProjects(flat);
        setSelectedProjectId((prev) => (prev ? prev : flat[0]?.projectId ?? ""));
      })
      .catch(() => setProjects([]));
  }, []);

  async function handleSend() {
    if (!selectedProjectId || selectedFiles.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/projects/${selectedProjectId}/moodboard-from-bookmarks`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imagePaths: selectedFiles.map((f) => f.path),
          }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to send");
      }
      onClearSelection?.();
      onSent?.();
      router.push(`/project/${selectedProjectId}`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const count = selectedFiles.length;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border bg-background px-4 py-3 shadow-lg">
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          {count} image{count !== 1 ? "s" : ""} selected
        </span>
        <Select
          value={selectedProjectId}
          onValueChange={setSelectedProjectId}
          disabled={projects.length === 0}
        >
          <SelectTrigger className="min-w-[12rem]">
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent position="popper" side="top" align="center">
            {projects.map((p) => (
              <SelectItem key={p.projectId} value={p.projectId}>
                <span className="truncate">
                  {p.clientName} — {p.projectName}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          onClick={handleSend}
          disabled={loading || !selectedProjectId || count === 0}
        >
          {loading ? "Sending…" : "Send to Moodboard"}
        </Button>
      </div>
    </div>
  );
}
