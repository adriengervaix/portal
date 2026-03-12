import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients, projects } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { saveClientLogo } from "@/lib/uploads/client-logo";

/** GET /api/clients — List all clients with their projects */
export async function GET() {
  const allClients = await db.select().from(clients).orderBy(asc(clients.name));
  const allProjects = await db
    .select()
    .from(projects)
    .orderBy(asc(projects.createdAt));

  const clientsWithProjects = allClients.map((client) => ({
    ...client,
    projects: allProjects.filter((p) => p.clientId === client.id),
  }));

  return NextResponse.json(clientsWithProjects);
}

/** POST /api/clients — Create a new client */
export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const isMultipart = contentType.includes("multipart/form-data");

  let name = "";
  let qontoClientId: string | null = null;
  let logo: string | null = null;
  let status = "ACTIVE";
  let url: string | null = null;
  let logoFile: File | null = null;

  if (isMultipart) {
    const formData = await request.formData();
    name = String(formData.get("name") ?? "");
    qontoClientId = String(formData.get("qontoClientId") ?? "").trim() || null;
    status = String(formData.get("status") ?? "ACTIVE");
    url = String(formData.get("url") ?? "").trim() || null;
    const logoFileField = formData.get("logoFile");
    logoFile = logoFileField instanceof File ? logoFileField : null;
  } else {
    const body = await request.json();
    name = typeof body.name === "string" ? body.name : "";
    qontoClientId =
      typeof body.qontoClientId === "string"
        ? body.qontoClientId.trim() || null
        : null;
    logo = typeof body.logo === "string" ? body.logo.trim() || null : null;
    status = typeof body.status === "string" ? body.status : "ACTIVE";
    url = typeof body.url === "string" ? body.url.trim() || null : null;
  }

  if (!name || typeof name !== "string") {
    return NextResponse.json(
      { error: "Name is required" },
      { status: 400 }
    );
  }

  const validStatuses = ["ACTIVE", "ARCHIVED"] as const;
  const clientStatus: "ACTIVE" | "ARCHIVED" =
    status === "ARCHIVED" ? "ARCHIVED" : "ACTIVE";

  if (qontoClientId) {
    const [existing] = await db
      .select()
      .from(clients)
      .where(eq(clients.qontoClientId, qontoClientId));
    if (existing) {
      return NextResponse.json(
        { error: "This Qonto client is already linked" },
        { status: 409 }
      );
    }
  }

  const id = randomUUID();
  let uploadedLogoUrl: string | null = null;
  if (logoFile) {
    try {
      uploadedLogoUrl = await saveClientLogo(id, logoFile);
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

  await db.insert(clients).values({
    id,
    name: name.trim(),
    qontoClientId,
    logo: uploadedLogoUrl ?? logo,
    status: clientStatus,
    url,
  });
  const [client] = await db.select().from(clients).where(eq(clients.id, id));
  return NextResponse.json(client);
}
