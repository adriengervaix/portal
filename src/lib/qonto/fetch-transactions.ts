/**
 * Fetches transactions from Qonto API with pagination and filters.
 */

import { qontoFetch } from "./client";
import type { QontoClientConfig } from "./client";

export interface QontoTransaction {
  id: string;
  label: string;
  clean_counterparty_name?: string | null;
  amount_cents: number;
  vat_amount_cents: number | null;
  vat_rate: number | null;
  side: "credit" | "debit";
  settled_at: string | null;
  status: string;
}

interface QontoTransactionsResponse {
  transactions: QontoTransaction[];
  meta: {
    current_page: number;
    next_page: number | null;
    prev_page: number | null;
    total_pages: number;
    total_count: number;
    per_page: number;
  };
}

export interface FetchTransactionsParams {
  iban: string;
  settledAtFrom: string; // ISO 8601
  settledAtTo: string; // ISO 8601
  side: "credit" | "debit";
}

/**
 * Fetches all transactions for a given period, handling pagination.
 */
export async function fetchTransactions(
  config: QontoClientConfig,
  params: FetchTransactionsParams
): Promise<QontoTransaction[]> {
  const all: QontoTransaction[] = [];
  let page = 1;

  while (true) {
    const search = new URLSearchParams({
      iban: params.iban,
      "settled_at_from": params.settledAtFrom,
      "settled_at_to": params.settledAtTo,
      side: params.side,
      "status[]": "completed",
      page: String(page),
      per_page: "100",
    });

    const url = `/v2/transactions?${search.toString()}`;
    const data = await qontoFetch<QontoTransactionsResponse>(url, config);

    all.push(...data.transactions);

    if (data.meta.next_page == null) break;
    page = data.meta.next_page;
  }

  return all;
}
