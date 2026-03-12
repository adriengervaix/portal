import { NextRequest, NextResponse } from "next/server";
import { withDropboxRefresh, applyRefreshedToken } from "@/lib/dropbox/client";
import { MEDIA_EXTENSIONS } from "@/lib/dropbox/constants";

/**
 * Checks if a file has a supported media extension.
 */
function isMediaFile(name: string): boolean {
  const ext = name.toLowerCase().slice(name.lastIndexOf("."));
  return MEDIA_EXTENSIONS.includes(ext);
}

/**
 * GET /api/dropbox/files?folder=branding
 * Lists media files (images + videos) in the given subfolder at root.
 */
export async function GET(req: NextRequest) {
  const folder = req.nextUrl.searchParams.get("folder");
  if (!folder) {
    return NextResponse.json(
      { error: "folder param required" },
      { status: 400 }
    );
  }

  const path = `/${folder}`;

  try {
    const { data, refreshedToken } = await withDropboxRefresh(req, (dbx) =>
      dbx.filesListFolder({ path })
    );

    const files = data.result.entries.filter(
      (e) => e[".tag"] === "file" && "name" in e && isMediaFile(e.name)
    ) as Array<{
      id: string;
      name: string;
      path_display?: string;
      path_lower?: string;
    }>;

    const response = NextResponse.json(
      files.map((f) => ({
        id: f.id,
        name: f.name,
        path: f.path_display ?? f.path_lower ?? "",
      })),
      {
        headers: {
          "Cache-Control":
            "private, max-age=600, stale-while-revalidate=300",
        },
      }
    );

    applyRefreshedToken(response, refreshedToken);
    return response;
  } catch (err) {
    console.error("Dropbox files error:", err);
    return NextResponse.json(
      { error: "Failed to list files" },
      { status: 500 }
    );
  }
}
