import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categoryImages } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import path from "path";
import fs from "fs";

/** DELETE /api/categories/[id]/images/[imageId] */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const { id: categoryId, imageId } = await params;

  const [image] = await db
    .select()
    .from(categoryImages)
    .where(
      and(
        eq(categoryImages.id, imageId),
        eq(categoryImages.categoryId, categoryId)
      )
    );
  if (!image) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  const filepath = path.join(process.cwd(), "public", image.imageUrl);
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }

  await db
    .delete(categoryImages)
    .where(
      and(
        eq(categoryImages.id, imageId),
        eq(categoryImages.categoryId, categoryId)
      )
    );
  return NextResponse.json({ success: true });
}
