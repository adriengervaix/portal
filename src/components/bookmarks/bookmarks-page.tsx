"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  BookmarksMasonryGrid,
  type DropboxFile,
} from "./bookmarks-masonry-grid";
import { BookmarksMediaModal } from "./bookmarks-media-modal";
import { BookmarksSendBar } from "./bookmarks-send-bar";

const SESSION_CACHE_KEY = "bookmarks_files_cache";

/**
 * Reads the file-list cache from sessionStorage.
 * Falls back to an empty map on any error.
 */
function readSessionCache(): Map<string, DropboxFile[]> {
  try {
    const raw = sessionStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return new Map();
    const entries: [string, DropboxFile[]][] = JSON.parse(raw);
    return new Map(entries);
  } catch {
    return new Map();
  }
}

/**
 * Writes the file-list cache to sessionStorage.
 */
function writeSessionCache(cache: Map<string, DropboxFile[]>): void {
  try {
    sessionStorage.setItem(
      SESSION_CACHE_KEY,
      JSON.stringify([...cache.entries()])
    );
  } catch {
    /* quota exceeded — ignore */
  }
}

/** In-memory cache (survives client-side navigations within session). */
let memoryCache: Map<string, DropboxFile[]> | null = null;

/**
 * Returns the merged memory + sessionStorage cache.
 * Memory cache takes priority; sessionStorage acts as fallback
 * after a full page reload.
 */
function getCache(): Map<string, DropboxFile[]> {
  if (!memoryCache) {
    memoryCache = readSessionCache();
  }
  return memoryCache;
}

/**
 * Stores files for a folder in both memory and sessionStorage.
 */
function setCacheEntry(folder: string, files: DropboxFile[]): void {
  const cache = getCache();
  cache.set(folder, files);
  writeSessionCache(cache);
}

/**
 * Main Bookmarks page: masonry grid + image/video modal.
 * Folder selection is in the nav. Reads folder from URL (?folder=).
 */
export function BookmarksPage() {
  const searchParams = useSearchParams();
  const folderFromUrl = searchParams.get("folder");
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [files, setFiles] = useState<DropboxFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<DropboxFile | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/dropbox/auth-status", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setAuthenticated(data.authenticated))
      .catch(() => setAuthenticated(false));
  }, []);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [folderFromUrl]);

  useEffect(() => {
    if (!folderFromUrl) {
      setFiles([]);
      return;
    }

    const cached = getCache().get(folderFromUrl);
    if (cached) {
      setFiles(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const controller = new AbortController();

    fetch(
      `/api/dropbox/files?folder=${encodeURIComponent(folderFromUrl)}`,
      { credentials: "include", signal: controller.signal }
    )
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load files");
        return res.json();
      })
      .then((data: DropboxFile[]) => {
        setCacheEntry(folderFromUrl, data);
        setFiles(data);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setFiles(cached ?? []);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [folderFromUrl]);

  const handleFileClick = useCallback((file: DropboxFile) => {
    setSelectedFile(file);
    setModalOpen(true);
  }, []);

  const errorParam = searchParams.get("error");

  if (authenticated === false) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16">
        <p className="text-muted-foreground">
          Connect your Dropbox account to browse your media files.
        </p>
        <Button asChild>
          <a href="/api/dropbox-auth">Connect Dropbox</a>
        </Button>
      </div>
    );
  }

  if (authenticated === null) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Loading...
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {errorParam && (
        <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {errorParam === "auth_failed" &&
            "Authentication failed. Please try again."}
          {errorParam === "missing_code" && "Missing authorization code."}
          {errorParam === "no_token" && "Could not obtain access token."}
          {errorParam === "config" && "Dropbox OAuth not configured."}
          {!["auth_failed", "missing_code", "no_token", "config"].includes(
            errorParam
          ) && errorParam}
        </p>
      )}

      {loading && files.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Loading...
        </p>
      ) : (
        <BookmarksMasonryGrid
          files={files}
          onFileClick={handleFileClick}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      )}

      {selectedIds.size > 0 && (
        <BookmarksSendBar
          selectedFiles={files.filter((f) => selectedIds.has(f.id))}
          onClearSelection={() => setSelectedIds(new Set())}
        />
      )}

      <BookmarksMediaModal
        file={selectedFile}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
