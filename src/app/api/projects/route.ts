import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq, asc, and } from "drizzle-orm";
import { randomUUID } from "crypto";

/** GET /api/projects — List projects, optionally filtered by clientId and status */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");
  const status = searchParams.get("status");

  const conditions: ReturnType<typeof eq>[] = [];
  if (clientId) conditions.push(eq(projects.clientId, clientId));
  if (status && ["IN_PROGRESS", "CLOSED"].includes(status)) {
    conditions.push(eq(projects.status, status as "IN_PROGRESS" | "CLOSED"));
  }

  const whereClause =
    conditions.length > 0 ? (conditions.length === 1 ? conditions[0] : and(...conditions)) : undefined;

  const list = await db
    .select()
    .from(projects)
    .where(whereClause)
    .orderBy(asc(projects.createdAt));

  return NextResponse.json(list);
}

/** POST /api/projects — Create a new project */
export async function POST(request: Request) {
  const body = await request.json();
  const { clientId, name, type, status, vercelUrl, githubUrl } = body;

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

  const projectStatus =
    status && ["IN_PROGRESS", "CLOSED"].includes(status)
      ? status
      : "IN_PROGRESS";

  const id = randomUUID();
  await db.insert(projects).values({
    id,
    clientId,
    name,
    type,
    status: projectStatus,
    vercelUrl: vercelUrl ?? null,
    githubUrl: githubUrl ?? null,
  });
  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  return NextResponse.json(project);
}
