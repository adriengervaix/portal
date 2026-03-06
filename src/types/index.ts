export type ProjectType = "SITE" | "SAAS";
export type CategoryFormat = "IMAGE_GRID" | "TEXT_MARKDOWN" | "EXTERNAL_LINK";
export type CategoryType = "COMMUNICATION" | "CONTEXT" | "TECHNICAL";

export interface Client {
  id: string;
  name: string;
  createdAt: string;
  projects?: Project[];
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  type: ProjectType;
  vercelUrl: string | null;
  githubUrl: string | null;
  createdAt: string;
}

export interface CategoryImage {
  id: string;
  categoryId: string;
  imageUrl: string;
  sortOrder: number;
  createdAt: string;
}

export interface Category {
  id: string;
  projectId: string;
  name: string;
  type: CategoryType;
  format: CategoryFormat;
  contentText: string | null;
  contentUrl: string | null;
  sortOrder: number;
  createdAt: string;
  images?: CategoryImage[];
}

export interface CategoryTemplate {
  name: string;
  type: CategoryType;
  format: CategoryFormat;
}
