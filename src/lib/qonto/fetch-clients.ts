import { qontoFetch } from "./client";
import type { QontoClientConfig } from "./client";

export interface QontoClientItem {
  id: string;
  name: string;
  email: string | null;
}

interface QontoClientsResponse {
  clients?: unknown[];
}

function toStringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function pickClientName(raw: Record<string, unknown>): string | null {
  const name = toStringOrNull(raw.name);
  if (name) return name;

  const firstName = toStringOrNull(raw.first_name);
  const lastName = toStringOrNull(raw.last_name);
  if (!firstName && !lastName) return null;
  return `${firstName ?? ""} ${lastName ?? ""}`.trim();
}

function mapClient(raw: unknown): QontoClientItem | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const id = toStringOrNull(data.id);
  const name = pickClientName(data);
  if (!id || !name) return null;

  return {
    id,
    name,
    email: toStringOrNull(data.email),
  };
}

/**
 * Fetches clients from Qonto and applies a local name filter.
 */
export async function fetchQontoClients(
  config: QontoClientConfig,
  query: string
): Promise<QontoClientItem[]> {
  const params = new URLSearchParams({
    per_page: "100",
  });

  if (query.trim().length >= 2) {
    params.set("filter[name]", query.trim());
  }

  const response = await qontoFetch<QontoClientsResponse>(
    `/v2/clients?${params.toString()}`,
    config
  );

  const all = (response.clients ?? [])
    .map(mapClient)
    .filter((item): item is QontoClientItem => item !== null);

  if (!query.trim()) {
    return all.slice(0, 20);
  }

  const normalized = query.trim().toLowerCase();
  return all
    .filter(
      (client) =>
        client.name.toLowerCase().includes(normalized) ||
        (client.email ?? "").toLowerCase().includes(normalized)
    )
    .slice(0, 20);
}
