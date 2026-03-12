import { NextRequest, NextResponse } from "next/server";
import { DropboxResponseError } from "dropbox";
import {
  withDropboxRefresh,
  applyRefreshedToken,
} from "@/lib/dropbox/client";

/**
 * Returns true when the error indicates an auth failure
 * that cannot be recovered by refreshing.
 */
function isUnrecoverableAuthError(err: unknown): boolean {
  if (err instanceof DropboxResponseError) {
    return err.status === 401 || err.status === 403;
  }
  if (err && typeof err === "object" && "status" in err) {
    const status = (err as { status?: number }).status;
    return status === 401 || status === 403;
  }
  return (
    err instanceof Error && err.message.includes("not authenticated")
  );
}

/**
 * GET /api/dropbox/folders
 * Lists subfolders at Dropbox root (path: "").
 */
export async function GET(req: NextRequest) {
  try {
    const { data, refreshedToken } = await withDropboxRefresh(req, (dbx) =>
      dbx.filesListFolder({ path: "" })
    );

    const folders = data.result.entries.filter((e) => e[".tag"] === "folder");

    const response = NextResponse.json(
      folders.map((f) => ({
        id: f.id,
        name: f.name,
        path: f.path_display ?? f.path_lower ?? "",
      })),
      {
        headers: {
          "Cache-Control": "private, max-age=300, stale-while-revalidate=60",
        },
      }
    );

    applyRefreshedToken(response, refreshedToken);
    return response;
  } catch (err) {
    console.error("Dropbox folders error:", err);
    const status = isUnrecoverableAuthError(err) ? 401 : 500;
    const message =
      status === 401
        ? "Session expired or invalid. Please reconnect."
        : err instanceof Error
          ? err.message
          : "Failed to list folders";
    return NextResponse.json({ error: message }, { status });
  }
}
