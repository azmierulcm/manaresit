import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import type { ReceiptExtractedFields } from "@/types/receipt";

export function parseReceiptText(text: string): ReceiptExtractedFields {
  if (!text.trim()) {
    return { currency: "MYR" };
  }

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const vendor = extractVendor(lines);
  const totalAmount = extractTotal(text);
  const taxAmount = extractTax(text);
  const receiptDate = extractDate(text);

  return {
    vendor,
    totalAmount,
    taxAmount: taxAmount ?? 0,
    currency: "MYR",
    receiptDate: receiptDate ? Timestamp.fromDate(receiptDate) : Timestamp.now(),
    lineItems:
      totalAmount != null
        ? [
            {
              description: vendor ?? "Receipt total",
              quantity: 1,
              unitPrice: totalAmount,
              total: totalAmount,
            },
          ]
        : [],
  };
}

export function suggestCategory(
  vendor?: string,
  rawText?: string,
): { category: string; confidence: number; reason?: string } {
  const combined = `${vendor ?? ""} ${rawText ?? ""}`.toLowerCase();

  const rules: Array<[string[], string, number]> = [
    [
      ["grab", "myrapid", "rapidkl", "petrol", "shell", "petronas", "bpcml", "caltex", "toll", "parking", "lrt", "mrt", "commuter"],
      "Transport",
      0.82,
    ],
    [
      ["tnb", "tenaga", "air selangor", "syabas", "indah water", "celcom", "maxis", "unifi", "digi", "time dotcom", "astro", "electricity", "water bill"],
      "Utilities",
      0.85,
    ],
    [
      ["watson", "guardian", "klinik", "hospital", "farmasi", "pharmacy", "clinic", "ubat", "penawar", "mediviron", "pantai"],
      "Health",
      0.8,
    ],
    [
      ["jaya grocer", "cold storage", "isetan", "lotus", "mydin", "giant", "tesco", "aeon", "village grocer", "ben's", "bens", "supermarket", "hypermarket"],
      "Groceries",
      0.85,
    ],
    [
      ["mcdonald", "kfc", "subway", "pizza", "domino", "starbucks", "chatime", "tealive", "oldtown", "mamak", "restoran", "kopitiam", "cafe", "restaurant", "nasi", "makan", "coffee"],
      "Food",
      0.8,
    ],
    [
      ["office", "stationery", "printer", "adobe", "microsoft", "zoom", "slack", "dropbox", "hosting", "domain", "aws", "google cloud"],
      "Office",
      0.75,
    ],
    [
      ["hotel", "airbnb", "agoda", "booking.com", "flight", "airasia", "malindo", "mas", "firefly", "express"],
      "Travel",
      0.8,
    ],
    [
      ["lazada", "shopee", "amazon", "zalora", "h&m", "zara", "uniqlo", "padini", "bonia"],
      "Shopping",
      0.75,
    ],
  ];

  for (const [keywords, category, confidence] of rules) {
    if (keywords.some((k) => combined.includes(k))) {
      return {
        category,
        confidence,
        reason: `Vendor keywords match ${category}.`,
      };
    }
  }

  return {
    category: "Food",
    confidence: 0.5,
    reason: "Default category — please review.",
  };
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function extractVendor(lines: string[]): string | undefined {
  const SKIP = /^(receipt|resit|invoice|invois|bill|bil|tax|sst|gst|thank|terima|www\.|http)/i;
  const NUMBERS_ONLY = /^[\d\s\.\,\-\/\:]+$/;

  for (const line of lines.slice(0, 6)) {
    if (line.length < 3) continue;
    if (SKIP.test(line)) continue;
    if (NUMBERS_ONLY.test(line)) continue;
    return line;
  }

  return lines[0];
}

function extractTotal(text: string): number | undefined {
  // Most specific patterns first — also handles newline between label and amount
  const patterns = [
    /GRAND\s+TOTAL[\s\n:RM]*([\d,]+\.?\d*)/i,
    /TOTAL\s+AMOUNT[\s\n:RM]*([\d,]+\.?\d*)/i,
    /AMOUNT\s+DUE[\s\n:RM]*([\d,]+\.?\d*)/i,
    /NET\s+TOTAL[\s\n:RM]*([\d,]+\.?\d*)/i,
    /JUMLAH\s+KESELURUHAN[\s\n:RM]*([\d,]+\.?\d*)/i,
    /JUMLAH[\s\n:RM]*([\d,]+\.?\d*)/i,
    /TOTAL[\s\n:RM]*([\d,]+\.?\d*)/i,
    /BAYARAN[\s\n:RM]*([\d,]+\.?\d*)/i,
    /AMOUNT[\s\n:RM]*([\d,]+\.?\d*)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const value = parseFloat(match[1].replace(/,/g, ""));
      if (!isNaN(value) && value > 0 && value < 100000) return value;
    }
  }

  // Fallback: collect all RM-prefixed amounts and return the largest
  const rmAmounts = [...text.matchAll(/RM\s*([\d,]+\.\d{2})/gi)]
    .map((m) => parseFloat(m[1].replace(/,/g, "")))
    .filter((v) => !isNaN(v) && v > 0 && v < 100000);
  if (rmAmounts.length > 0) return Math.max(...rmAmounts);

  return undefined;
}

function extractTax(text: string): number | undefined {
  const patterns = [
    /SST[\s:RM]+([\d,]+\.?\d*)/i,
    /GST[\s:RM]+([\d,]+\.?\d*)/i,
    /SERVICE\s+TAX[\s:RM]+([\d,]+\.?\d*)/i,
    /SERVICE\s+CHARGE[\s:RM]+([\d,]+\.?\d*)/i,
    /CUKAI\s+PERKHIDMATAN[\s:RM]+([\d,]+\.?\d*)/i,
    /TAX[\s:RM]+([\d,]+\.?\d*)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const value = parseFloat(match[1].replace(/,/g, ""));
      if (!isNaN(value) && value >= 0) return value;
    }
  }

  return undefined;
}

function extractDate(text: string): Date | null {
  const currentYear = new Date().getFullYear();

  // YYYY-MM-DD (ISO) — check first to avoid misparse
  const ymd = text.match(/\b(\d{4})[\/\-](\d{2})[\/\-](\d{2})\b/);
  if (ymd) {
    const d = new Date(parseInt(ymd[1]), parseInt(ymd[2]) - 1, parseInt(ymd[3]));
    if (!isNaN(d.getTime()) && d.getFullYear() > 2000) return d;
  }

  // DD/MM/YYYY or DD-MM-YYYY (4-digit year)
  const dmy4 = text.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/);
  if (dmy4) {
    const d = new Date(parseInt(dmy4[3]), parseInt(dmy4[2]) - 1, parseInt(dmy4[1]));
    if (!isNaN(d.getTime()) && d.getFullYear() > 2000) return d;
  }

  // DD/MM/YY or DD-MM-YY (2-digit year — common on Malaysian receipts)
  const dmy2 = text.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})\b/);
  if (dmy2) {
    const yy = parseInt(dmy2[3]);
    const year = yy + (yy <= currentYear % 100 + 5 ? 2000 : 1900);
    const d = new Date(year, parseInt(dmy2[2]) - 1, parseInt(dmy2[1]));
    if (!isNaN(d.getTime()) && d.getFullYear() > 2000) return d;
  }

  // "15 Jan 2024" or "15 January 2024"
  const written = text.match(
    /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+(\d{4})\b/i,
  );
  if (written) {
    const d = new Date(`${written[2]} ${written[1]}, ${written[3]}`);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}
