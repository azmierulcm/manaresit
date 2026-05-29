"use client";

import { useEffect, useRef, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { Camera, CheckCircle2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { uploadReceipt } from "@/lib/firebase/upload-receipt";
import { db } from "@/lib/firebase/firestore";
import type { ReceiptUploadResponse } from "@/types/receipt";

const CATEGORIES = [
  "Food", "Groceries", "Transport", "Utilities", "Health",
  "Office", "Shopping", "Travel", "Entertainment", "Education",
  "Salary", "Business", "Other",
];

type Screen = "pick" | "uploading" | "review" | "done";

type Props = {
  open: boolean;
  onClose: () => void;
  userId: string;
  /** Pass a File to skip the pick screen and start uploading immediately */
  initialFile?: File | null;
  onSuccess?: () => void;
};

type ReviewData = {
  vendor: string;
  amount: string;
  category: string;
  date: string;
  type: "expense" | "income";
};

export function UploadModal({ open, onClose, userId, initialFile, onSuccess }: Props) {
  const [screen, setScreen] = useState<Screen>("pick");
  const [result, setResult] = useState<ReceiptUploadResponse | null>(null);
  const [form, setForm] = useState<ReviewData>({
    vendor: "",
    amount: "",
    category: "Food",
    date: new Date().toISOString().split("T")[0],
    type: "expense",
  });
  const [saving, setSaving] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // When a file is passed in directly (e.g. from Scan page), skip pick screen
  useEffect(() => {
    if (open && initialFile) {
      processFile(initialFile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialFile]);

  function reset() {
    setScreen("pick");
    setResult(null);
    setSaving(false);
    setForm({
      vendor: "",
      amount: "",
      category: "Food",
      date: new Date().toISOString().split("T")[0],
      type: "expense",
    });
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function processFile(file: File) {
    setScreen("uploading");
    try {
      const res = await uploadReceipt(file);
      setResult(res);
      setForm({
        vendor: res.extracted.vendor ?? "",
        amount: res.extracted.totalAmount?.toString() ?? "",
        category: res.categorySuggestion.category,
        date: res.extracted.receiptDate
          ? new Date(res.extracted.receiptDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        type: "expense",
      });
      setScreen("review");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed.", "error");
      setScreen("pick");
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  }

  async function handleConfirm() {
    if (!result) return;
    setSaving(true);
    try {
      const amount = parseFloat(form.amount);
      const txRef = await addDoc(collection(db, "transactions"), {
        userId,
        type: form.type,
        source: "receipt_scan",
        status: "confirmed",
        amount: isNaN(amount) ? 0 : amount,
        currency: "MYR",
        category: form.category,
        title: form.vendor || "Receipt",
        vendor: { name: form.vendor },
        transactionDate: Timestamp.fromDate(new Date(form.date)),
        receiptId: result.receiptId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "receipts", result.receiptId), {
        scanStatus: "confirmed",
        transactionId: txRef.id,
        updatedAt: serverTimestamp(),
      });

      setScreen("done");
      toast("Receipt saved to ledger!");
      onSuccess?.();
      setTimeout(() => {
        reset();
        onClose();
      }, 1200);
    } catch {
      toast("Failed to save transaction.", "error");
      setSaving(false);
    }
  }

  return (
    <>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFileChange}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="hidden"
        onChange={onFileChange}
      />

      <Modal
        open={open}
        onClose={screen === "uploading" || saving ? () => {} : handleClose}
        title={
          screen === "pick" ? "Add receipt" :
          screen === "uploading" ? "Processing…" :
          screen === "review" ? "Review & confirm" :
          "Saved!"
        }
      >
        {screen === "pick" && (
          <div className="space-y-3">
            <p className="text-sm text-zinc-500">
              Capture a receipt with your camera or upload an image from your gallery.
            </p>
            <Button
              className="h-14 w-full bg-rose-500 hover:bg-rose-600"
              onClick={() => cameraRef.current?.click()}
            >
              <Camera className="h-5 w-5" />
              Use camera
            </Button>
            <Button
              variant="secondary"
              className="h-14 w-full"
              onClick={() => galleryRef.current?.click()}
            >
              <Upload className="h-5 w-5" />
              Upload from gallery
            </Button>
          </div>
        )}

        {screen === "uploading" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Spinner className="h-10 w-10" />
            <div className="text-center">
              <p className="font-medium text-zinc-950">Scanning receipt…</p>
              <p className="mt-1 text-sm text-zinc-500">
                Compressing and extracting data with AI
              </p>
            </div>
          </div>
        )}

        {screen === "review" && result && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-500">
              Review the extracted data and confirm to add to your ledger.
            </p>

            <div className="flex gap-2">
              {(["expense", "income"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className={
                    form.type === t
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
                value={form.vendor}
                onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))}
                placeholder="Merchant name"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">
                  Amount (RM)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-400"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">Date</label>
                <input
                  type="date"
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-400"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">Category</label>
              <select
                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-400"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="secondary" className="flex-1" onClick={handleClose}>
                Discard
              </Button>
              <Button
                className="flex-1 bg-rose-500 hover:bg-rose-600"
                onClick={handleConfirm}
                disabled={saving}
              >
                {saving ? <Spinner className="h-4 w-4 border-white border-t-rose-200" /> : "Confirm"}
              </Button>
            </div>
          </div>
        )}

        {screen === "done" && (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            <p className="font-medium text-zinc-950">Saved to your ledger!</p>
          </div>
        )}
      </Modal>
    </>
  );
}
