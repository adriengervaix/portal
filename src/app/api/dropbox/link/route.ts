import { NextRequest, NextResponse } from "next/server";
import { withDropboxRefresh, applyRefreshedToken } from "@/lib/dropbox/client";

/**
 * GET /api/dropbox/link?path=/folder/file.jpg
 * Returns a temporary link to stream the file content.
 * Use for full-size images in modal and for videos.
 */
export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path");
  if (!path) {
    return NextResponse.json(
      { error: "path param required" },
      { status: 400 }
    );
  }

  try {
    const { data, refreshedToken } = await withDropboxRefresh(req, (dbx) =>
      dbx.filesGetTemporaryLink({ path })
    );

    const response = NextResponse.json(
      { link: data.result.link },
      {
        headers: {
          "Cache-Control":
            "private, max-age=7200, stale-while-revalidate=14400",
        },
      }
    );

    applyRefreshedToken(response, refreshedToken);
    return response;
  } catch (err) {
    console.error("Dropbox link error:", err);
    return NextResponse.json(
      { error: "Failed to get temporary link" },
      { status: 500 }
    );
  }
}
