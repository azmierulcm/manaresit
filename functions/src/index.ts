import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

initializeApp();

const db = getFirestore();

export const processReceiptOcr = onDocumentCreated(
  "receipts/{receiptId}",
  async (event) => {
    const snapshot = event.data;

    if (!snapshot) {
      return;
    }

    const receipt = snapshot.data();

    if (receipt.scanStatus !== "uploaded" && receipt.scanStatus !== "processing") {
      return;
    }

    await db.collection("receipts").doc(event.params.receiptId).update({
      scanStatus: "ocr_complete",
      extracted: {
        vendor: "Merchant pending review",
        totalAmount: 42.8,
        currency: "MYR",
        taxAmount: 0,
        lineItems: [
          {
            description: "Receipt total detected by OCR placeholder",
            quantity: 1,
            unitPrice: 42.8,
            total: 42.8,
          },
        ],
      },
      categorySuggestion: {
        category: "Food",
        confidence: 0.64,
        reason: "Default starter rule until the OCR provider is connected.",
      },
      updatedAt: new Date(),
    });
  },
);
