"use client";

import { FileCheck2 } from "lucide-react";
import { ProtectedPage } from "@/components/auth/protected-page";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/auth/auth-provider";
import { useEinvoices, type ClientEinvoice } from "@/hooks/use-einvoices";
import { AppShell } from "@/components/layout/app-shell";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<ClientEinvoice["status"], string> = {
  draft: "Draft",
  ready_for_validation: "Ready",
  validated: "Validated",
  submitted: "Submitted",
  accepted: "Accepted",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const STATUS_CLASS: Record<ClientEinvoice["status"], string> = {
  draft: "bg-zinc-100 text-zinc-600",
  ready_for_validation: "bg-blue-50 text-blue-700 border-blue-200",
  validated: "bg-emerald-50 text-emerald-700 border-emerald-200",
  submitted: "bg-blue-50 text-blue-700 border-blue-200",
  accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  cancelled: "bg-zinc-100 text-zinc-500",
};

const money = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
  maximumFractionDigits: 2,
});

const dateFormat = new Intl.DateTimeFormat("en-MY", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function InvoiceRow({ invoice }: { invoice: ClientEinvoice }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-zinc-950">
          {invoice.invoiceNumber}
        </p>
        <div className="mt-1 flex items-center gap-2 flex-wrap">
          <Badge className={cn("text-[11px] py-0.5 px-2", STATUS_CLASS[invoice.status])}>
            {STATUS_LABEL[invoice.status]}
          </Badge>
          <span className="text-xs text-zinc-400">
            {invoice.supplier.name} → {invoice.buyer.name}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-zinc-400">{dateFormat.format(invoice.issueDate)}</p>
      </div>
      <p className="shrink-0 text-sm font-semibold text-zinc-950">
        {money.format(invoice.totals.payableAmount)}
      </p>
    </div>
  );
}

function InvoicesView() {
  const { user } = useAuth();
  const { einvoices, isLoading } = useEinvoices(user?.uid ?? null);

  const ready = einvoices.filter(
    (e) => e.status === "ready_for_validation" || e.status === "validated" || e.status === "accepted",
  ).length;

  return (
    <AppShell title="Invoices">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950">E-Invoice tracker</h2>
            <p className="text-sm text-zinc-500">
              LHDN MyInvois compliance · {ready} ready
            </p>
          </div>
          <FileCheck2 className="h-5 w-5 text-rose-500" />
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : einvoices.length === 0 ? (
          <Card className="p-8 text-center">
            <FileCheck2 className="mx-auto h-10 w-10 text-zinc-200" />
            <p className="mt-4 text-sm font-medium text-zinc-500">No e-invoices yet</p>
            <p className="mt-2 text-xs leading-5 text-zinc-400">
              E-invoices are generated from confirmed transactions. Add transactions
              via the Ledger or by scanning receipts, then they can be prepared for
              LHDN MyInvois submission here.
            </p>
          </Card>
        ) : (
          <Card className="p-4 sm:p-5">
            <div className="divide-y divide-zinc-100">
              {einvoices.map((inv) => (
                <InvoiceRow key={inv.id} invoice={inv} />
              ))}
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

export default function InvoicesPage() {
  return (
    <ProtectedPage>
      <InvoicesView />
    </ProtectedPage>
  );
}
