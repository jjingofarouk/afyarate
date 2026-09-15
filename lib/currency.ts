/** Client-safe currency helpers (no server imports).
 *
 *  Imported by server components AND client components, so this module must
 *  never import Supabase, next/headers or any other server-only code.
 */

/**
 * How many Ugandan shillings make 1 US dollar.
 * Update this single number whenever the rate moves — every
 * consultation-fee display converts through it automatically.
 */
export const UGX_PER_USD = 3720;

export function usdFromUgx(ugx: number): number {
  return ugx / UGX_PER_USD;
}

function formatUsd(n: number): string {
  if (!Number.isFinite(n)) return "";
  return n >= 100 ? String(Math.round(n)) : String(Math.round(n * 100) / 100);
}

/**
 * "UGX 30,000" -> "UGX 30,000 (USD 8.06)".
 * Ranges convert both ends: "20,000 - 50,000" -> "UGX 20,000 - 50,000 (USD 5.38–13.44)".
 * Returns the input unchanged when no number is found, or when it already
 * mentions USD (so we never double up).
 */
export function formatFeeWithUsd(fee: string | null | undefined): string | null {
  if (!fee) return null;
  const t = fee.trim();
  if (!t) return null;
  if (/usd/i.test(t)) return t;
  const amounts = [...t.matchAll(/(\d[\d,]*)/g)]
    .map((m) => Number(m[1].replace(/,/g, "")))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (amounts.length === 0) return t;
  const withPrefix = /ugx|ush|\/=|shs/i.test(t) ? t : `UGX ${t}`;
  const lo = Math.min(...amounts);
  const hi = Math.max(...amounts);
  const usd =
    amounts.length === 1
      ? `USD ${formatUsd(usdFromUgx(lo))}`
      : `USD ${formatUsd(usdFromUgx(lo))}–${formatUsd(usdFromUgx(hi))}`;
  return `${withPrefix} (${usd})`;
}
