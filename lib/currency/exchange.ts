import "server-only";

// Module-level cache — lives for the lifetime of the serverless function instance
const RATE_CACHE = new Map<string, { rate: number; fetchedAt: number }>();
const TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Fetch live exchange rate via Frankfurter (European Central Bank data).
 * Free, no API key required. Covers: USD, EUR, GBP, JPY, SGD, THB, IDR,
 * PHP, HKD, CNY, AUD, KRW, INR, MYR, and 20+ more.
 */
export async function getExchangeRate(from: string, to: string = "MYR"): Promise<number> {
  if (from === to) return 1;

  const key = `${from}:${to}`;
  const cached = RATE_CACHE.get(key);
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) {
    return cached.rate;
  }

  const res = await fetch(
    `https://api.frankfurter.app/latest?from=${from}&to=${to}`,
    { next: { revalidate: 3600 } }, // Next.js data cache 1 hour
  );

  if (!res.ok) {
    throw new Error(`Exchange rate fetch failed (${from}→${to}): HTTP ${res.status}`);
  }

  const data = (await res.json()) as {
    date: string;
    rates: Record<string, number>;
  };

  const rate = data.rates[to];
  if (!rate) throw new Error(`No rate returned for ${from}→${to}`);

  RATE_CACHE.set(key, { rate, fetchedAt: Date.now() });
  return rate;
}

/**
 * Detect currency from OCR text.
 * Priority: MYR indicators first, then explicit codes, then symbols.
 */
export function detectCurrency(text: string): string {
  // ── 1. Malaysian indicators — check first so RM receipts are never mis-detected ──
  if (/\bRM\b|\bMYR\b|RINGGIT|JUMLAH|SST\s*ID|TIN\s*:|LHDN|MYINVOIS/i.test(text)) {
    return "MYR";
  }

  const up = text.toUpperCase();

  // ── 2. Explicit 3-letter ISO codes (most reliable) ──
  const ISO_CODES = [
    "USD", "EUR", "GBP", "JPY", "SGD", "AUD", "CAD", "CHF",
    "HKD", "CNY", "KRW", "THB", "IDR", "PHP", "INR", "TWD",
    "NZD", "SEK", "NOK", "DKK", "BND", "VND", "MMK",
  ];
  for (const code of ISO_CODES) {
    if (new RegExp(`\\b${code}\\b`).test(up)) return code;
  }

  // ── 3. Disambiguated dollar variants ──
  if (/S\$/.test(text)) return "SGD";
  if (/A\$/.test(text)) return "AUD";
  if (/HK\$/.test(text)) return "HKD";
  if (/NZ\$/.test(text)) return "NZD";
  if (/US\$/.test(text)) return "USD";
  if (/CA\$/.test(text)) return "CAD";

  // ── 4. Other currency symbols / keywords ──
  if (/Rp\s*[\d,]/.test(text))           return "IDR";  // Indonesian Rupiah
  if (/[₱]|PISO/i.test(text))            return "PHP";  // Philippine Peso
  if (/[฿]|BAHT/i.test(text))            return "THB";  // Thai Baht
  if (/[₩]|원/.test(text))               return "KRW";  // Korean Won
  if (/[₹]|Rs\.?\s*\d/i.test(text))      return "INR";  // Indian Rupee
  if (/RMB|人民币|元/.test(text))         return "CNY";  // Chinese Yuan
  if (/[€]/.test(text))                  return "EUR";
  if (/[£]/.test(text))                  return "GBP";
  if (/[¥]|円|YEN/i.test(text))          return "JPY";

  // ── 5. Lone $ — most likely USD when no Malaysian context ──
  if (/\$/.test(text)) return "USD";

  // ── 6. Default ──
  return "MYR";
}

/** Human-readable currency name for UI */
export const CURRENCY_NAMES: Record<string, string> = {
  MYR: "Malaysian Ringgit",
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  JPY: "Japanese Yen",
  SGD: "Singapore Dollar",
  AUD: "Australian Dollar",
  CAD: "Canadian Dollar",
  CHF: "Swiss Franc",
  HKD: "Hong Kong Dollar",
  CNY: "Chinese Yuan",
  KRW: "Korean Won",
  THB: "Thai Baht",
  IDR: "Indonesian Rupiah",
  PHP: "Philippine Peso",
  INR: "Indian Rupee",
  TWD: "Taiwan Dollar",
  NZD: "New Zealand Dollar",
  BND: "Brunei Dollar",
  VND: "Vietnamese Dong",
};
