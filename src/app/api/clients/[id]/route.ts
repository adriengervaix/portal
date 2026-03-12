import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { deleteLocalClientLogo, saveClientLogo } from "@/lib/uploads/client-logo";

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
  const [existingClient] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, id));
  if (!existingClient) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  const isMultipart = contentType.includes("multipart/form-data");

  let name: unknown = undefined;
  let logo: unknown = undefined;
  let status: unknown = undefined;
  let url: unknown = undefined;
  let qontoClientId: unknown = undefined;
  let removeLogo = false;
  let logoFile: File | null = null;

  if (isMultipart) {
    const formData = await request.formData();
    if (formData.has("name")) name = formData.get("name");
    if (formData.has("logo")) logo = formData.get("logo");
    if (formData.has("status")) status = formData.get("status");
    if (formData.has("url")) url = formData.get("url");
    if (formData.has("qontoClientId")) qontoClientId = formData.get("qontoClientId");
    removeLogo = formData.get("removeLogo") === "true";
    const logoFileField = formData.get("logoFile");
    logoFile = logoFileField instanceof File ? logoFileField : null;
  } else {
    const body = await request.json();
    name = body.name;
    logo = body.logo;
    status = body.status;
    url = body.url;
    qontoClientId = body.qontoClientId;
    removeLogo = Boolean(body.removeLogo);
  }

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

  if (status !== undefined) {
    if (
      typeof status !== "string" ||
      !["ACTIVE", "ARCHIVED"].includes(status)
    ) {
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
  if (qontoClientId !== undefined) {
    const normalizedQontoClientId =
      typeof qontoClientId === "string" ? qontoClientId.trim() || null : null;
    if (normalizedQontoClientId) {
      const [existingLink] = await db
        .select()
        .from(clients)
        .where(eq(clients.qontoClientId, normalizedQontoClientId));
      if (existingLink && existingLink.id !== id) {
        return NextResponse.json(
          { error: "This Qonto client is already linked" },
          { status: 409 }
        );
      }
    }
    updates.qontoClientId = normalizedQontoClientId;
  }

  if (logo !== undefined) {
    updates.logo = typeof logo === "string" ? logo.trim() || null : null;
  }

  if (removeLogo) {
    updates.logo = null;
  }

  if (logoFile) {
    try {
      const uploadedLogoUrl = await saveClientLogo(id, logoFile);
      updates.logo = uploadedLogoUrl;
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to upload logo",
        },
        { status: 400 }
      );
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(existingClient);
  }

  const shouldDeletePreviousLogo =
    existingClient.logo &&
    updates.logo !== undefined &&
    updates.logo !== existingClient.logo;

  await db.update(clients).set(updates).where(eq(clients.id, id));
  if (shouldDeletePreviousLogo) {
    await deleteLocalClientLogo(existingClient.logo);
  }

  const [client] = await db.select().from(clients).where(eq(clients.id, id));
  return NextResponse.json(client);
}

/** DELETE /api/clients/[id] */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [existingClient] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, id));
  if (!existingClient) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  await deleteLocalClientLogo(existingClient.logo);
  await db.delete(clients).where(eq(clients.id, id));
  return NextResponse.json({ success: true });
}
