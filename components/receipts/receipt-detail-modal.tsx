"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getDownloadURL } from "firebase/storage";
import { addDoc, collection, doc, serverTimestamp, Timestamp, updateDoc } from "firebase/firestore";
import { CheckCircle2, ExternalLink, ImageOff, ZoomIn } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { receiptStorageRef } from "@/lib/firebase/storage";
import { db } from "@/lib/firebase/firestore";
import { cn } from "@/lib/utils";
import type { ClientReceipt } from "@/hooks/use-receipts";

const CATEGORIES = [
  "Food", "Groceries", "Transport", "Utilities", "Health",
  "Office", "Shopping", "Travel", "Entertainment", "Education",
  "Salary", "Business", "Other",
];

const STATUS_LABEL: Record<ClientReceipt["scanStatus"], string> = {
  uploaded: "Uploaded",
  processing: "Processing",
  ocr_complete: "Needs review",
  needs_review: "Needs review",
  confirmed: "Confirmed",
  failed: "Failed",
};

const STATUS_CLASS: Record<ClientReceipt["scanStatus"], string> = {
  uploaded: "bg-zinc-100 text-zinc-600",
  processing: "bg-blue-50 text-blue-700 border-blue-200",
  ocr_complete: "bg-amber-50 text-amber-700 border-amber-200",
  needs_review: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed: "bg-red-50 text-red-700 border-red-200",
};

const money = new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" });
const dateFmt = new Intl.DateTimeFormat("en-MY", { day: "numeric", month: "short", year: "numeric" });

type Props = {
  receipt: ClientReceipt | null;
  userId: string;
  open: boolean;
  onClose: () => void;
  onConfirmed?: () => void;
};

export function ReceiptDetailModal({ receipt, userId, open, onClose, onConfirmed }: Props) {
  const { toast } = useToast();
  const router = useRouter();

  // Image
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  // Review form (for needs_review / ocr_complete)
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [dateStr, setDateStr] = useState("");
  const [txType, setTxType] = useState<"expense" | "income">("expense");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const needsReview =
    receipt?.scanStatus === "ocr_complete" || receipt?.scanStatus === "needs_review";
  const isConfirmed = receipt?.scanStatus === "confirmed";

  // Cache signed URLs so re-opening the same receipt doesn't re-fetch
  const urlCache = useRef<Map<string, string>>(new Map());

  // Load image from Firebase Storage when receipt changes
  useEffect(() => {
    if (!receipt || !open) return;
    setImageError(false);
    setDone(false);

    const cached = urlCache.current.get(receipt.id);
    if (cached) {
      setImageUrl(cached);
      setImageLoading(false);
      return;
    }

    setImageUrl(null);
    setImageLoading(true);
    getDownloadURL(receiptStorageRef(userId, receipt.id))
      .then((url) => {
        urlCache.current.set(receipt.id, url);
        setImageUrl(url);
        setImageLoading(false);
      })
      .catch(() => { setImageError(true); setImageLoading(false); });
  }, [receipt?.id, open, userId]);

  // Populate form from extracted data
  useEffect(() => {
    if (!receipt) return;
    setVendor(receipt.extracted.vendor ?? "");
    setAmount(receipt.extracted.totalAmount?.toString() ?? "");
    setCategory(receipt.categorySuggestion?.category ?? "Food");
    setDateStr(
      receipt.extracted.receiptDate
        ? receipt.extracted.receiptDate.toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    );
    setTxType("expense");
  }, [receipt?.id, open]);

  async function handleConfirm() {
    if (!receipt) return;
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      toast("Enter a valid amount.", "error");
      return;
    }
    setSaving(true);
    try {
      const txRef = await addDoc(collection(db, "transactions"), {
        userId,
        type: txType,
        source: "receipt_scan",
        status: "confirmed",
        amount: parsed,
        currency: "MYR",
        category,
        title: vendor || "Receipt",
        vendor: { name: vendor },
        transactionDate: Timestamp.fromDate(new Date(dateStr)),
        receiptId: receipt.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "receipts", receipt.id), {
        scanStatus: "confirmed",
        transactionId: txRef.id,
        "extracted.vendor": vendor || null,
        "extracted.totalAmount": parsed,
        updatedAt: serverTimestamp(),
      });

      setDone(true);
      toast("Receipt confirmed and added to ledger!");
      onConfirmed?.();
      setTimeout(() => { setDone(false); onClose(); }, 1400);
    } catch {
      toast("Failed to confirm receipt.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (!receipt) return null;

  return (
    <>
      <Modal
        open={open && !lightbox}
        onClose={saving ? () => {} : onClose}
        title={done ? "Confirmed!" : receipt.extracted.vendor || "Receipt detail"}
      >
        {done ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            <p className="font-medium text-zinc-950">Added to your ledger!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Receipt image */}
            <div
              className="relative w-full overflow-hidden rounded-2xl bg-zinc-100"
              style={{ minHeight: 180 }}
            >
              {imageLoading && <Skeleton className="h-48 w-full" />}
              {imageError && !imageLoading && (
                <div className="flex h-48 flex-col items-center justify-center gap-2 text-zinc-400">
                  <ImageOff className="h-8 w-8" />
                  <span className="text-xs">Image unavailable</span>
                </div>
              )}
              {imageUrl && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Receipt"
                    className="w-full rounded-2xl object-contain"
                    style={{ maxHeight: 320 }}
                  />
                  <button
                    onClick={() => setLightbox(true)}
                    className="absolute bottom-2 right-2 flex items-center gap-1 rounded-xl bg-black/50 px-2.5 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                    Full screen
                  </button>
                </>
              )}
            </div>

            {/* Status badge */}
            <div className="flex items-center justify-between">
              <Badge className={cn("text-xs py-0.5 px-2.5", STATUS_CLASS[receipt.scanStatus])}>
                {STATUS_LABEL[receipt.scanStatus]}
              </Badge>
              <span className="text-xs text-zinc-400">{dateFmt.format(receipt.createdAt)}</span>
            </div>

            {/* Confirmed view — read only */}
            {isConfirmed && (
              <div className="space-y-3 rounded-2xl bg-zinc-50 p-4 text-sm">
                <Row label="Vendor" value={receipt.extracted.vendor || "—"} />
                <Row
                  label="Amount (RM)"
                  value={receipt.extracted.totalAmount != null ? money.format(receipt.extracted.totalAmount) : "—"}
                />
                {receipt.extracted.currency && receipt.extracted.currency !== "MYR" && receipt.extracted.originalAmount != null && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
                    <p className="text-xs text-blue-700 font-medium">
                      Original: {receipt.extracted.currency} {receipt.extracted.originalAmount.toFixed(2)}
                    </p>
                    {receipt.extracted.exchangeRate != null && (
                      <p className="mt-0.5 text-[11px] text-blue-500">
                        Rate: 1 {receipt.extracted.currency} = RM {receipt.extracted.exchangeRate.toFixed(4)}
                        {receipt.extracted.exchangeRateDate && ` · ${receipt.extracted.exchangeRateDate}`}
                      </p>
                    )}
                  </div>
                )}
                <Row
                  label="Date"
                  value={receipt.extracted.receiptDate ? dateFmt.format(receipt.extracted.receiptDate) : "—"}
                />
                <Row label="Category" value={receipt.categorySuggestion?.category ?? "—"} />
                {receipt.transactionId && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-zinc-400">Linked transaction</span>
                    <button
                      onClick={() => { onClose(); router.push("/ledger"); }}
                      className="flex items-center gap-1 text-xs text-emerald-600 font-medium hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> View in ledger
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Review / edit form */}
            {needsReview && (
              <div className="space-y-3">
                <p className="text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2">
                  Review the extracted details below and confirm to add to your ledger.
                </p>

                {/* Income / Expense toggle */}
                <div className="flex gap-2">
                  {(["expense", "income"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTxType(t)}
                      className={
                        txType === t
                          ? "flex-1 rounded-xl py-2 text-sm font-medium " +
                            (t === "expense" ? "bg-rose-500 text-white" : "bg-emerald-500 text-white")
                          : "flex-1 rounded-xl border border-zinc-200 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                      }
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-600">Vendor</label>
                  <input
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-400"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    placeholder="Merchant name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600">Amount (RM)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-400"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600">Date</label>
                    <input
                      type="date"
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-400"
                      value={dateStr}
                      onChange={(e) => setDateStr(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-600">Category</label>
                  <select
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-400"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button variant="secondary" className="flex-1" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-rose-500 hover:bg-rose-600"
                    onClick={handleConfirm}
                    disabled={saving}
                  >
                    {saving
                      ? <Spinner className="h-4 w-4 border-white border-t-rose-200" />
                      : "Confirm & add to ledger"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Lightbox — full screen image */}
      {lightbox && imageUrl && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Receipt full screen"
            className="max-h-full max-w-full rounded-2xl object-contain"
          />
          <button
            className="absolute right-4 top-4 rounded-xl bg-white/10 px-3 py-1.5 text-xs text-white backdrop-blur-sm"
            onClick={() => setLightbox(false)}
          >
            Close
          </button>
        </div>
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-zinc-400">{label}</span>
      <span className="text-sm font-medium text-zinc-900">{value}</span>
    </div>
  );
}
