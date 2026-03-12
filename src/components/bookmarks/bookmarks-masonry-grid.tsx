"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { VideoIcon, CheckIcon } from "lucide-react";
import { IMAGE_EXTENSIONS } from "@/lib/dropbox/constants";
import { cn } from "@/lib/utils";

export interface DropboxFile {
  id: string;
  name: string;
  path: string;
}

interface BookmarksMasonryGridProps {
  files: DropboxFile[];
  onFileClick: (file: DropboxFile) => void;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
}

/** Delay in ms between each image reveal for the wave effect. */
const STAGGER_DELAY_MS = 60;

/**
 * Checks if a file is an image (supports Dropbox thumbnail).
 */
function isImageFile(name: string): boolean {
  const ext = name.toLowerCase().slice(name.lastIndexOf("."));
  return IMAGE_EXTENSIONS.includes(ext);
}

/**
 * Masonry-style grid for Dropbox media files.
 * Uses CSS column-count. Images use thumbnail API; videos show placeholder.
 * Checkboxes on hover for image selection (images only).
 *
 * Images fade in with a staggered left-to-right animation as they load.
 */
export function BookmarksMasonryGrid({
  files,
  onFileClick,
  selectedIds,
  onSelectionChange,
}: BookmarksMasonryGridProps) {
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const loadOrderRef = useRef(0);

  useEffect(() => {
    loadOrderRef.current = 0;
    setRevealedIds(new Set());
  }, [files]);

  const handleImageLoaded = useCallback((fileId: string) => {
    const order = loadOrderRef.current++;
    const delay = order * STAGGER_DELAY_MS;

    setTimeout(() => {
      setRevealedIds((prev) => {
        const next = new Set(prev);
        next.add(fileId);
        return next;
      });
    }, delay);
  }, []);

  if (files.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No media files in this folder.
      </p>
    );
  }

  function toggleSelection(fileId: string, e: React.MouseEvent) {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(fileId)) {
      next.delete(fileId);
    } else {
      next.add(fileId);
    }
    onSelectionChange(next);
  }

  const HIGH_PRIORITY_COUNT = 8;

  return (
    <div className="columns-2 gap-4 md:columns-3 lg:columns-4 xl:columns-6">
      {files.map((file, index) => {
        const isImage = isImageFile(file.name);
        const thumbnailUrl = isImage
          ? `/api/dropbox/thumbnail?path=${encodeURIComponent(file.path)}`
          : null;
        const isSelected = selectedIds.has(file.id);
        const isHighPriority = isImage && index < HIGH_PRIORITY_COUNT;
        const isRevealed = revealedIds.has(file.id) || !isImage;

        return (
          <div
            key={file.id}
            className={cn(
              "mb-4 break-inside-avoid cursor-pointer",
              "transition-all duration-500 ease-out",
              isRevealed
                ? "translate-y-0 opacity-100"
                : "translate-y-3 opacity-0"
            )}
            onClick={() => onFileClick(file)}
          >
            <div className="group relative overflow-hidden rounded-lg border bg-muted">
              {isImage ? (
                <>
                  <img
                    src={thumbnailUrl!}
                    alt={file.name}
                    className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading={isHighPriority ? "eager" : "lazy"}
                    decoding="async"
                    fetchPriority={isHighPriority ? "high" : "auto"}
                    onLoad={() => handleImageLoaded(file.id)}
                  />
                  <button
                    type="button"
                    onClick={(e) => toggleSelection(file.id, e)}
                    className={cn(
                      "absolute left-2 top-2 z-10 flex size-6 items-center justify-center rounded-md border-2 transition-opacity",
                      "opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-background bg-background/80 text-foreground"
                    )}
                    aria-label={isSelected ? "Deselect" : "Select"}
                  >
                    {isSelected && <CheckIcon className="size-4" />}
                  </button>
                </>
              ) : (
                <div className="flex aspect-video w-full items-center justify-center bg-muted">
                  <VideoIcon className="size-12 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
