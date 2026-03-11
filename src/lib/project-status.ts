/**
 * Project status labels and grouping for UI.
 */

import type { ProjectStatus } from "@/types";

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  PRODUCTION_KICK_OFF: "Kick off",
  PRODUCTION_WORKING: "En production",
  PRODUCTION_FEEDBACK: "Feedback",
  PRODUCTION_FINALISATION: "Finalisation",
  COMMERCIAL_CALL: "Appel",
  COMMERCIAL_DEVIS_ENVOYE: "Devis envoyé",
  COMMERCIAL_RELANCE: "Relance",
  COMMERCIAL_ACCEPTE: "Accepté",
  PROSPECT: "Prospect",
  ON_HOLD: "En attente",
  PAUSED: "En pause",
  CLOSED: "Clôturé",
  ABANDONED: "Abandonné",
};

export const PROJECT_STATUS_CATEGORIES = {
  PRODUCTION: [
    "PRODUCTION_KICK_OFF",
    "PRODUCTION_WORKING",
    "PRODUCTION_FEEDBACK",
    "PRODUCTION_FINALISATION",
  ] as const,
  COMMERCIAL: [
    "COMMERCIAL_CALL",
    "COMMERCIAL_DEVIS_ENVOYE",
    "COMMERCIAL_RELANCE",
    "COMMERCIAL_ACCEPTE",
  ] as const,
  OTHER: ["PROSPECT", "ON_HOLD", "PAUSED"] as const,
  CLOSED: ["CLOSED", "ABANDONED"] as const,
} as const;

export type ProjectStatusCategory = keyof typeof PROJECT_STATUS_CATEGORIES;

/** Returns the category for a given status. */
export function getStatusCategory(status: ProjectStatus): ProjectStatusCategory {
  if ((PROJECT_STATUS_CATEGORIES.PRODUCTION as readonly string[]).includes(status))
    return "PRODUCTION";
  if ((PROJECT_STATUS_CATEGORIES.COMMERCIAL as readonly string[]).includes(status))
    return "COMMERCIAL";
  if ((PROJECT_STATUS_CATEGORIES.OTHER as readonly string[]).includes(status))
    return "OTHER";
  return "CLOSED";
}

/** Returns true if the project is considered "in progress" (not closed). */
export function isProjectInProgress(status: ProjectStatus): boolean {
  return status !== "CLOSED" && status !== "ABANDONED";
}
