/**
 * Utilities for tax declaration month keys and status.
 */

/** Returns month key "YYYY-MM" for a given date */
export function getMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

const START_YEAR = 2026;
const START_MONTH = 1; // January

/** Returns month keys from Jan 2026 to current month (newest first) */
export function getLastMonthKeys(count: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  const startDate = new Date(START_YEAR, START_MONTH - 1, 1);
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    if (d < startDate) break;
    keys.push(getMonthKey(d));
  }
  return keys;
}

/** Days remaining in the month for declaration (deadline = 19th of next month for URSSAF) */
export function getDaysRemaining(monthKey: string): number {
  const [y, m] = monthKey.split("-").map(Number);
  const deadline = new Date(y, m, 19); // 19th of next month
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

/** Format month key to display "Février 2026" */
export function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const date = new Date(y, m - 1, 1);
  const s = date.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}
