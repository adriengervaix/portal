import { qontoFetch } from "./client";
import type { QontoClientConfig } from "./client";

export interface QontoQuoteItem {
  id: string;
  number: string;
  status: string;
  amountHt: number | null;
  clientId: string | null;
  quoteUrl: string | null;
  attachmentId: string | null;
}

interface QontoQuotesResponse {
  quotes?: unknown[];
}

function toStringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function extractAmountHtInCents(raw: Record<string, unknown>): number | null {
  const amountCentsFields = [
    raw.total_amount_excluding_tax_cents,
    raw.amount_excluding_tax_cents,
    raw.total_amount_cents,
  ];

  for (const value of amountCentsFields) {
    const cents = toNumberOrNull(value);
    if (cents != null) return Math.round(cents);
  }

  const amountFields = [
    raw.total_amount_excluding_tax,
    raw.amount_excluding_tax,
    raw.total_amount,
  ];
  for (const value of amountFields) {
    const amount = toNumberOrNull(value);
    if (amount != null) return Math.round(amount * 100);
  }

  return null;
}

function extractClientId(raw: Record<string, unknown>): string | null {
  const direct = toStringOrNull(raw.client_id);
  if (direct) return direct;

  const client = raw.client;
  if (client && typeof client === "object") {
    return toStringOrNull((client as Record<string, unknown>).id);
  }

  return null;
}

function mapQuote(raw: unknown): QontoQuoteItem | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const id = toStringOrNull(data.id);
  if (!id) return null;

  const number =
    toStringOrNull(data.number) ??
    toStringOrNull(data.quote_number) ??
    toStringOrNull(data.reference) ??
    id;
  const status = toStringOrNull(data.status) ?? "unknown";

  return {
    id,
    number,
    status,
    amountHt: extractAmountHtInCents(data),
    clientId: extractClientId(data),
    quoteUrl: toStringOrNull(data.quote_url),
    attachmentId: toStringOrNull(data.attachment_id),
  };
}

/**
 * Fetches approved and pending quotes from Qonto and filters by client id locally.
 */
export async function fetchQontoQuotesByClient(
  config: QontoClientConfig,
  qontoClientId: string
): Promise<QontoQuoteItem[]> {
  const params = new URLSearchParams({
    per_page: "100",
  });

  const response = await qontoFetch<QontoQuotesResponse>(
    `/v2/quotes?${params.toString()}`,
    config
  );

  return (response.quotes ?? [])
    .map(mapQuote)
    .filter((quote): quote is QontoQuoteItem => quote !== null)
    .filter((quote) => quote.clientId === qontoClientId)
    .sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));
}
