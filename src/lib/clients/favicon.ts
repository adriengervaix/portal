/**
 * Builds a favicon URL from a website URL.
 * Returns null when the input cannot produce a valid hostname.
 */
export function getFaviconUrlFromWebsite(input: string): string | null {
  const value = input.trim();
  if (!value) return null;

  const candidate = value.startsWith("http://") || value.startsWith("https://")
    ? value
    : `https://${value}`;

  try {
    const url = new URL(candidate);
    if (!url.hostname) return null;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
      url.hostname
    )}&sz=128`;
  } catch {
    return null;
  }
}
