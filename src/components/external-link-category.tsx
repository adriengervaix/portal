"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ExternalLinkIcon } from "lucide-react";
import type { Category } from "@/types";

interface ExternalLinkCategoryProps {
  category: Category;
  onUpdated?: () => void;
}

const DEBOUNCE_MS = 500;

export function ExternalLinkCategory({ category, onUpdated }: ExternalLinkCategoryProps) {
  const [url, setUrl] = useState(category.contentUrl ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setUrl(category.contentUrl ?? "");
  }, [category.contentUrl]);

  useEffect(() => {
    if (url === (category.contentUrl ?? "")) return;
    const t = setTimeout(async () => {
      setSaving(true);
      const res = await fetch(`/api/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentUrl: url || null }),
      });
      if (res.ok) onUpdated?.();
      setSaving(false);
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [url, category.id, category.contentUrl, onUpdated]);

  const isValidUrl = url.startsWith("http://") || url.startsWith("https://");

  return (
    <div className="space-y-2">
      <div className="space-y-2">
        <Label htmlFor={`url-${category.id}`}>URL</Label>
        <Input
          id={`url-${category.id}`}
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>
      {saving && (
        <p className="text-xs text-muted-foreground">Sauvegarde...</p>
      )}
      {isValidUrl && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Ouvrir le lien
          <ExternalLinkIcon className="size-3" />
        </a>
      )}
    </div>
  );
}
