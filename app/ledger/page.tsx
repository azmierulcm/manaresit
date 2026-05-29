"use client";

import { useState } from "react";
import { deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { Plus, Trash2 } from "lucide-react";
import { ProtectedPage } from "@/components/auth/protected-page";
import { TransactionItem } from "@/components/transactions/transaction-item";
import { AddTransactionModal } from "@/components/transactions/add-transaction-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/components/auth/auth-provider";
import { useTransactions, type ClientTransaction } from "@/hooks/use-transactions";
import { db } from "@/lib/firebase/firestore";
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

/** Groups transactions by date label: Today, Yesterday, or "26 May 2025" */
function groupByDate(txns: ClientTransaction[]): Array<{ label: string; items: ClientTransaction[] }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groupMap = new Map<string, ClientTransaction[]>();
  const dateFmt = new Intl.DateTimeFormat("en-MY", { day: "numeric", month: "short", year: "numeric" });

  for (const tx of txns) {
    const d = new Date(tx.transactionDate);
    d.setHours(0, 0, 0, 0);
    let label: string;
    if (d.getTime() === today.getTime()) label = "Today";
    else if (d.getTime() === yesterday.getTime()) label = "Yesterday";
    else label = dateFmt.format(tx.transactionDate);

    const group = groupMap.get(label) ?? [];
    group.push(tx);
    groupMap.set(label, group);
  }

  return Array.from(groupMap.entries()).map(([label, items]) => ({ label, items }));
}

/** Returns a Set of transaction IDs that share the same type + amount + day */
function findDuplicateIds(txns: ClientTransaction[]): Set<string> {
  const groups = new Map<string, string[]>();
  for (const tx of txns) {
    const key = `${tx.type}|${tx.amount}|${tx.transactionDate.toDateString()}`;
    const group = groups.get(key) ?? [];
    group.push(tx.id);
    groups.set(key, group);
  }
  const dupeIds = new Set<string>();
  for (const ids of groups.values()) {
    if (ids.length > 1) ids.forEach((id) => dupeIds.add(id));
  }
  return dupeIds;
}

function LedgerView() {
  const { user } = useAuth();
  const { transactions, isLoading } = useTransactions(user?.uid ?? null);
  const { toast } = useToast();

  const [filter, setFilter] = useState<TxFilter>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<ClientTransaction | null>(null);
  const [deletingTx, setDeletingTx] = useState<ClientTransaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = filterTx(transactions, filter);
  const dupeIds = findDuplicateIds(transactions);
  const grouped = groupByDate(filtered);

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  async function handleDelete() {
    if (!deletingTx) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "transactions", deletingTx.id));

      // If this transaction came from a receipt scan, revert receipt status
      if (deletingTx.receiptId) {
        await updateDoc(doc(db, "receipts", deletingTx.receiptId), {
          scanStatus: "ocr_complete",
          transactionId: null,
          updatedAt: serverTimestamp(),
        });
      }

      toast("Transaction deleted.");
      setDeletingTx(null);
    } catch {
      toast("Failed to delete transaction.", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      {/* Add modal */}
      {user && (
        <AddTransactionModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          userId={user.uid}
        />
      )}

      {/* Edit modal */}
      {user && editingTx && (
        <AddTransactionModal
          open={!!editingTx}
          onClose={() => setEditingTx(null)}
          userId={user.uid}
          transaction={editingTx}
        />
      )}

      {/* Delete confirmation modal */}
      <Modal
        open={!!deletingTx}
        onClose={() => !deleting && setDeletingTx(null)}
        title="Delete transaction?"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-600">
            <span className="font-semibold text-zinc-950">{deletingTx?.title}</span>{" "}
            ({money.format(deletingTx?.amount ?? 0)}) will be permanently removed.
            {deletingTx?.receiptId && (
              <span className="mt-1 block text-xs text-amber-700">
                The linked receipt will be moved back to "Needs review".
              </span>
            )}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setDeletingTx(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-rose-500 hover:bg-rose-600"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Spinner className="h-4 w-4 border-white border-t-rose-200" />
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

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

          {/* Filter tabs + Add button */}
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

          {/* Duplicate warning banner */}
          {dupeIds.size > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
              <span className="font-semibold">{dupeIds.size} possible duplicate</span>
              {dupeIds.size > 1 ? "s" : ""} detected — same amount and date. Review and delete any extras.
            </div>
          )}

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
                  {filter === "all" ? "No transactions yet." : `No ${filter} transactions.`}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  Add one manually or scan a receipt.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {grouped.map(({ label, items }) => (
                  <div key={label}>
                    <p className="mb-1 mt-3 px-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 first:mt-0">
                      {label}
                    </p>
                    <div className="divide-y divide-zinc-100">
                      {items.map((tx) => (
                        <TransactionItem
                          key={tx.id}
                          tx={tx}
                          isDuplicate={dupeIds.has(tx.id)}
                          onEdit={() => setEditingTx(tx)}
                          onDelete={() => setDeletingTx(tx)}
                        />
                      ))}
                    </div>
                  </div>
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
