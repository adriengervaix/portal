"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeftIcon, ExternalLinkIcon } from "lucide-react";
import { AddCategoryDropdown } from "./add-category-dropdown";
import { CategoryAccordion } from "./category-accordion";
import { ProjectActionsMenu } from "./project-actions-menu";
import { ProjectInformationForm } from "./project-information-form";
import {
  PROJECT_STATUS_CATEGORIES,
  PROJECT_STATUS_LABELS,
} from "@/lib/project-status";
import type { Project, Client, Category, ProjectStatus } from "@/types";

interface ProjectPageProps {
  projectId: string;
}

export function ProjectPage({ projectId }: ProjectPageProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);

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

  /**
   * Updates project status directly from the page header dropdown.
   */
  async function handleStatusChange(nextStatus: ProjectStatus): Promise<void> {
    if (!project) return;
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) return;
      const data: Project = await res.json();
      setProject(data);
    } finally {
      setStatusLoading(false);
    }
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
          <div className="flex items-center gap-2"
          >
            <label htmlFor="project-header-status" className="text-sm text-muted-foreground">
              Status
            </label>
            <select
              id="project-header-status"
              value={(project.status ?? "PRODUCTION_WORKING") as ProjectStatus}
              onChange={(event) =>
                handleStatusChange(event.target.value as ProjectStatus)
              }
              disabled={statusLoading}
              className="flex h-9 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <optgroup label="Production">
                {PROJECT_STATUS_CATEGORIES.PRODUCTION.map((status) => (
                  <option key={status} value={status}>
                    {PROJECT_STATUS_LABELS[status]}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Commercial">
                {PROJECT_STATUS_CATEGORIES.COMMERCIAL.map((status) => (
                  <option key={status} value={status}>
                    {PROJECT_STATUS_LABELS[status]}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Other">
                {PROJECT_STATUS_CATEGORIES.OTHER.map((status) => (
                  <option key={status} value={status}>
                    {PROJECT_STATUS_LABELS[status]}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Closed">
                {PROJECT_STATUS_CATEGORIES.CLOSED.map((status) => (
                  <option key={status} value={status}>
                    {PROJECT_STATUS_LABELS[status]}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
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

      <Tabs defaultValue="production" className="mt-6">
        <TabsList variant="line">
          <TabsTrigger value="information">Information</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
        </TabsList>
        <TabsContent value="information" className="mt-6">
          <ProjectInformationForm
            project={project}
            onUpdated={() => {
              fetchProject();
              fetchCategories();
            }}
          />
        </TabsContent>
        <TabsContent value="production" className="mt-6 space-y-4">
          <AddCategoryDropdown
            projectId={projectId}
            onAdded={onCategoryAdded}
          />
          <CategoryAccordion
            categories={categories}
            onUpdated={onCategoryUpdated}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
