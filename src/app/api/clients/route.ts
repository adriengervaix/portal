import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients, projects } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { randomUUID } from "crypto";

/** GET /api/clients — List all clients with their projects */
export async function GET() {
  const allClients = await db.select().from(clients).orderBy(asc(clients.name));
  const allProjects = await db
    .select()
    .from(projects)
    .orderBy(asc(projects.createdAt));

  const clientsWithProjects = allClients.map((client) => ({
    ...client,
    projects: allProjects.filter((p) => p.clientId === client.id),
  }));

  return NextResponse.json(clientsWithProjects);
}

/** POST /api/clients — Create a new client */
export async function POST(request: Request) {
  const body = await request.json();
  const { name, logo, status, url } = body;

  if (!name || typeof name !== "string") {
    return NextResponse.json(
      { error: "Name is required" },
      { status: 400 }
    );
  }

  const validStatuses = ["ACTIVE", "ARCHIVED"];
  const clientStatus =
    status && validStatuses.includes(status) ? status : "ACTIVE";

  const id = randomUUID();
  await db.insert(clients).values({
    id,
    name: name.trim(),
    logo: typeof logo === "string" ? logo.trim() || null : null,
    status: clientStatus,
    url: typeof url === "string" ? url.trim() || null : null,
  });
  const [client] = await db.select().from(clients).where(eq(clients.id, id));
  return NextResponse.json(client);
}
