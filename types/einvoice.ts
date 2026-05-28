import type { Timestamp } from "firebase-admin/firestore";

export type Address = {
  line1: string;
  line2?: string;
  line3?: string;
  city: string;
  stateCode?: string;
  postalCode: string;
  countryCode: "MYS" | string;
};

export type EinvoiceDocumentTypeCode =
  | "01"
  | "02"
  | "03"
  | "04"
  | "11"
  | "12"
  | "13"
  | "14";

export type EinvoiceStatus =
  | "draft"
  | "ready_for_validation"
  | "validated"
  | "submitted"
  | "accepted"
  | "rejected"
  | "cancelled";

export type EinvoiceDoc = {
  id: string;
  userId: string;
  documentTypeCode: EinvoiceDocumentTypeCode;
  documentVersion: "1.0" | "1.1";
  invoiceNumber: string;
  status: EinvoiceStatus;
  issueDate: Timestamp;
  currency: "MYR" | string;
  supplier: {
    name: string;
    tin: string;
    registrationNumber?: string;
    sstNumber?: string;
    msicCode?: string;
    email?: string;
    phone?: string;
    address: Address;
  };
  buyer: {
    name: string;
    tin?: string;
    registrationNumber?: string;
    email?: string;
    phone?: string;
    address?: Address;
  };
  lineItems: Array<{
    id: string;
    classificationCode?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    discountAmount?: number;
    taxType?: string;
    taxRate?: number;
    taxAmount?: number;
    totalExcludingTax: number;
    totalIncludingTax: number;
  }>;
  totals: {
    subtotal: number;
    discountTotal?: number;
    taxTotal?: number;
    totalExcludingTax: number;
    totalIncludingTax: number;
    payableAmount: number;
  };
  payment?: {
    mode?:
      | "cash"
      | "cheque"
      | "bank_transfer"
      | "credit_card"
      | "debit_card"
      | "e_wallet"
      | "other";
    terms?: string;
  };
  lhdn?: {
    submissionId?: string;
    uuid?: string;
    longId?: string;
    validationUrl?: string;
    validatedAt?: Timestamp;
    submittedAt?: Timestamp;
    rejectedReason?: string;
  };
  exports?: {
    pdfStoragePath?: string;
    csvStoragePath?: string;
    generatedAt?: Timestamp;
  };
  linkedTransactionIds?: string[];
  rawUblJson?: Record<string, unknown>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
