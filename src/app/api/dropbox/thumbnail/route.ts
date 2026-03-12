import { NextRequest, NextResponse } from "next/server";
import { DropboxResponseError } from "dropbox";
import {
  withDropboxRefresh,
  applyRefreshedToken,
} from "@/lib/dropbox/client";

/**
 * GET /api/dropbox/thumbnail?path=/folder/image.jpg
 * Proxies Dropbox thumbnail for images. Returns raw image bytes.
 * Falls back to temporary link redirect when thumbnail API fails.
 *
 * Aggressive cache: thumbnails are immutable for a given path,
 * so we cache for 7 days with a 30-day stale-while-revalidate window.
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
    const { data: thumbRes, refreshedToken } = await withDropboxRefresh(
      req,
      (dbx) =>
        dbx.filesGetThumbnail({
          path,
          format: { ".tag": "jpeg" },
          size: { ".tag": "w640h480" },
        })
    );

    const fileBinary = (thumbRes.result as { fileBinary?: Buffer }).fileBinary;
    if (fileBinary && Buffer.isBuffer(fileBinary)) {
      const response = new NextResponse(new Uint8Array(fileBinary), {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control":
            "public, max-age=604800, stale-while-revalidate=2592000, immutable",
        },
      });

      applyRefreshedToken(response, refreshedToken);
      return response;
    }
  } catch (err) {
    if (!(err instanceof DropboxResponseError && err.status === 404)) {
      console.error("Dropbox thumbnail error:", err);
    }
  }

  try {
    const { data: linkRes, refreshedToken } = await withDropboxRefresh(
      req,
      (dbx) => dbx.filesGetTemporaryLink({ path })
    );

    const response = NextResponse.redirect(linkRes.result.link, 302);
    response.headers.set(
      "Cache-Control",
      "private, max-age=7200, stale-while-revalidate=14400"
    );
    applyRefreshedToken(response, refreshedToken);
    return response;
  } catch (err) {
    console.error("Dropbox link fallback error:", err);
    return NextResponse.json(
      { error: "Failed to get thumbnail or link" },
      { status: 500 }
    );
  }
}
