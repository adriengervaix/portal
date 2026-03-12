"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { IMAGE_EXTENSIONS } from "@/lib/dropbox/constants";
import type { DropboxFile } from "./bookmarks-masonry-grid";

const LINK_CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours (Dropbox links expire in 4h)

interface CachedLink {
  link: string;
  fetchedAt: number;
}

interface BookmarksMediaModalProps {
  file: DropboxFile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Checks if a file is an image.
 */
function isImageFile(name: string): boolean {
  const ext = name.toLowerCase().slice(name.lastIndexOf("."));
  return IMAGE_EXTENSIONS.includes(ext);
}

const linkCache = new Map<string, CachedLink>();

/**
 * Modal to display full-size image or video from Dropbox.
 * Fetches temporary link (with client cache) and renders img or video element.
 */
export function BookmarksMediaModal({
  file,
  open,
  onOpenChange,
}: BookmarksMediaModalProps) {
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchRef = useRef<AbortController | null>(null);

  const fetchLink = useCallback((path: string) => {
    const cached = linkCache.get(path);
    if (cached && Date.now() - cached.fetchedAt < LINK_CACHE_TTL_MS) {
      setLink(cached.link);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchRef.current?.abort();
    fetchRef.current = new AbortController();
    fetch(`/api/dropbox/link?path=${encodeURIComponent(path)}`, {
      signal: fetchRef.current.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load media");
        return res.json();
      })
      .then((data) => {
        linkCache.set(path, { link: data.link, fetchedAt: Date.now() });
        setLink(data.link);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!open || !file) {
      setLink(null);
      setError(null);
      return;
    }
    fetchLink(file.path);
    return () => {
      fetchRef.current?.abort();
    };
  }, [open, file, fetchLink]);

  if (!file) return null;

  const isImage = isImageFile(file.name);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl p-0 overflow-hidden border-0 bg-transparent shadow-none"
        showCloseButton={true}
      >
        <DialogTitle className="sr-only">
          View {file.name}
        </DialogTitle>
        <div className="flex items-center justify-center bg-black/80 p-4">
          {loading && (
            <p className="text-sm text-muted-foreground">Loading...</p>
          )}
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {link && !loading && (
            <>
              {isImage ? (
                <img
                  src={link}
                  alt={file.name}
                  className="max-h-[85vh] w-auto max-w-full object-contain"
                />
              ) : (
                <video
                  src={link}
                  controls
                  autoPlay
                  className="max-h-[85vh] w-auto max-w-full"
                />
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
