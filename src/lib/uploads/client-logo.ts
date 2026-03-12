import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

const CLIENT_LOGOS_DIR = path.join(
  process.cwd(),
  "public",
  "uploads",
  "client-logos"
);

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/gif",
]);

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
  "image/gif": ".gif",
};

/**
 * Saves a client logo in the public uploads directory.
 */
export async function saveClientLogo(
  clientId: string,
  file: File
): Promise<string> {
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
    throw new Error("Unsupported logo file type");
  }

  if (!file.size) {
    throw new Error("Logo file is empty");
  }

  await fs.mkdir(CLIENT_LOGOS_DIR, { recursive: true });

  const extension = EXTENSION_BY_MIME_TYPE[file.type] ?? ".png";
  const filename = `${clientId}-${randomUUID()}${extension}`;
  const absoluteFilePath = path.join(CLIENT_LOGOS_DIR, filename);
  const buffer = Buffer.from(await file.arrayBuffer());

  await fs.writeFile(absoluteFilePath, buffer);

  return `/uploads/client-logos/${filename}`;
}

/**
 * Deletes a local client logo file when stored in /uploads/client-logos.
 */
export async function deleteLocalClientLogo(logoUrl: string | null): Promise<void> {
  if (!logoUrl) return;
  if (!logoUrl.startsWith("/uploads/client-logos/")) return;

  const normalizedPath = logoUrl.replace(/^\/+/, "");
  const absoluteFilePath = path.join(process.cwd(), "public", normalizedPath);

  try {
    await fs.unlink(absoluteFilePath);
  } catch {
    // Ignore missing files.
  }
}
