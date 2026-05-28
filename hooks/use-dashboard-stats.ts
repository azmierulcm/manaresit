"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";
import { collection } from "firebase/firestore";

export type DashboardStats = {
  balance: number;
  income: number;
  expenses: number;
  vaultCount: number;
  einvoicesReady: number;
  scanQueue: number;
  weeklyTrend: Array<{ day: string; spend: number; income: number }>;
  categorySpend: Array<{ category: string; amount: number }>;
  recentActivity: Array<{
    title: string;
    detail: string;
    amount: string;
    status: string;
  }>;
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function emptyStats(): DashboardStats {
  const now = new Date();
  const weeklyTrend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    return { day: DAY_LABELS[d.getDay()], spend: 0, income: 0 };
  });
  return {
    balance: 0,
    income: 0,
    expenses: 0,
    vaultCount: 0,
    einvoicesReady: 0,
    scanQueue: 0,
    weeklyTrend,
    categorySpend: [],
    recentActivity: [],
  };
}

export function useDashboardStats(userId: string | null) {
  const [stats, setStats] = useState<DashboardStats>(emptyStats());
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);

      const [txSnap, receiptSnap, einvoiceSnap] = await Promise.all([
        getDocs(query(collection(db, "transactions"), where("userId", "==", userId))),
        getDocs(query(collection(db, "receipts"), where("userId", "==", userId))),
        getDocs(query(collection(db, "einvoices"), where("userId", "==", userId))),
      ]);

      // Transactions
      const transactions = txSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          type: data.type as "income" | "expense",
          amount: (data.amount as number) ?? 0,
          category: (data.category as string) ?? "Other",
          title: (data.title as string) ?? "Transaction",
          source: (data.source as string) ?? "manual",
          status: (data.status as string) ?? "draft",
          transactionDate: data.transactionDate?.toDate?.() as Date | undefined,
          createdAt: data.createdAt?.toDate?.() as Date | undefined,
        };
      });

      // Sort descending by transactionDate
      transactions.sort((a, b) => {
        const da = a.transactionDate?.getTime() ?? a.createdAt?.getTime() ?? 0;
        const db2 = b.transactionDate?.getTime() ?? b.createdAt?.getTime() ?? 0;
        return db2 - da;
      });

      // Current month filter
      const monthTxns = transactions.filter((tx) => {
        const d = tx.transactionDate ?? tx.createdAt;
        return d ? d >= monthStart : false;
      });

      const income = monthTxns
        .filter((tx) => tx.type === "income")
        .reduce((sum, tx) => sum + tx.amount, 0);
      const expenses = monthTxns
        .filter((tx) => tx.type === "expense")
        .reduce((sum, tx) => sum + tx.amount, 0);

      // Weekly trend (last 7 days)
      const weeklyMap = new Map<string, { spend: number; income: number }>();
      const weeklyTrend = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (6 - i));
        const key = DAY_LABELS[d.getDay()];
        const entry = { day: key, spend: 0, income: 0 };
        weeklyMap.set(d.toDateString(), entry);
        return entry;
      });
      transactions
        .filter((tx) => {
          const d = tx.transactionDate ?? tx.createdAt;
          return d ? d >= weekStart : false;
        })
        .forEach((tx) => {
          const d = tx.transactionDate ?? tx.createdAt;
          if (!d) return;
          const entry = weeklyMap.get(d.toDateString());
          if (!entry) return;
          if (tx.type === "expense") entry.spend += tx.amount;
          else entry.income += tx.amount;
        });

      // Category spend (current month expenses)
      const catMap = new Map<string, number>();
      monthTxns
        .filter((tx) => tx.type === "expense")
        .forEach((tx) => {
          catMap.set(tx.category, (catMap.get(tx.category) ?? 0) + tx.amount);
        });
      const categorySpend = Array.from(catMap.entries())
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      // Recent activity (last 5 transactions)
      const recentActivity = transactions.slice(0, 5).map((tx) => ({
        title: tx.title,
        detail: `${tx.category} · ${tx.source === "receipt_scan" ? "Receipt" : "Manual"}`,
        amount: `${tx.type === "income" ? "+" : "-"}RM ${tx.amount.toFixed(2)}`,
        status: tx.status === "confirmed" ? "Confirmed" : "Pending",
      }));

      // Receipts
      const vaultCount = receiptSnap.size;
      const scanQueue = receiptSnap.docs.filter((d) => {
        const s = d.data().scanStatus as string;
        return s === "needs_review" || s === "ocr_complete";
      }).length;

      // E-invoices
      const einvoicesReady = einvoiceSnap.docs.filter((d) => {
        const s = d.data().status as string;
        return s === "ready_for_validation" || s === "validated" || s === "accepted";
      }).length;

      setStats({
        balance: income - expenses,
        income,
        expenses,
        vaultCount,
        einvoicesReady,
        scanQueue,
        weeklyTrend,
        categorySpend,
        recentActivity,
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  return { stats, isLoading, refresh: load };
}
