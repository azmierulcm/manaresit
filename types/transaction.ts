import type { Timestamp } from "firebase-admin/firestore";

export type TransactionType = "income" | "expense";
export type TransactionSource = "manual" | "receipt_scan" | "einvoice";
export type TransactionStatus = "draft" | "confirmed" | "archived";

export type TransactionCategory =
  | "Food"
  | "Transport"
  | "Utilities"
  | "Rent"
  | "Salary"
  | "Office"
  | "Tax"
  | "Other"
  | string;

export type TransactionDoc = {
  id: string;
  userId: string;
  type: TransactionType;
  source: TransactionSource;
  status: TransactionStatus;
  amount: number;
  currency: "MYR" | string;
  category: TransactionCategory;
  title: string;
  description?: string;
  vendor?: {
    name?: string;
    normalizedName?: string;
  };
  transactionDate: Timestamp;
  paymentMethod?:
    | "cash"
    | "card"
    | "bank_transfer"
    | "e_wallet"
    | "other";
  receiptId?: string;
  einvoiceId?: string;
  ai?: {
    categorizedBy: "vision" | "openai" | "rules";
    confidence: number;
    extractedFields?: {
      total?: number;
      vendor?: string;
      date?: string;
      taxAmount?: number;
    };
    reviewedByUser: boolean;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
