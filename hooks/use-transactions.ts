"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";

export type ClientTransaction = {
  id: string;
  userId: string;
  type: "income" | "expense";
  source: "manual" | "receipt_scan" | "einvoice";
  status: "draft" | "confirmed" | "archived";
  amount: number;
  currency: string;
  category: string;
  title: string;
  description?: string;
  vendor?: { name?: string };
  transactionDate: Date;
  paymentMethod?: string;
  receiptId?: string;
  createdAt: Date;
};

export function useTransactions(userId: string | null) {
  const [transactions, setTransactions] = useState<ClientTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const q = query(collection(db, "transactions"), where("userId", "==", userId));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs: ClientTransaction[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            userId: data.userId,
            type: data.type,
            source: data.source ?? "manual",
            status: data.status ?? "confirmed",
            amount: data.amount ?? 0,
            currency: data.currency ?? "MYR",
            category: data.category ?? "Other",
            title: data.title ?? "Transaction",
            description: data.description,
            vendor: data.vendor,
            transactionDate: data.transactionDate?.toDate?.() ?? new Date(),
            paymentMethod: data.paymentMethod,
            receiptId: data.receiptId,
            createdAt: data.createdAt?.toDate?.() ?? new Date(),
          };
        });
        docs.sort((a, b) => b.transactionDate.getTime() - a.transactionDate.getTime());
        setTransactions(docs);
        setIsLoading(false);
      },
      () => setIsLoading(false),
    );

    return unsub;
  }, [userId]);

  return { transactions, isLoading };
}
