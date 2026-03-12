"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export interface DropboxFolder {
  id: string;
  name: string;
  path: string;
}

/** localStorage key for persisting last viewed folder. */
export const BOOKMARKS_LAST_FOLDER_KEY = "bookmarks-last-folder";

interface BookmarksFolderSelectProps {
  value: string;
  onChange: (folder: DropboxFolder | null) => void;
  onFoldersLoaded?: (folders: DropboxFolder[]) => void;
  disabled?: boolean;
}

/**
 * Dropdown to select a Dropbox subfolder from root.
 * Fetches folder list from /api/dropbox/folders.
 */
export function BookmarksFolderSelect({
  value,
  onChange,
  onFoldersLoaded,
  disabled = false,
}: BookmarksFolderSelectProps) {
  const [folders, setFolders] = useState<DropboxFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsReconnect, setNeedsReconnect] = useState(false);

  useEffect(() => {
    async function fetchFolders() {
      try {
        const res = await fetch("/api/dropbox/folders", { credentials: "include" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setNeedsReconnect(res.status === 401);
          throw new Error(data.error ?? "Failed to load folders");
        }
        setFolders(data);
        onFoldersLoaded?.(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchFolders();
  }, []);

  if (loading) {
    return (
      <select
        disabled
        className="h-9 rounded-md border border-input bg-muted px-3 py-1 text-sm"
      >
        <option>Loading...</option>
      </select>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
        {needsReconnect && (
          <Button asChild size="sm" variant="outline">
            <a href="/api/dropbox-auth">Reconnect Dropbox</a>
          </Button>
        )}
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => {
        const folder = folders.find((f) => f.name === e.target.value) ?? null;
        onChange(folder);
      }}
      disabled={disabled}
      className="h-9 min-w-[12rem] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <option value="">Select a folder</option>
      {folders.map((f) => (
        <option key={f.id} value={f.name}>
          {f.name}
        </option>
      ))}
    </select>
  );
}
