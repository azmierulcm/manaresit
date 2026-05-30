import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { Timestamp } from "firebase-admin/firestore";
import type { ReceiptExtractedFields } from "@/types/receipt";

let _client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (_client) return _client;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");
  _client = new GoogleGenerativeAI(apiKey);
  return _client;
}

// Handles both number and string amounts (e.g. "13,800" or 13800)
function toNumber(val: unknown): number | undefined {
  if (val == null) return undefined;
  if (typeof val === "number") return isFinite(val) ? val : undefined;
  const n = parseFloat(String(val).replace(/,/g, "").trim());
  return isFinite(n) ? n : undefined;
}

const EXTRACTION_PROMPT = `You are a receipt OCR extractor. Look at this receipt image carefully and return ONLY a valid JSON object — no markdown fences, no explanation, just raw JSON.

Extract:
- vendor: business/company name from the receipt header. Never null — use address or branch if name unclear.
- totalAmount: final payment amount as a plain number, no commas or symbols (e.g. 13800 or 45.50)
- taxAmount: tax/VAT as a plain number or null (SST, GST, 부가세, VAT, service charge)
- currency: ISO 4217 code inferred from receipt context:
    Korean text / Korean store → "KRW"
    RM / RINGGIT / Malaysian store → "MYR"
    $ → "USD", S$ → "SGD", ¥ or 円 → "JPY", £ → "GBP", € → "EUR", ฿ → "THB", Rp → "IDR"
- receiptDate: "YYYY-MM-DD" or null
- lineItems: array of {description, quantity, unitPrice, total} with plain numbers

Korean receipt example:
{"vendor":"KFC 인천공항","totalAmount":13800,"taxAmount":1254,"currency":"KRW","receiptDate":"2026-05-29","lineItems":[{"description":"징거슈퍼세트","quantity":1,"unitPrice":11500,"total":11500}]}

Malaysian receipt example:
{"vendor":"MYDIN HYPERMARKET","totalAmount":45.50,"taxAmount":2.50,"currency":"MYR","receiptDate":"2026-05-30","lineItems":[]}`;

export async function extractReceiptWithGemini(
  jpegBuffer: Buffer,
): Promise<ReceiptExtractedFields> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent([
    {
      inlineData: {
        data: jpegBuffer.toString("base64"),
        mimeType: "image/jpeg",
      },
    },
    EXTRACTION_PROMPT,
  ]);

  const raw = result.response.text().trim();
  const cleaned = raw
    .replace(/^```(?:json)?\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned);

  const fields: ReceiptExtractedFields = {
    currency: typeof parsed.currency === "string" ? parsed.currency : "MYR",
  };

  if (parsed.vendor) fields.vendor = String(parsed.vendor);

  const total = toNumber(parsed.totalAmount);
  if (total != null && total > 0) fields.totalAmount = total;

  const tax = toNumber(parsed.taxAmount);
  if (tax != null && tax >= 0) fields.taxAmount = tax;

  if (parsed.receiptDate) {
    const d = new Date(parsed.receiptDate);
    if (!isNaN(d.getTime())) fields.receiptDate = Timestamp.fromDate(d);
  }

  if (Array.isArray(parsed.lineItems) && parsed.lineItems.length > 0) {
    fields.lineItems = parsed.lineItems.map((item: Record<string, unknown>) => ({
      description: String(item.description ?? ""),
      quantity: toNumber(item.quantity) ?? 1,
      unitPrice: toNumber(item.unitPrice) ?? 0,
      total: toNumber(item.total) ?? 0,
    }));
  }

  return fields;
}
