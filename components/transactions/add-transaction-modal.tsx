"use client";

import { useState } from "react";
import { addDoc, collection, serverTimestamp, Timestamp } from "firebase/firestore";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { db } from "@/lib/firebase/firestore";

const CATEGORIES = [
  "Food", "Groceries", "Transport", "Utilities", "Health",
  "Office", "Shopping", "Travel", "Entertainment", "Education",
  "Salary", "Business", "Other",
];

type Props = {
  open: boolean;
  onClose: () => void;
  userId: string;
  onSuccess?: () => void;
};

export function AddTransactionModal({ open, onClose, userId, onSuccess }: Props) {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  function reset() {
    setType("expense");
    setAmount("");
    setTitle("");
    setCategory("Food");
    setDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setSaving(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !amount) return;
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      toast("Enter a valid amount.", "error");
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, "transactions"), {
        userId,
        type,
        source: "manual",
        status: "confirmed",
        amount: parsed,
        currency: "MYR",
        category,
        title: title.trim(),
        ...(notes.trim() ? { description: notes.trim() } : {}),
        transactionDate: Timestamp.fromDate(new Date(date)),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast("Transaction added!");
      onSuccess?.();
      reset();
      onClose();
    } catch {
      toast("Failed to save transaction.", "error");
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add transaction">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          {(["expense", "income"] as const).map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setType(t)}
              className={
                type === t
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
          <label className="mb-1 block text-xs font-medium text-zinc-600">Title</label>
          <input
            className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-400"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={type === "income" ? "e.g. Client retainer" : "e.g. Jaya Grocer"}
            required
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
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Date</label>
            <input
              type="date"
              className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-400"
              value={date}
              onChange={(e) => setDate(e.target.value)}
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
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">
            Notes <span className="text-zinc-400">(optional)</span>
          </label>
          <textarea
            className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-400 resize-none"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add a note…"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className={
              "flex-1 " +
              (type === "income"
                ? "bg-emerald-500 hover:bg-emerald-600"
                : "bg-rose-500 hover:bg-rose-600")
            }
          >
            {saving ? <Spinner className="h-4 w-4 border-white border-t-transparent" /> : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
