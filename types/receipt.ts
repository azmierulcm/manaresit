import type { Timestamp } from "firebase-admin/firestore";

export type ReceiptScanStatus =
  | "uploaded"
  | "processing"
  | "ocr_complete"
  | "needs_review"
  | "confirmed"
  | "failed";

export type ReceiptExtractedLineItem = {
  description: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
};

export type ReceiptExtractedFields = {
  vendor?: string;
  totalAmount?: number;       // always in MYR (converted if foreign)
  currency?: string;          // detected original currency (e.g. "USD")
  originalAmount?: number;    // amount in original currency (before conversion)
  exchangeRate?: number;      // rate used: 1 originalCurrency = exchangeRate MYR
  exchangeRateDate?: string;  // ISO date of the rate used
  receiptDate?: Timestamp;
  taxAmount?: number;
  lineItems?: ReceiptExtractedLineItem[];
};

export type ReceiptDoc = {
  id: string;
  userId: string;
  storagePath: string;
  downloadUrl?: string;
  originalFile: {
    name: string;
    mimeType: string;
    sizeBytes: number;
  };
  processedFile: {
    mimeType: "image/avif";
    sizeBytes: number;
    width?: number;
    height?: number;
  };
  scanStatus: ReceiptScanStatus;
  extracted: ReceiptExtractedFields;
  categorySuggestion?: {
    category: string;
    confidence: number;
    reason?: string;
  };
  transactionId?: string;
  security: {
    avifCompressed: boolean;
    savedToVault: boolean;
    virusScanStatus?: "pending" | "clean" | "failed";
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type ReceiptUploadExtractedFields = Omit<
  ReceiptExtractedFields,
  "receiptDate"
> & {
  receiptDate?: string;
};

export type ReceiptUploadResponse = {
  receiptId: string;
  storagePath: string;
  scanStatus: ReceiptScanStatus;
  processedFile: ReceiptDoc["processedFile"];
  extracted: ReceiptUploadExtractedFields;
  categorySuggestion: NonNullable<ReceiptDoc["categorySuggestion"]>;
  trustSignal: {
    label: string;
    description: string;
  };
};
