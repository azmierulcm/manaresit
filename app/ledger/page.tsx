"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { ProtectedPage } from "@/components/auth/protected-page";
import { TransactionItem } from "@/components/transactions/transaction-item";
import { AddTransactionModal } from "@/components/transactions/add-transaction-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/auth/auth-provider";
import { useTransactions, type ClientTransaction } from "@/hooks/use-transactions";
import { AppShell } from "@/components/layout/app-shell";
import { cn } from "@/lib/utils";

type TxFilter = "all" | "income" | "expense";

const FILTERS: Array<{ key: TxFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "income", label: "Income" },
  { key: "expense", label: "Expenses" },
];

const money = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
  maximumFractionDigits: 2,
});

function filterTx(txns: ClientTransaction[], filter: TxFilter): ClientTransaction[] {
  if (filter === "all") return txns;
  return txns.filter((t) => t.type === filter);
}

function LedgerView() {
  const { user } = useAuth();
  const { transactions, isLoading } = useTransactions(user?.uid ?? null);
  const [filter, setFilter] = useState<TxFilter>("all");
  const [addOpen, setAddOpen] = useState(false);

  const filtered = filterTx(transactions, filter);

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <>
      {user && (
        <AddTransactionModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          userId={user.uid}
        />
      )}

      <AppShell title="Ledger">
        <div className="space-y-4">
          {/* Summary row */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <p className="text-xs font-medium text-zinc-500">Total income</p>
              {isLoading ? (
                <Skeleton className="mt-1 h-6 w-28" />
              ) : (
                <p className="mt-1 text-base font-semibold text-emerald-600">
                  {money.format(totalIncome)}
                </p>
              )}
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-zinc-500">Total expenses</p>
              {isLoading ? (
                <Skeleton className="mt-1 h-6 w-28" />
              ) : (
                <p className="mt-1 text-base font-semibold text-rose-600">
                  {money.format(totalExpenses)}
                </p>
              )}
            </Card>
          </div>

          {/* Header + Add button */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-1.5 rounded-2xl border border-zinc-200 bg-zinc-50 p-1">
              {FILTERS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-xs font-medium transition",
                    filter === key
                      ? "bg-white shadow-sm text-zinc-950"
                      : "text-zinc-500 hover:text-zinc-700",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <Button
              className="h-9 gap-1.5 bg-rose-500 px-3 text-xs hover:bg-rose-600"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>

          {/* Transaction list */}
          <Card className="p-4 sm:p-5">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-zinc-400">
                  {filter === "all"
                    ? "No transactions yet."
                    : `No ${filter} transactions.`}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  Add one manually or scan a receipt.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {filtered.map((tx) => (
                  <TransactionItem key={tx.id} tx={tx} />
                ))}
              </div>
            )}
          </Card>
        </div>
      </AppShell>
    </>
  );
}

export default function LedgerPage() {
  return (
    <ProtectedPage>
      <LedgerView />
    </ProtectedPage>
  );
}
