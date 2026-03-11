/**
 * Seeds clients and projects from the provided mapping.
 * Run with: npm run db:seed-clients-projects
 *
 * Data source: Name (project) → Client List (client)
 */
import { db } from "../src/lib/db/index";
import { clients, projects } from "../src/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

/** Project name → Client name mapping */
const PROJECT_CLIENT_MAPPING: Array<{ projectName: string; clientName: string }> = [
  { projectName: "Thermomix", clientName: "AV Prod" },
  { projectName: "Powerling", clientName: "Powerling" },
  { projectName: "Toulouse credit", clientName: "Carton Rouge" },
  { projectName: "Qualicode", clientName: "ITSharkz" },
  { projectName: "LX retours", clientName: "Carton Rouge" },
  { projectName: "Yrcam", clientName: "Carton Rouge" },
  { projectName: "Eiwie", clientName: "Carton Rouge" },
  { projectName: "Remake", clientName: "Carton Rouge" },
];

/** Unique client names to create */
const UNIQUE_CLIENTS = [...new Set(PROJECT_CLIENT_MAPPING.map((p) => p.clientName))];

async function getOrCreateClient(clientName: string): Promise<string> {
  const existing = await db.select().from(clients).where(eq(clients.name, clientName)).limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  const id = randomUUID();
  await db.insert(clients).values({
    id,
    name: clientName,
    status: "ACTIVE",
  });
  return id;
}

async function seedClientsAndProjects() {
  const clientIdByName = new Map<string, string>();

  for (const clientName of UNIQUE_CLIENTS) {
    const id = await getOrCreateClient(clientName);
    clientIdByName.set(clientName, id);
    console.log(`Client: ${clientName} (${id})`);
  }

  for (const { projectName, clientName } of PROJECT_CLIENT_MAPPING) {
    const clientId = clientIdByName.get(clientName)!;
    const existingProject = await db
      .select()
      .from(projects)
      .where(and(eq(projects.clientId, clientId), eq(projects.name, projectName)))
      .limit(1);

    if (existingProject.length > 0) {
      console.log(`Project already exists: ${projectName} (${clientName})`);
      continue;
    }

    const projectId = randomUUID();
    await db.insert(projects).values({
      id: projectId,
      clientId,
      name: projectName,
      type: "SITE",
      status: "PRODUCTION_WORKING",
    });
    console.log(`Project: ${projectName} → ${clientName}`);
  }

  console.log("Seed completed.");
}

seedClientsAndProjects().catch(console.error);
