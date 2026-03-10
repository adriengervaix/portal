import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/** GET /api/clients/[id] */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [client] = await db.select().from(clients).where(eq(clients.id, id));
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }
  return NextResponse.json(client);
}

/** PATCH /api/clients/[id] */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { name, logo, status, url } = body;

  const updates: Record<string, unknown> = {};
  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Name must be a non-empty string" },
        { status: 400 }
      );
    }
    updates.name = name.trim();
  }
  if (logo !== undefined) {
    updates.logo = typeof logo === "string" ? logo.trim() || null : null;
  }
  if (status !== undefined) {
    if (!["ACTIVE", "ARCHIVED"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be ACTIVE or ARCHIVED" },
        { status: 400 }
      );
    }
    updates.status = status;
  }
  if (url !== undefined) {
    updates.url = typeof url === "string" ? url.trim() || null : null;
  }

  if (Object.keys(updates).length === 0) {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    return NextResponse.json(client);
  }

  await db.update(clients).set(updates).where(eq(clients.id, id));
  const [client] = await db.select().from(clients).where(eq(clients.id, id));
  return NextResponse.json(client);
}

/** DELETE /api/clients/[id] */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(clients).where(eq(clients.id, id));
  return NextResponse.json({ success: true });
}
