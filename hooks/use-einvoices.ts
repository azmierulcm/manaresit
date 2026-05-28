"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";

export type ClientEinvoice = {
  id: string;
  userId: string;
  invoiceNumber: string;
  status: "draft" | "ready_for_validation" | "validated" | "submitted" | "accepted" | "rejected" | "cancelled";
  issueDate: Date;
  currency: string;
  supplier: { name: string; tin: string };
  buyer: { name: string };
  totals: { payableAmount: number };
  createdAt: Date;
};

export function useEinvoices(userId: string | null) {
  const [einvoices, setEinvoices] = useState<ClientEinvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, "einvoices"),
      where("userId", "==", userId),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              userId: data.userId,
              invoiceNumber: data.invoiceNumber ?? `INV-${d.id.slice(0, 6).toUpperCase()}`,
              status: data.status ?? "draft",
              issueDate: data.issueDate?.toDate?.() ?? new Date(),
              currency: data.currency ?? "MYR",
              supplier: data.supplier ?? { name: "Unknown", tin: "" },
              buyer: data.buyer ?? { name: "Unknown" },
              totals: data.totals ?? { payableAmount: 0 },
              createdAt: data.createdAt?.toDate?.() ?? new Date(),
            } as ClientEinvoice;
          });
        docs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setEinvoices(docs);
        setIsLoading(false);
      },
      () => setIsLoading(false),
    );

    return unsub;
  }, [userId]);

  return { einvoices, isLoading };
}
