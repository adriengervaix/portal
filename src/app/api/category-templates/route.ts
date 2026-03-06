import { NextResponse } from "next/server";
import { DEFAULT_CATEGORY_TEMPLATES } from "@/lib/db/seed";

/** GET /api/category-templates — Default templates for adding categories */
export async function GET() {
  return NextResponse.json(DEFAULT_CATEGORY_TEMPLATES);
}
