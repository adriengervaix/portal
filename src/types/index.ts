export type ProjectType = "SITE" | "SAAS";
export type ProjectStatus =
  | "PRODUCTION_KICK_OFF"
  | "PRODUCTION_WORKING"
  | "PRODUCTION_FEEDBACK"
  | "PRODUCTION_FINALISATION"
  | "COMMERCIAL_CALL"
  | "COMMERCIAL_DEVIS_ENVOYE"
  | "COMMERCIAL_RELANCE"
  | "COMMERCIAL_ACCEPTE"
  | "PROSPECT"
  | "ON_HOLD"
  | "PAUSED"
  | "CLOSED"
  | "ABANDONED";
export type CategoryFormat = "IMAGE_GRID" | "TEXT_MARKDOWN" | "EXTERNAL_LINK";
export type CategoryType = "COMMUNICATION" | "CONTEXT" | "TECHNICAL";
export type ClientStatus = "ACTIVE" | "ARCHIVED";

export interface Client {
  id: string;
  name: string;
  logo: string | null;
  status: ClientStatus;
  url: string | null;
  createdAt: string;
  projects?: Project[];
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  type: ProjectType;
  status: ProjectStatus;
  devisReference: string | null;
  projectedAmountHt: number | null;
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
