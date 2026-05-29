"use client";

import { FileText, ReceiptText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ClientReceipt } from "@/hooks/use-receipts";

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

const money = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
  maximumFractionDigits: 2,
});

const date = new Intl.DateTimeFormat("en-MY", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function ReceiptCard({
  receipt,
  onClick,
}: {
  receipt: ClientReceipt;
  onClick?: () => void;
}) {
  const needsReview = receipt.scanStatus === "ocr_complete" || receipt.scanStatus === "needs_review";
  return (
    <Card
      className={cn(
        "flex items-start gap-3 p-4 transition",
        onClick ? "cursor-pointer hover:bg-zinc-50 active:bg-zinc-100" : "",
        needsReview ? "border-amber-200" : "",
      )}
      onClick={onClick}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500">
        <ReceiptText className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold text-zinc-950">
            {receipt.extracted.vendor || receipt.originalFile?.name || "Receipt"}
          </p>
          {receipt.extracted.totalAmount != null && (
            <p className="shrink-0 text-sm font-semibold text-zinc-950">
              {money.format(receipt.extracted.totalAmount)}
            </p>
          )}
        </div>

        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          <Badge className={cn("text-[11px] py-0.5 px-2", STATUS_CLASS[receipt.scanStatus])}>
            {STATUS_LABEL[receipt.scanStatus]}
          </Badge>
          {receipt.categorySuggestion && (
            <span className="text-xs text-zinc-400">
              {receipt.categorySuggestion.category}
            </span>
          )}
          <span className="ml-auto text-xs text-zinc-400">
            {date.format(receipt.createdAt)}
          </span>
        </div>
      </div>
    </Card>
  );
}
