import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { randomUUID } from "crypto";

/** GET /api/projects — List projects, optionally filtered by clientId */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");

  if (clientId) {
    const list = await db
      .select()
      .from(projects)
      .where(eq(projects.clientId, clientId))
      .orderBy(asc(projects.createdAt));
    return NextResponse.json(list);
  }

  const list = await db
    .select()
    .from(projects)
    .orderBy(asc(projects.createdAt));
  return NextResponse.json(list);
}

/** POST /api/projects — Create a new project */
export async function POST(request: Request) {
  const body = await request.json();
  const { clientId, name, type, vercelUrl, githubUrl } = body;

  if (!clientId || !name || !type) {
    return NextResponse.json(
      { error: "clientId, name, and type are required" },
      { status: 400 }
    );
  }

  if (!["SITE", "SAAS"].includes(type)) {
    return NextResponse.json(
      { error: "type must be SITE or SAAS" },
      { status: 400 }
    );
  }

  const id = randomUUID();
  await db.insert(projects).values({
    id,
    clientId,
    name,
    type,
    vercelUrl: vercelUrl ?? null,
    githubUrl: githubUrl ?? null,
  });
  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  return NextResponse.json(project);
}
