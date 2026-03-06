"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon, Trash2Icon } from "lucide-react";
import Image from "next/image";
import type { Category } from "@/types";

interface ImageGridCategoryProps {
  category: Category;
  onUpdated?: () => void;
}

export function ImageGridCategory({ category, onUpdated }: ImageGridCategoryProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const images = category.images ?? [];

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("images", files[i]);
    }
    try {
      const res = await fetch(`/api/categories/${category.id}/images`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) onUpdated?.();
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function deleteImage(imageId: string) {
    const res = await fetch(
      `/api/categories/${category.id}/images/${imageId}`,
      { method: "DELETE" }
    );
    if (res.ok) onUpdated?.();
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {images.map((img) => (
          <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
            <Image
              src={img.imageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, 25vw"
            />
            <button
              type="button"
              onClick={() => deleteImage(img.id)}
              className="absolute right-2 top-2 rounded-md bg-destructive/80 p-1.5 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Supprimer"
            >
              <Trash2Icon className="size-4" />
            </button>
          </div>
        ))}
      </div>
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <PlusIcon className="size-4" />
          Ajouter des images
        </Button>
      </div>
    </div>
  );
}
