"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftIcon, ExternalLinkIcon } from "lucide-react";
import { AddCategoryDropdown } from "./add-category-dropdown";
import { CategoryAccordion } from "./category-accordion";
import { CategoryDetailPanel } from "./category-detail-panel";
import type { Project, Client, Category } from "@/types";

interface ProjectPageProps {
  projectId: string;
}

export function ProjectPage({ projectId }: ProjectPageProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelCategoryId, setPanelCategoryId] = useState<string | null>(null);

  async function fetchProject() {
    const res = await fetch(`/api/projects/${projectId}`);
    if (!res.ok) return;
    const data = await res.json();
    setProject(data);
  }

  async function fetchClient(clientId: string) {
    const res = await fetch(`/api/clients/${clientId}`);
    if (!res.ok) return;
    const data = await res.json();
    setClient(data);
  }

  async function fetchCategories() {
    const res = await fetch(`/api/projects/${projectId}/categories`);
    if (!res.ok) return;
    const data = await res.json();
    setCategories(data);
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      await fetchProject();
      setLoading(false);
    }
    load();
  }, [projectId]);

  useEffect(() => {
    if (project?.clientId) {
      fetchClient(project.clientId);
    }
  }, [project?.clientId]);

  useEffect(() => {
    fetchCategories();
  }, [projectId]);

  async function onCategoryAdded() {
    await fetchCategories();
  }

  async function onCategoryUpdated() {
    await fetchCategories();
    await fetchProject();
  }

  async function onCategoryDeleted() {
    setPanelCategoryId(null);
    await fetchCategories();
  }

  if (loading || !project) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8 space-y-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeftIcon className="size-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <Badge variant="secondary">{project.type}</Badge>
        </div>
        <p className="text-muted-foreground">
          Client: {client?.name ?? "—"}
        </p>
        {project.vercelUrl && (
          <a
            href={project.vercelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Vercel preview
            <ExternalLinkIcon className="size-3" />
          </a>
        )}
      </header>

      <div className="space-y-4">
        <AddCategoryDropdown
          projectId={projectId}
          onAdded={onCategoryAdded}
        />
        <CategoryAccordion
          categories={categories}
          onOpenPanel={setPanelCategoryId}
          onUpdated={onCategoryUpdated}
        />
      </div>

      <CategoryDetailPanel
        projectId={projectId}
        project={project}
        client={client}
        categories={categories}
        selectedCategoryId={panelCategoryId}
        onSelectCategory={setPanelCategoryId}
        onClose={() => setPanelCategoryId(null)}
        onUpdated={onCategoryUpdated}
        onDeleted={onCategoryDeleted}
      />
    </div>
  );
}
