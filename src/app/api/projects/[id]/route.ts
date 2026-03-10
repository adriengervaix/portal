import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/** GET /api/projects/[id] */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id));
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  return NextResponse.json(project);
}

/** PATCH /api/projects/[id] */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { name, type, status, vercelUrl, githubUrl } = body;

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (type !== undefined) {
    if (!["SITE", "SAAS"].includes(type)) {
      return NextResponse.json(
        { error: "type must be SITE or SAAS" },
        { status: 400 }
      );
    }
    updates.type = type;
  }
  if (status !== undefined) {
    if (!["IN_PROGRESS", "CLOSED"].includes(status)) {
      return NextResponse.json(
        { error: "status must be IN_PROGRESS or CLOSED" },
        { status: 400 }
      );
    }
    updates.status = status;
  }
  if (vercelUrl !== undefined) updates.vercelUrl = vercelUrl;
  if (githubUrl !== undefined) updates.githubUrl = githubUrl;

  if (Object.keys(updates).length === 0) {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return NextResponse.json(project);
  }

  await db.update(projects).set(updates).where(eq(projects.id, id));
  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  return NextResponse.json(project);
}

/** DELETE /api/projects/[id] */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(projects).where(eq(projects.id, id));
  return NextResponse.json({ success: true });
}
