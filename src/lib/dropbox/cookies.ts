/** Cookie name for storing Dropbox OAuth access token. */
export const DROPBOX_TOKEN_COOKIE = "dropbox_token";

/** Cookie name for storing Dropbox OAuth refresh token. */
export const DROPBOX_REFRESH_COOKIE = "dropbox_refresh_token";

/** 30 days in seconds — shared max-age for Dropbox auth cookies. */
export const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/** Shared cookie options for Dropbox auth cookies. */
export const DROPBOX_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: COOKIE_MAX_AGE_SECONDS,
  path: "/",
};
