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
  vendor?: string | null;
  totalAmount?: number | string | null;
  taxAmount?: number | string | null;
  currency?: string;
  receiptDate?: string | null;
  lineItems?: Array<{
    description: string;
    quantity: number | string;
    unitPrice: number | string;
    total: number | string;
  }>;
};

// Parse a value that Claude may return as a number OR a string like "13,800"
function toNumber(val: number | string | null | undefined): number | undefined {
  if (val == null) return undefined;
  if (typeof val === "number") return isFinite(val) ? val : undefined;
  const n = parseFloat(String(val).replace(/,/g, "").trim());
  return isFinite(n) ? n : undefined;
}

const EXTRACTION_PROMPT = `You are a receipt data extractor. Analyse this receipt image and return ONLY a valid JSON object — no markdown, no explanation, just the JSON.

Extract these fields:
- vendor: the business/company name printed at the top of the receipt (string). If the name is unclear, use the branch name or address. Never return null — use your best guess from the receipt header.
- totalAmount: the final payment amount as a plain JSON number with no commas or symbols (e.g. 13800 or 45.50). For Korean: use 결제금액 or 합계. For Malaysian: use TOTAL or JUMLAH.
- taxAmount: tax/VAT amount as a plain JSON number or null (SST, GST, 부가세, VAT, service charge, etc.)
- currency: ISO 4217 code — detect from context:
    Korean text or Korean store → "KRW"
    RM / RINGGIT / Malaysian store → "MYR"
    $ → "USD"  S$ → "SGD"  A$ → "AUD"  ¥ or 円 → "JPY"  £ → "GBP"  € → "EUR"  ฿ → "THB"  Rp → "IDR"
    When uncertain, infer from the country/language of the receipt.
- receiptDate: date as "YYYY-MM-DD" string or null
- lineItems: array of {description, quantity, unitPrice, total} with plain numbers

Example — Korean receipt:
{"vendor":"KFC 인천공항","totalAmount":13800,"taxAmount":1254,"currency":"KRW","receiptDate":"2026-05-29","lineItems":[{"description":"징거슈퍼세트","quantity":1,"unitPrice":11500,"total":11500},{"description":"에그타르트","quantity":1,"unitPrice":2300,"total":2300}]}`;

export async function extractReceiptWithClaude(
  jpegBuffer: Buffer,
): Promise<ReceiptExtractedFields> {
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
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

  const total = toNumber(result.totalAmount);
  if (total != null && total > 0) fields.totalAmount = total;

  const tax = toNumber(result.taxAmount);
  if (tax != null && tax >= 0) fields.taxAmount = tax;

  if (result.receiptDate) {
    const d = new Date(result.receiptDate);
    if (!isNaN(d.getTime())) fields.receiptDate = Timestamp.fromDate(d);
  }

  if (result.lineItems?.length) {
    fields.lineItems = result.lineItems.map((item) => ({
      description: item.description,
      quantity: toNumber(item.quantity) ?? 1,
      unitPrice: toNumber(item.unitPrice) ?? 0,
      total: toNumber(item.total) ?? 0,
    }));
  }

  return fields;
}
