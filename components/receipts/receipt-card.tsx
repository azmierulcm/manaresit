"use client";

import { useRef, useState } from "react";
import { ReceiptText, Trash2 } from "lucide-react";
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

const dateFmt = new Intl.DateTimeFormat("en-MY", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const DELETE_REVEAL = 80; // px revealed on full swipe
const SWIPE_THRESHOLD = 50; // px to trigger snap-open

export function ReceiptCard({
  receipt,
  onClick,
  onDelete,
}: {
  receipt: ClientReceipt;
  onClick?: () => void;
  onDelete?: () => void;
}) {
  const needsReview =
    receipt.scanStatus === "ocr_complete" || receipt.scanStatus === "needs_review";

  const [offset, setOffset] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [animating, setAnimating] = useState(false);

  const startX = useRef(0);
  const startY = useRef(0);
  const axis = useRef<"h" | "v" | null>(null); // determined on first move

  function snapTo(target: number) {
    setAnimating(true);
    setOffset(target);
    setRevealed(target !== 0);
    setTimeout(() => setAnimating(false), 220);
  }

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    axis.current = null;
  }

  function onTouchMove(e: React.TouchEvent) {
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    // Determine axis on first meaningful movement
    if (!axis.current) {
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
      axis.current = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
    }

    if (axis.current !== "h") return; // vertical — let scroll handle it
    e.preventDefault(); // prevent page scroll while swiping

    const base = revealed ? -DELETE_REVEAL : 0;
    const next = Math.min(0, Math.max(-DELETE_REVEAL, base + dx));
    setOffset(next);
  }

  function onTouchEnd() {
    if (axis.current !== "h") return;

    const movedBy = offset - (revealed ? -DELETE_REVEAL : 0);
    if (!revealed && offset < -SWIPE_THRESHOLD) {
      snapTo(-DELETE_REVEAL); // snap open
    } else if (revealed && movedBy > SWIPE_THRESHOLD) {
      snapTo(0); // snap closed
    } else {
      snapTo(revealed ? -DELETE_REVEAL : 0); // snap back to current state
    }
  }

  function handleCardClick() {
    if (revealed) {
      // First tap on card when delete is revealed → close it
      snapTo(0);
      return;
    }
    onClick?.();
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    snapTo(0);
    onDelete?.();
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Delete button behind the card */}
      <div className="absolute inset-y-0 right-0 flex w-20 items-center justify-center rounded-r-2xl bg-rose-500">
        <button
          onClick={handleDelete}
          className="flex h-full w-full flex-col items-center justify-center gap-1 text-white active:bg-rose-600"
        >
          <Trash2 className="h-5 w-5" />
          <span className="text-[10px] font-semibold">Delete</span>
        </button>
      </div>

      {/* Swipeable card */}
      <div
        style={{
          transform: `translateX(${offset}px)`,
          transition: animating ? "transform 0.22s cubic-bezier(0.25,0.46,0.45,0.94)" : "none",
          willChange: "transform",
        }}
        onTouchStart={needsReview ? onTouchStart : undefined}
        onTouchMove={needsReview ? onTouchMove : undefined}
        onTouchEnd={needsReview ? onTouchEnd : undefined}
      >
        <Card
          className={cn(
            "flex items-start gap-3 p-4 transition-colors",
            onClick ? "cursor-pointer hover:bg-zinc-50 active:bg-zinc-100" : "",
            needsReview ? "border-amber-200" : "",
          )}
          onClick={handleCardClick}
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

            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Badge className={cn("py-0.5 px-2 text-[11px]", STATUS_CLASS[receipt.scanStatus])}>
                {STATUS_LABEL[receipt.scanStatus]}
              </Badge>
              {receipt.categorySuggestion && (
                <span className="text-xs text-zinc-400">
                  {receipt.categorySuggestion.category}
                </span>
              )}
              <span className="ml-auto text-xs text-zinc-400">
                {dateFmt.format(receipt.createdAt)}
              </span>
            </div>

            {needsReview && (
              <p className="mt-1.5 text-[10px] text-zinc-400">Swipe left to delete</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
