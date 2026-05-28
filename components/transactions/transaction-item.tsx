"use client";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
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

export function TransactionItem({ tx }: { tx: ClientTransaction }) {
  const isIncome = tx.type === "income";

  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3.5">
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

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-zinc-950">{tx.title}</p>
        <p className="mt-0.5 truncate text-xs text-zinc-400">
          {tx.category} · {dateFormat.format(tx.transactionDate)}
        </p>
      </div>

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
        <p className="mt-0.5 text-xs text-zinc-400 capitalize">{tx.status}</p>
      </div>
    </div>
  );
}
