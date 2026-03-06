import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/** GET /api/categories/[id] */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id));
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }
  return NextResponse.json(category);
}

/** PATCH /api/categories/[id] */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { name, type, format, contentText, contentUrl, sortOrder } = body;

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (type !== undefined) updates.type = type;
  if (format !== undefined) updates.format = format;
  if (contentText !== undefined) updates.contentText = contentText;
  if (contentUrl !== undefined) updates.contentUrl = contentUrl;
  if (sortOrder !== undefined) updates.sortOrder = sortOrder;

  if (Object.keys(updates).length === 0) {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id));
    return NextResponse.json(category);
  }

  await db.update(categories).set(updates).where(eq(categories.id, id));
  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id));
  return NextResponse.json(category);
}

/** DELETE /api/categories/[id] */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(categories).where(eq(categories.id, id));
  return NextResponse.json({ success: true });
}
