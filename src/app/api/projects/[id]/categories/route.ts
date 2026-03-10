import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories, categoryImages } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { randomUUID } from "crypto";

/** GET /api/projects/[id]/categories — List categories for a project */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const list = await db
    .select()
    .from(categories)
    .where(eq(categories.projectId, projectId))
    .orderBy(asc(categories.sortOrder), asc(categories.createdAt));

  const allImages = await db
    .select()
    .from(categoryImages)
    .orderBy(asc(categoryImages.sortOrder));

  const categoriesWithImages = list.map((cat) => ({
    ...cat,
    images: allImages.filter((img) => img.categoryId === cat.id),
  }));

  return NextResponse.json(categoriesWithImages);
}

/** POST /api/projects/[id]/categories — Add a category */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const body = await request.json();
  const { name, type, format } = body;

  if (!name || !type || !format) {
    return NextResponse.json(
      { error: "name, type, and format are required" },
      { status: 400 }
    );
  }

  const validTypes = ["COMMUNICATION", "CONTEXT", "TECHNICAL"];
  const validFormats = ["IMAGE_GRID", "TEXT_MARKDOWN", "EXTERNAL_LINK"];
  if (!validTypes.includes(type) || !validFormats.includes(format)) {
    return NextResponse.json(
      { error: "Invalid type or format" },
      { status: 400 }
    );
  }

  const id = randomUUID();
  await db.insert(categories).values({
    id,
    projectId,
    name,
    type,
    format,
  });
  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id));
  return NextResponse.json(category);
}
