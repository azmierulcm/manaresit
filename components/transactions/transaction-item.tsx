"use client";

import { useRef, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Copy, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClientTransaction } from "@/hooks/use-transactions";

const money = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
  maximumFractionDigits: 2,
});

const dateFormat = new Intl.DateTimeFormat("en-MY", {
  day: "numeric",
  month: "short",
});

type Props = {
  tx: ClientTransaction;
  isDuplicate?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function TransactionItem({ tx, isDuplicate, onEdit, onDelete }: Props) {
  const isIncome = tx.type === "income";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  function handleMenuToggle(e: React.MouseEvent) {
    e.stopPropagation();
    setMenuOpen((v) => !v);
  }

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation();
    setMenuOpen(false);
    onEdit?.();
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    setMenuOpen(false);
    onDelete?.();
  }

  return (
    <div
      className={cn(
        "relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3.5",
        isDuplicate && "rounded-xl bg-amber-50/60 px-2 -mx-2",
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl",
          isIncome ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600",
        )}
      >
        {isIncome ? (
          <ArrowDownLeft className="h-4 w-4" />
        ) : (
          <ArrowUpRight className="h-4 w-4" />
        )}
      </div>

      {/* Title + meta */}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-semibold text-zinc-950">{tx.title}</p>
          {isDuplicate && (
            <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
              <Copy className="h-2.5 w-2.5" />
              Duplicate
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-zinc-400">
          {tx.category} · {dateFormat.format(tx.transactionDate)}
          {tx.source === "receipt_scan" && " · Receipt"}
        </p>
      </div>

      {/* Amount + menu */}
      <div className="flex items-center gap-1">
        <div className="text-right">
          <p
            className={cn(
              "text-sm font-semibold",
              isIncome ? "text-emerald-600" : "text-zinc-950",
            )}
          >
            {isIncome ? "+" : "-"}
            {money.format(tx.amount)}
          </p>
        </div>

        {/* Three-dot menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={handleMenuToggle}
            className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {menuOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              {/* Dropdown */}
              <div className="absolute right-0 top-8 z-20 w-36 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
                <button
                  onClick={handleEdit}
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  <Pencil className="h-3.5 w-3.5 text-zinc-400" />
                  Edit
                </button>
                <div className="mx-3 h-px bg-zinc-100" />
                <button
                  onClick={handleDelete}
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
