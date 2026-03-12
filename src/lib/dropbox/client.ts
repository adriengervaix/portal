import { Dropbox, DropboxAuth, DropboxResponseError } from "dropbox";
import fetch from "node-fetch";
import { NextRequest, NextResponse } from "next/server";
import {
  DROPBOX_TOKEN_COOKIE,
  DROPBOX_REFRESH_COOKIE,
  DROPBOX_COOKIE_OPTIONS,
} from "./cookies";

/**
 * Extracts a cookie value from a request by name.
 */
function getCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${name}=([^;]+)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

/**
 * Extracts Dropbox access token from request cookies or env.
 * Priority: cookie (from OAuth) > DROPBOX_ACCESS_TOKEN env.
 */
export function getDropboxToken(request?: Request): string | null {
  if (request) {
    const fromCookie = getCookie(request, DROPBOX_TOKEN_COOKIE);
    if (fromCookie) return fromCookie;
  }
  const envToken = process.env.DROPBOX_ACCESS_TOKEN;
  return envToken?.trim() || null;
}

/**
 * Extracts Dropbox refresh token from request cookies.
 */
export function getDropboxRefreshToken(request?: Request): string | null {
  if (!request) return null;
  return getCookie(request, DROPBOX_REFRESH_COOKIE);
}

/**
 * Creates a Dropbox client instance from an access token.
 */
export function getDropboxClient(request?: Request): Dropbox {
  const token = getDropboxToken(request);
  if (!token) {
    throw new Error(
      "Dropbox not authenticated. Connect your Dropbox account."
    );
  }
  return new Dropbox({
    accessToken: token,
    fetch: fetch as unknown as typeof globalThis.fetch,
  });
}

/**
 * Returns true when the error indicates an expired/invalid token.
 */
function isAuthError(err: unknown): boolean {
  if (err instanceof DropboxResponseError) {
    return err.status === 401 || err.status === 403;
  }
  if (err && typeof err === "object" && "status" in err) {
    const status = (err as { status?: number }).status;
    return status === 401 || status === 403;
  }
  return false;
}

/**
 * Uses the refresh token to obtain a new access token from Dropbox.
 * @returns The new access token string.
 * @throws If refresh fails or credentials are missing.
 */
async function refreshAccessToken(refreshToken: string): Promise<string> {
  const clientId = process.env.DROPBOX_APP_KEY;
  const clientSecret = process.env.DROPBOX_APP_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Dropbox OAuth credentials not configured");
  }

  const auth = new DropboxAuth({
    clientId,
    clientSecret,
    fetch: fetch as unknown as typeof globalThis.fetch,
  });
  auth.setRefreshToken(refreshToken);
  await auth.refreshAccessToken();

  const newToken = auth.getAccessToken();
  if (!newToken) {
    throw new Error("Failed to refresh Dropbox access token");
  }
  return newToken;
}

/** Result from a Dropbox operation that may have refreshed the token. */
export interface DropboxResult<T> {
  data: T;
  /** Non-null when the access token was refreshed during the call. */
  refreshedToken: string | null;
}

/**
 * Executes a Dropbox operation with automatic token refresh on 401/403.
 *
 * 1. Tries with the current access token.
 * 2. If the call fails with an auth error and a refresh token is available,
 *    refreshes the access token and retries once.
 * 3. Returns the result + the new token (if refreshed) so the caller
 *    can set it on the response cookie.
 */
export async function withDropboxRefresh<T>(
  req: NextRequest,
  fn: (client: Dropbox) => Promise<T>
): Promise<DropboxResult<T>> {
  const accessToken = getDropboxToken(req);
  const refreshToken = getDropboxRefreshToken(req);

  if (accessToken) {
    try {
      const client = new Dropbox({
        accessToken,
        fetch: fetch as unknown as typeof globalThis.fetch,
      });
      const data = await fn(client);
      return { data, refreshedToken: null };
    } catch (err) {
      if (!isAuthError(err) || !refreshToken) throw err;
    }
  }

  if (!refreshToken) {
    throw new Error(
      "Dropbox not authenticated. Connect your Dropbox account."
    );
  }

  const newToken = await refreshAccessToken(refreshToken);
  const client = new Dropbox({
    accessToken: newToken,
    fetch: fetch as unknown as typeof globalThis.fetch,
  });
  const data = await fn(client);
  return { data, refreshedToken: newToken };
}

/**
 * Sets the refreshed access-token cookie on a NextResponse when needed.
 */
export function applyRefreshedToken(
  response: NextResponse,
  refreshedToken: string | null
): void {
  if (!refreshedToken) return;
  response.cookies.set(
    DROPBOX_TOKEN_COOKIE,
    refreshedToken,
    DROPBOX_COOKIE_OPTIONS
  );
}
