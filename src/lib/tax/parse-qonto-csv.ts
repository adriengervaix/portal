/**
 * Parses Qonto CSV export format.
 * Expected columns: "Date de la valeur (UTC)", "Nom de la contrepartie",
 * "Montant total (TTC)", "Montant total (HT)" — separator: semicolon.
 */

export interface QontoCsvRow {
  /** ISO date string */
  date: string;
  counterpartyName: string;
  /** Amount in cents */
  amountTtc: number;
  /** Amount in cents */
  amountHt: number;
}

/**
 * Parses a European amount string (e.g. "1 234,56" or "-1 234,56") to cents.
 */
function parseAmount(value: string): number {
  const cleaned = value.replace(/\s/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  if (Number.isNaN(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Extracts date from Qonto format (e.g. "2026-02-15 12:00:00" or "15/02/2026").
 */
function parseDate(raw: string): string {
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }
  const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }
  return trimmed;
}

/**
 * Parses Qonto CSV content and returns rows.
 * Handles semicolon separator and optional BOM.
 */
export function parseQontoCsv(content: string): QontoCsvRow[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const header = lines[0].replace(/^\uFEFF/, "").split(";").map((h) => h.trim());
  const dateIdx = header.findIndex(
    (h) =>
      h.includes("Date") && (h.includes("valeur") || h.toLowerCase().includes("date"))
  );
  const counterpartyIdx = header.findIndex(
    (h) =>
      h.includes("contrepartie") ||
      h.toLowerCase().includes("counterparty") ||
      h.toLowerCase().includes("nom")
  );
  const ttcIdx = header.findIndex(
    (h) => h.includes("TTC") || h.toLowerCase().includes("ttc")
  );
  const htIdx = header.findIndex(
    (h) => h.includes("HT") || h.toLowerCase().includes("ht")
  );

  if (dateIdx < 0 || counterpartyIdx < 0) {
    throw new Error("CSV format invalide : colonnes Date et Nom de la contrepartie requises");
  }

  const rows: QontoCsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(";").map((c) => c.trim().replace(/^"|"$/g, ""));
    if (cells.length < Math.max(dateIdx, counterpartyIdx) + 1) continue;

    const date = parseDate(cells[dateIdx] ?? "");
    const counterpartyName = (cells[counterpartyIdx] ?? "").trim();
    if (!counterpartyName) continue;

    const amountTtc = ttcIdx >= 0 ? parseAmount(cells[ttcIdx] ?? "0") : 0;
    const amountHt = htIdx >= 0 ? parseAmount(cells[htIdx] ?? "0") : amountTtc;

    rows.push({ date, counterpartyName, amountTtc, amountHt });
  }
  return rows;
}

/**
 * Detects the dominant month from a list of dates.
 */
export function detectDominantMonth(dates: string[]): string | null {
  if (dates.length === 0) return null;
  const counts: Record<string, number> = {};
  for (const d of dates) {
    const monthKey = d.slice(0, 7);
    counts[monthKey] = (counts[monthKey] ?? 0) + 1;
  }
  let max = 0;
  let dominant: string | null = null;
  for (const [key, count] of Object.entries(counts)) {
    if (count > max) {
      max = count;
      dominant = key;
    }
  }
  return dominant;
}
