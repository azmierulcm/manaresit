import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { Timestamp } from "firebase-admin/firestore";
import type { ReceiptExtractedFields } from "@/types/receipt";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
  _client = new Anthropic({ apiKey });
  return _client;
}

type ClaudeReceiptResult = {
  vendor?: string;
  totalAmount?: number;
  taxAmount?: number;
  currency?: string;
  receiptDate?: string; // YYYY-MM-DD
  lineItems?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
};

const EXTRACTION_PROMPT = `You are a receipt data extractor. Analyse this receipt image and return ONLY a valid JSON object — no markdown, no explanation, just the JSON.

Extract these fields:
- vendor: the store or restaurant name (string or null)
- totalAmount: the final payment amount as a number (e.g. 13800 or 45.50). For Korean receipts use 결제금액 or 합계. Do NOT include thousand separators.
- taxAmount: tax amount as a number (SST, GST, 부가세, VAT, etc.) or null
- currency: ISO 4217 code — detect from symbols or context:
    ₩ or Korean text with no symbol → "KRW"
    RM or Malay text → "MYR"
    $ → "USD"  S$ → "SGD"  A$ → "AUD"  ¥ or 円 → "JPY"  £ → "GBP"  € → "EUR"  ฿ → "THB"  Rp → "IDR"
    Default to "MYR" only if the receipt is clearly Malaysian.
- receiptDate: date as "YYYY-MM-DD" string or null
- lineItems: array of {description, quantity, unitPrice, total} — numbers only, no symbols

Example output for a Korean receipt:
{"vendor":"KFC 인천공항","totalAmount":13800,"taxAmount":1254,"currency":"KRW","receiptDate":"2026-05-29","lineItems":[{"description":"징거슈퍼세트","quantity":1,"unitPrice":11500,"total":11500},{"description":"에그타르트","quantity":1,"unitPrice":2300,"total":2300}]}`;

export async function extractReceiptWithClaude(
  jpegBuffer: Buffer,
): Promise<ReceiptExtractedFields> {
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: jpegBuffer.toString("base64"),
            },
          },
          { type: "text", text: EXTRACTION_PROMPT },
        ],
      },
    ],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "{}";

  // Strip accidental markdown fences
  const cleaned = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
  const result: ClaudeReceiptResult = JSON.parse(cleaned);

  const fields: ReceiptExtractedFields = {
    currency: result.currency ?? "MYR",
  };

  if (result.vendor) fields.vendor = result.vendor;
  if (typeof result.totalAmount === "number" && result.totalAmount > 0) {
    fields.totalAmount = result.totalAmount;
  }
  if (typeof result.taxAmount === "number") {
    fields.taxAmount = result.taxAmount;
  }
  if (result.receiptDate) {
    const d = new Date(result.receiptDate);
    if (!isNaN(d.getTime())) fields.receiptDate = Timestamp.fromDate(d);
  }
  if (result.lineItems?.length) {
    fields.lineItems = result.lineItems;
  }

  return fields;
}
