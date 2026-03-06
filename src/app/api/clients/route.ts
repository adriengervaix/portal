import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients, projects } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { randomUUID } from "crypto";

/** GET /api/clients — List all clients with their projects */
export async function GET() {
  const allClients = await db.query.clients.findMany({
    orderBy: [asc(clients.name)],
    with: {
      projects: {
        orderBy: [asc(projects.createdAt)],
      },
    },
  });
  return NextResponse.json(allClients);
}

/** POST /api/clients — Create a new client */
export async function POST(request: Request) {
  const body = await request.json();
  const { name } = body;

  if (!name || typeof name !== "string") {
    return NextResponse.json(
      { error: "Name is required" },
      { status: 400 }
    );
  }

  const id = randomUUID();
  await db.insert(clients).values({ id, name });
  const [client] = await db.select().from(clients).where(eq(clients.id, id));
  return NextResponse.json(client);
}
