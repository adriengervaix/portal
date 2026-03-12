import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, projectStatusEnum } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const VALID_STATUSES = projectStatusEnum as unknown as string[];

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
  const {
    name,
    type,
    status,
    vercelUrl,
    githubUrl,
    devisReference,
    projectedAmountHt,
    qontoQuoteId,
    quoteNumber,
    quoteStatus,
    quoteAmountHt,
    quoteAnnotation,
  } = body;

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
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }
    updates.status = status;
  }
  if (vercelUrl !== undefined) updates.vercelUrl = vercelUrl;
  if (githubUrl !== undefined) updates.githubUrl = githubUrl;
  if (devisReference !== undefined) updates.devisReference = devisReference ?? null;
  if (projectedAmountHt !== undefined) updates.projectedAmountHt = projectedAmountHt ?? null;
  if (qontoQuoteId !== undefined) updates.qontoQuoteId = qontoQuoteId ?? null;
  if (quoteNumber !== undefined) updates.quoteNumber = quoteNumber ?? null;
  if (quoteStatus !== undefined) updates.quoteStatus = quoteStatus ?? null;
  if (quoteAmountHt !== undefined) updates.quoteAmountHt = quoteAmountHt ?? null;
  if (quoteAnnotation !== undefined) updates.quoteAnnotation = quoteAnnotation ?? null;

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
