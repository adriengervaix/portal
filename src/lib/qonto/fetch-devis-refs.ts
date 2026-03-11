/**
 * Fetches Qonto transactions and extracts devis references from labels.
 * Used for autocomplete and amount lookup.
 */

import { fetchTransactions } from "./fetch-transactions";
import type { QontoClientConfig } from "./client";

const DEVIS_PATTERN = /devis[-\s]?(\d+)/gi;

/**
 * Extracts devis references from a label (e.g. "devis-003", "devis 012").
 */
function extractDevisRefs(label: string): string[] {
  const refs: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(DEVIS_PATTERN.source, "gi");
  while ((m = re.exec(label)) !== null) {
    const num = m[1];
    refs.push(`devis-${num.padStart(3, "0")}`);
  }
  return refs;
}

/**
 * Normalizes user input to devis reference format (e.g. "003" → "devis-003").
 */
export function normalizeDevisRef(input: string): string {
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return trimmed;
  return `devis-${digits.padStart(3, "0")}`;
}

/**
 * Fetches unique devis references from Qonto credit transactions.
 * Searches last 24 months.
 */
export async function fetchDevisRefsFromQonto(
  config: QontoClientConfig,
  iban: string
): Promise<string[]> {
  const refs = new Set<string>();
  const now = new Date();

  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const from = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
    const to = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

    const transactions = await fetchTransactions(config, {
      iban,
      settledAtFrom: from,
      settledAtTo: to,
      side: "credit",
    });

    for (const t of transactions) {
      const label = t.label ?? "";
      const counterparty = t.clean_counterparty_name ?? "";
      for (const ref of [
        ...extractDevisRefs(label),
        ...extractDevisRefs(counterparty),
      ]) {
        refs.add(ref);
      }
    }
  }

  return Array.from(refs).sort();
}

/**
 * Finds the amount (HT in cents) for a devis reference in Qonto transactions.
 * Returns the first matching credit transaction amount.
 */
export async function fetchDevisAmountFromQonto(
  config: QontoClientConfig,
  iban: string,
  devisRef: string
): Promise<{ amountHt: number } | null> {
  const normalized = normalizeDevisRef(devisRef);
  const now = new Date();

  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const from = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
    const to = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

    const transactions = await fetchTransactions(config, {
      iban,
      settledAtFrom: from,
      settledAtTo: to,
      side: "credit",
    });

    for (const t of transactions) {
      const label = (t.label ?? "").toLowerCase();
      const counterparty = (t.clean_counterparty_name ?? "").toLowerCase();
      const search = normalized.toLowerCase();
      if (label.includes(search) || counterparty.includes(search)) {
        const amountTtc = Math.abs(t.amount_cents);
        const vatCents = t.vat_amount_cents ?? 0;
        const amountHt = Math.max(0, amountTtc - vatCents);
        return { amountHt };
      }
    }
  }

  return null;
}
