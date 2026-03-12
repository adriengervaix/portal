import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories, categoryImages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/**
 * Validates that a URL is a same-origin path (e.g. /api/dropbox/thumbnail?path=...).
 * Rejects absolute URLs and paths with "..".
 */
function isValidImageUrl(url: string): boolean {
  if (typeof url !== "string" || !url.startsWith("/")) return false;
  if (url.includes("..")) return false;
  try {
    const parsed = new URL(url, "http://localhost");
    return parsed.origin === "http://localhost" && parsed.pathname.startsWith("/");
  } catch {
    return false;
  }
}

/** POST /api/categories/[id]/images — Upload image(s) or add by URL */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: categoryId } = await params;

  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, categoryId));
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }
  if (category.format !== "IMAGE_GRID") {
    return NextResponse.json(
      { error: "Category must have IMAGE_GRID format" },
      { status: 400 }
    );
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await request.json();
    const imageUrls = Array.isArray(body.imageUrls) ? body.imageUrls : [];
    const validUrls = imageUrls.filter(
      (u: unknown): u is string => typeof u === "string" && isValidImageUrl(u)
    );
    if (validUrls.length === 0) {
      return NextResponse.json(
        { error: "No valid image URLs provided" },
        { status: 400 }
      );
    }
    const uploaded: { id: string; imageUrl: string }[] = [];
    for (let i = 0; i < validUrls.length; i++) {
      const imageId = randomUUID();
      await db.insert(categoryImages).values({
        id: imageId,
        categoryId,
        imageUrl: validUrls[i],
        sortOrder: i,
      });
      uploaded.push({ id: imageId, imageUrl: validUrls[i] });
    }
    return NextResponse.json(uploaded);
  }

  const formData = await request.formData();
  const files = formData.getAll("images") as File[];

  if (!files.length) {
    return NextResponse.json(
      { error: "No images provided" },
      { status: 400 }
    );
  }

  const dir = path.join(UPLOAD_DIR, categoryId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const uploaded: { id: string; imageUrl: string }[] = [];

  for (const file of files) {
    if (!(file instanceof File) || !file.size) continue;

    const ext = path.extname(file.name) || ".jpg";
    const filename = `${randomUUID()}${ext}`;
    const filepath = path.join(dir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filepath, buffer);

    const imageUrl = `/uploads/${categoryId}/${filename}`;
    const imageId = randomUUID();
    await db.insert(categoryImages).values({
      id: imageId,
      categoryId,
      imageUrl,
    });
    uploaded.push({ id: imageId, imageUrl });
  }

  return NextResponse.json(uploaded);
}
