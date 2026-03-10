"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftIcon, ExternalLinkIcon } from "lucide-react";
import { AddCategoryDropdown } from "./add-category-dropdown";
import { CategoryAccordion } from "./category-accordion";
import { ProjectActionsMenu } from "./project-actions-menu";
import type { Project, Client, Category } from "@/types";

interface ProjectPageProps {
  projectId: string;
}

export function ProjectPage({ projectId }: ProjectPageProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

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
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight">
            {project.name}
          </h1>
          <Badge variant="secondary">{project.type}</Badge>
          <Badge
            variant={
              (project.status ?? "IN_PROGRESS") === "IN_PROGRESS"
                ? "default"
                : "secondary"
            }
          >
            {(project.status ?? "IN_PROGRESS") === "IN_PROGRESS"
              ? "En cours"
              : "Clôturé"}
          </Badge>
          <ProjectActionsMenu
            project={project}
            onUpdated={() => {
              fetchProject();
              fetchCategories();
            }}
            compact
          />
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
          onUpdated={onCategoryUpdated}
        />
      </div>
    </div>
  );
}
