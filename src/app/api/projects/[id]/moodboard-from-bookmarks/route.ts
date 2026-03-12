import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories, categoryImages, projects } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

/**
 * POST /api/projects/[id]/moodboard-from-bookmarks
 * Creates a Moodboard category and adds images from Dropbox paths (thumbnail URLs).
 * Body: { imagePaths: string[] }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = await request.json();
  const imagePaths = Array.isArray(body.imagePaths) ? body.imagePaths : [];
  const validPaths = imagePaths.filter(
    (p: unknown): p is string => typeof p === "string" && p.length > 0
  );
  if (validPaths.length === 0) {
    return NextResponse.json(
      { error: "No image paths provided" },
      { status: 400 }
    );
  }

  const [lastCategory] = await db
    .select({ sortOrder: categories.sortOrder })
    .from(categories)
    .where(eq(categories.projectId, projectId))
    .orderBy(desc(categories.sortOrder))
    .limit(1);
  const nextSortOrder = lastCategory ? lastCategory.sortOrder + 1 : 0;

  const categoryId = randomUUID();
  await db.insert(categories).values({
    id: categoryId,
    projectId,
    name: "Moodboard",
    type: "COMMUNICATION",
    format: "IMAGE_GRID",
    sortOrder: nextSortOrder,
  });

  const imageUrls = validPaths.map(
    (filePath: string) =>
      `/api/dropbox/thumbnail?path=${encodeURIComponent(filePath)}`
  );

  for (let i = 0; i < imageUrls.length; i++) {
    await db.insert(categoryImages).values({
      id: randomUUID(),
      categoryId,
      imageUrl: imageUrls[i],
      sortOrder: i,
    });
  }

  return NextResponse.json({ categoryId, projectId });
}
