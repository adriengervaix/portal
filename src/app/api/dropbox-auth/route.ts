import { NextResponse } from "next/server";
import { DropboxAuth } from "dropbox";
import fetch from "node-fetch";

/**
 * GET /api/dropbox-auth
 * Redirects user to Dropbox OAuth consent page.
 */
export async function GET() {
  const clientId = process.env.DROPBOX_APP_KEY;
  const clientSecret = process.env.DROPBOX_APP_SECRET;
  const redirectUri = process.env.DROPBOX_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json(
      { error: "Dropbox OAuth not configured" },
      { status: 500 }
    );
  }

  const auth = new DropboxAuth({
    clientId,
    clientSecret,
    fetch: fetch as unknown as typeof globalThis.fetch,
  });

  const authUrl = await auth.getAuthenticationUrl(
    redirectUri,
    undefined,
    "code",
    "offline"
  );

  return NextResponse.redirect(authUrl as string);
}
