"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BOOKMARKS_LAST_FOLDER_KEY,
  type DropboxFolder,
} from "./bookmarks-folder-select";

/**
 * Folder dropdown for the nav bar when on /bookmarks.
 * Syncs selection with URL (?folder=) and appears to the right of the Bookmarks link.
 */
export function BookmarksNavDropdown() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [folders, setFolders] = useState<DropboxFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const hasSetInitial = useRef(false);

  const currentFolder = searchParams.get("folder");

  useEffect(() => {
    if (pathname !== "/bookmarks") return;
    hasSetInitial.current = false;
    async function fetchFolders() {
      try {
        const res = await fetch("/api/dropbox/folders", {
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setNeedsReconnect(res.status === 401);
          throw new Error(data.error ?? "Failed to load folders");
        }
        setFolders(data);
        if (
          data.length > 0 &&
          !currentFolder &&
          !hasSetInitial.current
        ) {
          hasSetInitial.current = true;
          try {
            const lastViewed = localStorage.getItem(BOOKMARKS_LAST_FOLDER_KEY);
            const folder =
              data.find((f: DropboxFolder) => f.name === lastViewed) ??
              data[0];
            router.replace(`/bookmarks?folder=${encodeURIComponent(folder.name)}`);
          } catch {
            router.replace(
              `/bookmarks?folder=${encodeURIComponent(data[0].name)}`
            );
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchFolders();
  }, [pathname, router, currentFolder]);

  if (pathname !== "/bookmarks") return null;

  if (error) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-destructive">{error}</span>
        {needsReconnect && (
          <Button asChild size="sm" variant="outline" className="h-8">
            <a href="/api/dropbox-auth">Reconnect</a>
          </Button>
        )}
      </div>
    );
  }

  return (
    <Select
      value={currentFolder ?? ""}
      onValueChange={(folder) => {
        if (folder) {
          try {
            localStorage.setItem(BOOKMARKS_LAST_FOLDER_KEY, folder);
          } catch {
            /* ignore */
          }
          router.push(`/bookmarks?folder=${encodeURIComponent(folder)}`);
        }
      }}
      disabled={loading}
    >
      <SelectTrigger size="sm" className="h-8 min-w-[8rem]">
        <SelectValue placeholder={loading ? "..." : "Folder"} />
      </SelectTrigger>
      <SelectContent side="top" align="start" position="popper">
        {folders.map((f) => (
          <SelectItem key={f.id} value={f.name}>
            {f.name.charAt(0).toUpperCase() + f.name.slice(1)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
