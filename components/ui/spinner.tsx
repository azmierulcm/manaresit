import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900",
        className,
      )}
      aria-hidden
    />
  );
}
