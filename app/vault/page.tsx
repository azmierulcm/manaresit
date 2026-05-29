"use client";

import { useState } from "react";
import { deleteDoc, doc } from "firebase/firestore";
import { deleteObject } from "firebase/storage";
import { LockKeyhole } from "lucide-react";
import { ProtectedPage } from "@/components/auth/protected-page";
import { ReceiptCard } from "@/components/receipts/receipt-card";
import { ReceiptDetailModal } from "@/components/receipts/receipt-detail-modal";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/ui/toast";
import { useReceipts, type ClientReceipt } from "@/hooks/use-receipts";
import { db } from "@/lib/firebase/firestore";
import { receiptStorageRef } from "@/lib/firebase/storage";
import { AppShell } from "@/components/layout/app-shell";
import { cn } from "@/lib/utils";

type Filter = "all" | "needs_review" | "confirmed";

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: "all", label: "All" },
  { key: "needs_review", label: "Needs review" },
  { key: "confirmed", label: "Confirmed" },
];

function filterReceipts(receipts: ClientReceipt[], filter: Filter): ClientReceipt[] {
  if (filter === "all") return receipts;
  if (filter === "needs_review") {
    return receipts.filter(
      (r) => r.scanStatus === "ocr_complete" || r.scanStatus === "needs_review",
    );
  }
  return receipts.filter((r) => r.scanStatus === filter);
}

function VaultView() {
  const { user } = useAuth();
  const { receipts, isLoading } = useReceipts(user?.uid ?? null);
  const { toast } = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<ClientReceipt | null>(null);

  const filtered = filterReceipts(receipts, filter);

  async function handleDelete(receipt: ClientReceipt) {
    if (!user) return;
    try {
      // Delete Firestore doc
      await deleteDoc(doc(db, "receipts", receipt.id));

      // Best-effort delete from Storage (don't block on failure)
      deleteObject(receiptStorageRef(user.uid, receipt.id)).catch(() => null);

      toast("Receipt deleted.");
    } catch {
      toast("Failed to delete receipt.", "error");
    }
  }

  return (
    <AppShell title="Vault">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950">Receipt vault</h2>
            <p className="text-sm text-zinc-500">
              {receipts.length} receipt{receipts.length !== 1 ? "s" : ""} stored privately
            </p>
          </div>
          <LockKeyhole className="h-5 w-5 text-emerald-600" />
        </div>

        {/* Filter tabs with counts */}
        <div className="flex gap-1.5 rounded-2xl border border-zinc-200 bg-zinc-50 p-1">
          {FILTERS.map(({ key, label }) => {
            const count = key === "all"
              ? receipts.length
              : key === "needs_review"
              ? receipts.filter((r) => r.scanStatus === "ocr_complete" || r.scanStatus === "needs_review").length
              : receipts.filter((r) => r.scanStatus === key).length;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={cn(
                  "flex-1 rounded-xl py-1.5 text-xs font-medium transition",
                  filter === key
                    ? "bg-white shadow-sm text-zinc-950"
                    : "text-zinc-500 hover:text-zinc-700",
                )}
              >
                {label}
                {count > 0 && (
                  <span className={cn(
                    "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]",
                    filter === key ? "bg-zinc-100 text-zinc-600" : "bg-zinc-200 text-zinc-500",
                    key === "needs_review" && count > 0 && "bg-amber-100 text-amber-700",
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-8 text-center">
            <LockKeyhole className="mx-auto h-8 w-8 text-zinc-300" />
            <p className="mt-3 text-sm font-medium text-zinc-500">
              {filter === "all"
                ? "No receipts yet"
                : `No ${FILTERS.find((f) => f.key === filter)?.label.toLowerCase()} receipts`}
            </p>
            {filter === "all" && (
              <p className="mt-1 text-xs text-zinc-400">
                Head to Scan to upload your first receipt.
              </p>
            )}
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((r) => (
              <ReceiptCard
                key={r.id}
                receipt={r}
                onClick={() => setSelected(r)}
                onDelete={() => handleDelete(r)}
              />
            ))}
          </div>
        )}
      </div>

      <ReceiptDetailModal
        receipt={selected}
        userId={user?.uid ?? ""}
        open={!!selected}
        onClose={() => setSelected(null)}
        onConfirmed={() => setSelected(null)}
      />
    </AppShell>
  );
}

export default function VaultPage() {
  return (
    <ProtectedPage>
      <VaultView />
    </ProtectedPage>
  );
}
