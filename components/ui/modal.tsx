"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={cn(
          "relative z-10 w-full rounded-t-3xl border border-zinc-200 bg-white shadow-xl sm:max-w-md sm:rounded-3xl",
          className,
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
            <h2 className="text-base font-semibold text-zinc-950">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-950"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
        )}
        <div className="px-5 pb-6 pt-4">{children}</div>
      </div>
    </div>
  );
}
