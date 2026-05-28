"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";

export type ClientReceipt = {
  id: string;
  userId: string;
  storagePath: string;
  scanStatus: "uploaded" | "processing" | "ocr_complete" | "needs_review" | "confirmed" | "failed";
  extracted: {
    vendor?: string;
    totalAmount?: number;
    currency?: string;
    taxAmount?: number;
    receiptDate?: Date;
  };
  categorySuggestion?: { category: string; confidence: number; reason?: string };
  originalFile?: { name: string; sizeBytes: number };
  transactionId?: string;
  createdAt: Date;
};

export function useReceipts(userId: string | null) {
  const [receipts, setReceipts] = useState<ClientReceipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const q = query(collection(db, "receipts"), where("userId", "==", userId));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs: ClientReceipt[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            userId: data.userId,
            storagePath: data.storagePath,
            scanStatus: data.scanStatus,
            extracted: {
              vendor: data.extracted?.vendor,
              totalAmount: data.extracted?.totalAmount,
              currency: data.extracted?.currency ?? "MYR",
              taxAmount: data.extracted?.taxAmount,
              receiptDate: data.extracted?.receiptDate?.toDate?.(),
            },
            categorySuggestion: data.categorySuggestion,
            originalFile: data.originalFile,
            transactionId: data.transactionId,
            createdAt: data.createdAt?.toDate?.() ?? new Date(),
          };
        });
        docs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setReceipts(docs);
        setIsLoading(false);
      },
      () => setIsLoading(false),
    );

    return unsub;
  }, [userId]);

  return { receipts, isLoading };
}
