"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { ImageGridCategory } from "./image-grid-category";
import { TextMarkdownCategory } from "./text-markdown-category";
import { ExternalLinkCategory } from "./external-link-category";
import type { Project, Client, Category } from "@/types";

interface CategoryDetailPanelProps {
  projectId: string;
  project: Project;
  client: Client | null;
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  onClose: () => void;
  onUpdated: () => void;
  onDeleted: () => void;
}

export function CategoryDetailPanel({
  projectId,
  project,
  client,
  categories,
  selectedCategoryId,
  onSelectCategory,
  onClose,
  onUpdated,
  onDeleted,
}: CategoryDetailPanelProps) {
  const selected = categories.find((c) => c.id === selectedCategoryId);
  const idx = selected ? categories.findIndex((c) => c.id === selected.id) : -1;
  const prev = idx > 0 ? categories[idx - 1] : null;
  const next = idx >= 0 && idx < categories.length - 1 ? categories[idx + 1] : null;

  return (
    <Sheet open={!!selectedCategoryId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{selected?.name ?? "Détail"}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 flex-1 space-y-6">
          <div className="rounded-lg border p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Projet
            </h3>
            <p className="font-medium">{project.name}</p>
            <p className="text-sm text-muted-foreground">
              Client: {client?.name ?? "—"}
            </p>
            {project.vercelUrl && (
              <a
                href={project.vercelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm text-primary hover:underline"
              >
                Vercel preview
              </a>
            )}
          </div>

          {selected && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Contenu</h3>
              {selected.format === "IMAGE_GRID" && (
                <ImageGridCategory category={selected} onUpdated={onUpdated} />
              )}
              {selected.format === "TEXT_MARKDOWN" && (
                <TextMarkdownCategory category={selected} onUpdated={onUpdated} />
              )}
              {selected.format === "EXTERNAL_LINK" && (
                <ExternalLinkCategory category={selected} onUpdated={onUpdated} />
              )}
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={!prev}
              onClick={() => prev && onSelectCategory(prev.id)}
            >
              <ChevronLeftIcon className="size-4" />
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!next}
              onClick={() => next && onSelectCategory(next.id)}
            >
              Suivant
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
