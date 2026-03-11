/**
 * GET /api/projects/projected-revenue
 * Returns the sum of projectedAmountHt for all projects (CA projeté).
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  const [row] = await db.select({
    total: sql<number>`COALESCE(SUM(${projects.projectedAmountHt}), 0)`,
  }).from(projects);

  const total = Number(row?.total ?? 0);
  return NextResponse.json({ totalProjectedHt: total });
}
