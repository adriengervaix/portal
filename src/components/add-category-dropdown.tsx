"use client";

import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDownIcon } from "lucide-react";
import type { CategoryTemplate } from "@/types";

interface AddCategoryDropdownProps {
  projectId: string;
  onAdded?: () => void;
}

export function AddCategoryDropdown({ projectId, onAdded }: AddCategoryDropdownProps) {
  const [templates, setTemplates] = useState<CategoryTemplate[]>([]);
  const [customOpen, setCustomOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customFormat, setCustomFormat] = useState<"TEXT_MARKDOWN" | "IMAGE_GRID" | "EXTERNAL_LINK">("TEXT_MARKDOWN");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/category-templates")
      .then((r) => r.json())
      .then(setTemplates);
  }, []);

  async function addCategory(template: CategoryTemplate) {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: template.name,
          type: template.type,
          format: template.format,
        }),
      });
      if (res.ok) onAdded?.();
    } finally {
      setLoading(false);
    }
  }

  async function addCustomCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!customName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customName.trim(),
          type: "CONTEXT",
          format: customFormat,
        }),
      });
      if (res.ok) {
        setCustomName("");
        setCustomOpen(false);
        onAdded?.();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            Ajouter une catégorie
            <ChevronDownIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {templates.map((t) => (
            <DropdownMenuItem
              key={`${t.name}-${t.format}`}
              onClick={() => addCategory(t)}
              disabled={loading}
            >
              {t.name} ({t.format.replace("_", " ")})
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setCustomOpen(true); }}>
            + Catégorie personnalisée
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catégorie personnalisée</DialogTitle>
          </DialogHeader>
          <form onSubmit={addCustomCategory} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-name">Nom</Label>
              <Input
                id="custom-name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Ex: Research"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-format">Format</Label>
              <select
                id="custom-format"
                value={customFormat}
                onChange={(e) => setCustomFormat(e.target.value as typeof customFormat)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="TEXT_MARKDOWN">Texte / Markdown</option>
                <option value="IMAGE_GRID">Grille d&apos;images</option>
                <option value="EXTERNAL_LINK">Lien externe</option>
              </select>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Ajout..." : "Ajouter"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
