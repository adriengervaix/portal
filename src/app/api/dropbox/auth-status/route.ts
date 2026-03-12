import { NextRequest, NextResponse } from "next/server";
import {
  getDropboxToken,
  getDropboxRefreshToken,
  withDropboxRefresh,
} from "@/lib/dropbox/client";
import { DROPBOX_TOKEN_COOKIE, DROPBOX_COOKIE_OPTIONS } from "@/lib/dropbox/cookies";

/**
 * GET /api/dropbox/auth-status
 * Returns whether Dropbox is authenticated with a valid token.
 * Attempts a silent token refresh when the access token is expired
 * but a refresh token is available.
 */
export async function GET(req: NextRequest) {
  const token = getDropboxToken(req);
  const refreshToken = getDropboxRefreshToken(req);

  if (!token && !refreshToken) {
    return NextResponse.json({ authenticated: false });
  }

  try {
    const { refreshedToken } = await withDropboxRefresh(req, (dbx) =>
      dbx.usersGetCurrentAccount()
    );

    const response = NextResponse.json({ authenticated: true });

    if (refreshedToken) {
      response.cookies.set(
        DROPBOX_TOKEN_COOKIE,
        refreshedToken,
        DROPBOX_COOKIE_OPTIONS
      );
    }

    return response;
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
