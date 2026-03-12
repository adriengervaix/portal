import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, projectStatusEnum } from "@/lib/db/schema";
import { eq, asc, and } from "drizzle-orm";
import { randomUUID } from "crypto";

const VALID_STATUSES = projectStatusEnum as unknown as string[];

/** GET /api/projects — List projects, optionally filtered by clientId and status */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");
  const status = searchParams.get("status");

  const conditions: ReturnType<typeof eq>[] = [];
  if (clientId) conditions.push(eq(projects.clientId, clientId));
  if (status && VALID_STATUSES.includes(status)) {
    conditions.push(eq(projects.status, status as (typeof projectStatusEnum)[number]));
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
  const {
    clientId,
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
    status && VALID_STATUSES.includes(status)
      ? (status as (typeof projectStatusEnum)[number])
      : "PRODUCTION_WORKING";

  const id = randomUUID();
  await db.insert(projects).values({
    id,
    clientId,
    name,
    type,
    status: projectStatus,
    devisReference: devisReference ?? null,
    projectedAmountHt: projectedAmountHt ?? null,
    qontoQuoteId: qontoQuoteId ?? null,
    quoteNumber: quoteNumber ?? null,
    quoteStatus: quoteStatus ?? null,
    quoteAmountHt: quoteAmountHt ?? null,
    quoteAnnotation: quoteAnnotation ?? null,
    vercelUrl: vercelUrl ?? null,
    githubUrl: githubUrl ?? null,
  });
  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  return NextResponse.json(project);
}
