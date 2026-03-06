import { db } from "./index";
import { clients, projects, categories } from "./schema";
import { randomUUID } from "crypto";

/** Default category templates for quick add */
export const DEFAULT_CATEGORY_TEMPLATES = [
  { name: "Brief", type: "COMMUNICATION" as const, format: "TEXT_MARKDOWN" as const },
  { name: "Moodboard", type: "COMMUNICATION" as const, format: "IMAGE_GRID" as const },
  { name: "Tone of Voice", type: "CONTEXT" as const, format: "TEXT_MARKDOWN" as const },
  { name: "Design System", type: "CONTEXT" as const, format: "TEXT_MARKDOWN" as const },
  { name: "Branding", type: "COMMUNICATION" as const, format: "IMAGE_GRID" as const },
  { name: "Veille compétitive", type: "CONTEXT" as const, format: "TEXT_MARKDOWN" as const },
  { name: "Wireframes", type: "COMMUNICATION" as const, format: "EXTERNAL_LINK" as const },
];

/** Seeds the database with demo data (optional, for dev) */
export async function seed() {
  const clientId = randomUUID();
  const projectId = randomUUID();

  await db.insert(clients).values({
    id: clientId,
    name: "Demo Client",
  });

  await db.insert(projects).values({
    id: projectId,
    clientId,
    name: "Demo Project",
    type: "SITE",
  });

  await db.insert(categories).values({
    id: randomUUID(),
    projectId,
    name: "Brief",
    type: "COMMUNICATION",
    format: "TEXT_MARKDOWN",
    contentText: "# Project Brief\n\nAdd your project brief here...",
    sortOrder: 0,
  });

  await db.insert(categories).values({
    id: randomUUID(),
    projectId,
    name: "Moodboard",
    type: "COMMUNICATION",
    format: "IMAGE_GRID",
    sortOrder: 1,
  });

  console.log("Seed completed.");
}
