import { NextRequest, NextResponse } from "next/server";
import { DropboxAuth } from "dropbox";
import fetch from "node-fetch";
import {
  DROPBOX_TOKEN_COOKIE,
  DROPBOX_REFRESH_COOKIE,
  DROPBOX_COOKIE_OPTIONS,
} from "@/lib/dropbox/cookies";

/**
 * GET /api/dropbox-auth/callback
 * OAuth callback: exchanges code for token, sets cookie, redirects to /bookmarks.
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/bookmarks?error=${encodeURIComponent(error)}`, req.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/bookmarks?error=missing_code", req.url)
    );
  }

  const clientId = process.env.DROPBOX_APP_KEY;
  const clientSecret = process.env.DROPBOX_APP_SECRET;
  const redirectUri = process.env.DROPBOX_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(
      new URL("/bookmarks?error=config", req.url)
    );
  }

  const auth = new DropboxAuth({
    clientId,
    clientSecret,
    fetch: fetch as unknown as typeof globalThis.fetch,
  });

  try {
    const res = await auth.getAccessTokenFromCode(redirectUri, code);
    const result = res.result as {
      access_token?: string;
      refresh_token?: string;
    };

    if (!result.access_token) {
      return NextResponse.redirect(
        new URL("/bookmarks?error=no_token", req.url)
      );
    }

    const response = NextResponse.redirect(new URL("/bookmarks", req.url));
    response.cookies.set(
      DROPBOX_TOKEN_COOKIE,
      result.access_token,
      DROPBOX_COOKIE_OPTIONS
    );

    if (result.refresh_token) {
      response.cookies.set(
        DROPBOX_REFRESH_COOKIE,
        result.refresh_token,
        DROPBOX_COOKIE_OPTIONS
      );
    }

    return response;
  } catch (err) {
    console.error("Dropbox OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/bookmarks?error=auth_failed", req.url)
    );
  }
}
