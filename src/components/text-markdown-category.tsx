"use client";

import { useState, useCallback, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CopyIcon } from "lucide-react";
import { toast } from "sonner";
import type { Category } from "@/types";

interface TextMarkdownCategoryProps {
  category: Category;
  onUpdated?: () => void;
}

const DEBOUNCE_MS = 600;

export function TextMarkdownCategory({ category, onUpdated }: TextMarkdownCategoryProps) {
  const [value, setValue] = useState(category.contentText ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    async (text: string) => {
      const res = await fetch(`/api/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentText: text }),
      });
      if (res.ok) onUpdated?.();
    },
    [category.id, onUpdated]
  );

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const v = e.target.value;
    setValue(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(v), DEBOUNCE_MS);
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copié !");
    } catch {
      toast.error("Erreur lors de la copie");
    }
  }

  const isContext = category.type === "CONTEXT";

  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={handleChange}
        placeholder="Saisissez votre contenu en markdown..."
        className="min-h-[120px] font-mono text-sm"
      />
      {isContext && (
        <Button variant="outline" size="sm" onClick={copyToClipboard}>
          <CopyIcon className="size-4" />
          Copier en Markdown
        </Button>
      )}
    </div>
  );
}
