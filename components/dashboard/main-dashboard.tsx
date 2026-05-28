"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeCheck,
  Camera,
  FileCheck2,
  Home,
  LockKeyhole,
  LogOut,
  Plus,
  ReceiptText,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { User } from "firebase/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UploadModal } from "@/components/receipts/upload-modal";
import { useAuth } from "@/components/auth/auth-provider";
import { useDashboardStats, type DashboardStats } from "@/hooks/use-dashboard-stats";
import { signOutCurrentUser } from "@/lib/firebase/auth";
import { cn } from "@/lib/utils";

const money = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
  maximumFractionDigits: 0,
});

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Scan", href: "/scan", icon: Camera },
  { label: "Ledger", href: "/ledger", icon: ReceiptText },
  { label: "Invoices", href: "/invoices", icon: FileCheck2 },
  { label: "Vault", href: "/vault", icon: LockKeyhole },
] satisfies Array<{ label: string; href: string; icon: LucideIcon }>;

// ─── Sub-components ───────────────────────────────────────────────────────────

function DesktopSidebar({
  user,
  onSignOut,
}: {
  user: User | null;
  onSignOut: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-64 shrink-0 flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm lg:flex">
      <div className="flex items-center gap-3 px-2 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-sm">
          <WalletCards className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold">Manaresit</p>
          <p className="text-xs text-zinc-500">Receipt-first finance tracker</p>
        </div>
      </div>

      <nav className="mt-6 space-y-1">
        {navItems.map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className={cn(
              "flex h-12 w-full items-center gap-2.5 rounded-2xl px-3 text-sm font-medium transition",
              pathname === href
                ? "bg-zinc-950 text-white"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto space-y-1">
        {user && (
          <div className="flex items-center gap-3 rounded-2xl border border-zinc-100 p-3">
            {user.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.photoURL}
                alt={user.displayName ?? ""}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-semibold text-rose-600">
                {user.displayName?.[0]?.toUpperCase() ?? "U"}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-zinc-950">
                {user.displayName ?? "User"}
              </p>
              <p className="truncate text-xs text-zinc-400">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={onSignOut}
          className="flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-xs font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

function MobileTopBar({ onAdd }: { onAdd: () => void }) {
  return (
    <header className="sticky top-0 z-20 -mx-4 border-b border-zinc-200 bg-zinc-50/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase text-zinc-500">Today</p>
          <h1 className="truncate text-lg font-semibold text-zinc-950">Manaresit</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" className="h-11 w-11 rounded-full p-0">
            <Search className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Search</span>
          </Button>
          <Button
            className="h-11 w-11 rounded-full bg-rose-500 p-0 hover:bg-rose-600"
            onClick={onAdd}
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Add receipt</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

function TrustBadge({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <Badge className="shrink-0 gap-2 px-3 py-2 text-xs sm:text-sm">
      <Icon className="h-4 w-4 text-emerald-600" aria-hidden="true" />
      {label}
    </Badge>
  );
}

function MobileTrustRail({ vaultCount }: { vaultCount: number }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="flex min-w-max gap-2 sm:min-w-0 sm:flex-wrap">
        <TrustBadge icon={ShieldCheck} label="Private by default" />
        <TrustBadge icon={BadgeCheck} label="Vault sync healthy" />
        <TrustBadge icon={LockKeyhole} label={`${vaultCount} receipt${vaultCount !== 1 ? "s" : ""}`} />
      </div>
    </div>
  );
}

function BalanceCard({
  balance,
  income,
  expenses,
  isLoading,
}: {
  balance: number;
  income: number;
  expenses: number;
  isLoading: boolean;
}) {
  return (
    <Card className="bg-zinc-950 p-5 text-white sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-300">Available balance</p>
          {isLoading ? (
            <div className="mt-3 h-10 w-48 animate-pulse rounded-xl bg-zinc-800" />
          ) : (
            <p className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
              {money.format(balance)}
            </p>
          )}
          <p className="mt-3 text-sm leading-6 text-zinc-300">
            Confirmed income minus expenses for this month.
          </p>
        </div>
        <div className="rounded-full bg-white/10 p-3">
          <WalletCards className="h-5 w-5 text-white" aria-hidden="true" />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center gap-2 text-emerald-300">
            <ArrowDownLeft className="h-4 w-4" aria-hidden="true" />
            <p className="text-xs font-medium">Income</p>
          </div>
          {isLoading ? (
            <div className="mt-1 h-5 w-24 animate-pulse rounded bg-zinc-800" />
          ) : (
            <p className="mt-1 text-sm font-semibold">{money.format(income)}</p>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2 text-rose-300">
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            <p className="text-xs font-medium">Expenses</p>
          </div>
          {isLoading ? (
            <div className="mt-1 h-5 w-24 animate-pulse rounded bg-zinc-800" />
          ) : (
            <p className="mt-1 text-sm font-semibold">{money.format(expenses)}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

function ScanCard({
  scanQueue,
  onCamera,
  onUpload,
}: {
  scanQueue: number;
  onCamera: () => void;
  onUpload: () => void;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <Sparkles className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-zinc-950">AI receipt scanner</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-500">
            {scanQueue > 0
              ? `${scanQueue} scan${scanQueue !== 1 ? "s" : ""} waiting for review.`
              : "Scan or upload a receipt to get started."}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button className="h-12 bg-rose-500 hover:bg-rose-600" onClick={onCamera}>
          <Camera className="h-4 w-4" aria-hidden="true" />
          Camera
        </Button>
        <Button variant="secondary" className="h-12" onClick={onUpload}>
          <Upload className="h-4 w-4" aria-hidden="true" />
          Upload
        </Button>
      </div>

      <div className="mt-5 flex items-center gap-2 text-sm font-medium text-emerald-700">
        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        Private vault active
      </div>
    </Card>
  );
}

function MiniStat({
  title,
  value,
  icon: Icon,
  tone = "zinc",
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  tone?: "rose" | "emerald" | "zinc";
}) {
  const toneClasses = {
    rose: "bg-rose-50 text-rose-600",
    emerald: "bg-emerald-50 text-emerald-700",
    zinc: "bg-zinc-100 text-zinc-700",
  };

  return (
    <Card className="min-h-32 p-4">
      <div className={cn("w-fit rounded-full p-2.5", toneClasses[tone])}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <p className="mt-4 text-xl font-semibold text-zinc-950">{value}</p>
      <p className="mt-1 text-sm text-zinc-500">{title}</p>
    </Card>
  );
}

function CashflowChart({
  data,
  isLoading,
}: {
  data: DashboardStats["weeklyTrend"];
  isLoading: boolean;
}) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold sm:text-lg">Cashflow</h2>
          <p className="mt-1 text-sm text-zinc-500">This week</p>
        </div>
        <Badge className="bg-emerald-50 text-emerald-700">Live</Badge>
      </div>

      <div className="mt-5 h-48 sm:h-64 lg:h-72">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: -18, right: 8 }}>
              <defs>
                <linearGradient id="spend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fb7185" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e4e4e7" strokeDasharray="4 4" vertical={false} />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#71717a", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#71717a", fontSize: 12 }}
                width={38}
              />
              <Tooltip
                cursor={{ stroke: "#d4d4d8" }}
                contentStyle={{
                  borderRadius: "16px",
                  border: "1px solid #e4e4e7",
                  boxShadow: "0 1px 2px rgb(0 0 0 / 0.05)",
                }}
              />
              <Area
                type="monotone"
                dataKey="spend"
                stroke="#f43f5e"
                strokeWidth={2}
                fill="url(#spend)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}

function CategoryChart({
  data,
  isLoading,
}: {
  data: DashboardStats["categorySpend"];
  isLoading: boolean;
}) {
  const display = data.length > 0 ? data : [{ category: "No data yet", amount: 0 }];

  return (
    <Card className="p-4 sm:p-5">
      <h2 className="text-base font-semibold sm:text-lg">Categories</h2>
      <p className="mt-1 text-sm text-zinc-500">Auto-categorized spend</p>

      <div className="mt-5 h-56 sm:h-64 lg:h-72">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={display} layout="vertical" margin={{ left: -8, right: 8 }}>
              <CartesianGrid stroke="#e4e4e7" strokeDasharray="4 4" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis
                dataKey="category"
                type="category"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#71717a", fontSize: 12 }}
                width={72}
              />
              <Tooltip
                cursor={{ fill: "#fafafa" }}
                contentStyle={{
                  borderRadius: "16px",
                  border: "1px solid #e4e4e7",
                }}
              />
              <Bar dataKey="amount" fill="#10b981" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}

function InvoiceTracker({ count, isLoading }: { count: number; isLoading: boolean }) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold sm:text-lg">E-Invoice tracker</h2>
          <p className="mt-1 text-sm text-zinc-500">LHDN compliance</p>
        </div>
        <FileCheck2 className="h-5 w-5 text-rose-500" aria-hidden="true" />
      </div>

      <div className="mt-5">
        {isLoading ? (
          <Skeleton className="h-10 w-20" />
        ) : (
          <p className="text-3xl font-semibold">{count}</p>
        )}
        <p className="mt-1 text-sm text-zinc-500">
          {count === 0
            ? "No e-invoices yet. Confirmed transactions can generate invoices."
            : `document${count !== 1 ? "s" : ""} ready for reporting.`}
        </p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-200">
          <div
            className="h-full rounded-full bg-rose-500 transition-all"
            style={{ width: count > 0 ? "75%" : "0%" }}
          />
        </div>
      </div>
    </Card>
  );
}

function RecentActivity({
  items,
  isLoading,
}: {
  items: DashboardStats["recentActivity"];
  isLoading: boolean;
}) {
  return (
    <Card className="p-4 sm:p-5">
      <h2 className="text-base font-semibold sm:text-lg">Recent activity</h2>
      {isLoading ? (
        <div className="mt-3 space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-6 text-center">
          <p className="text-sm text-zinc-400">No transactions yet.</p>
          <p className="mt-1 text-xs text-zinc-400">
            Scan a receipt or add a transaction to get started.
          </p>
        </div>
      ) : (
        <div className="mt-3 divide-y divide-zinc-100">
          {items.map((item, i) => (
            <div
              key={i}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-4"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-950">{item.title}</p>
                <p className="mt-1 truncate text-sm text-zinc-500">{item.detail}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-zinc-950">{item.amount}</p>
                <p className="mt-1 text-xs font-medium text-emerald-700">{item.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2 shadow-sm backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {navItems.map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className={cn(
              "flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-medium transition",
              pathname === href
                ? "bg-zinc-950 text-white"
                : "text-zinc-500 hover:bg-zinc-100",
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function MainDashboard() {
  const { user } = useAuth();
  const { stats, isLoading, refresh } = useDashboardStats(user?.uid ?? null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    await signOutCurrentUser();
    router.replace("/login");
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      {user && (
        <UploadModal
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          userId={user.uid}
          onSuccess={refresh}
        />
      )}

      <div className="mx-auto flex w-full max-w-7xl gap-8 px-4 pb-28 sm:px-6 lg:px-8 lg:py-6">
        <DesktopSidebar user={user} onSignOut={handleSignOut} />

        <div className="min-w-0 flex-1">
          <MobileTopBar onAdd={() => setUploadOpen(true)} />

          <div className="space-y-4 pt-4 sm:space-y-5 lg:pt-0">
            <header className="hidden items-end justify-between gap-6 lg:flex">
              <div className="max-w-2xl">
                <p className="text-sm font-medium text-rose-600">Weekly financial pulse</p>
                <h1 className="mt-2 text-4xl font-semibold tracking-normal text-zinc-950">
                  Money, receipts, and e-invoices, organised for today.
                </h1>
              </div>
              <MobileTrustRail vaultCount={stats.vaultCount} />
            </header>

            <div className="lg:hidden">
              <MobileTrustRail vaultCount={stats.vaultCount} />
            </div>

            <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
              <BalanceCard
                balance={stats.balance}
                income={stats.income}
                expenses={stats.expenses}
                isLoading={isLoading}
              />
              <ScanCard
                scanQueue={stats.scanQueue}
                onCamera={() => setUploadOpen(true)}
                onUpload={() => setUploadOpen(true)}
              />
            </section>

            <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              <MiniStat
                title="Receipts"
                value={isLoading ? "—" : `${stats.vaultCount}`}
                icon={LockKeyhole}
                tone="emerald"
              />
              <MiniStat
                title="To review"
                value={isLoading ? "—" : `${stats.scanQueue}`}
                icon={Sparkles}
                tone="rose"
              />
              <MiniStat
                title="E-Invoices"
                value={isLoading ? "—" : `${stats.einvoicesReady}`}
                icon={FileCheck2}
              />
              <MiniStat
                title="This month"
                value={isLoading ? "—" : money.format(stats.expenses)}
                icon={ArrowUpRight}
              />
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
              <CashflowChart data={stats.weeklyTrend} isLoading={isLoading} />
              <CategoryChart data={stats.categorySpend} isLoading={isLoading} />
            </section>

            <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
              <InvoiceTracker count={stats.einvoicesReady} isLoading={isLoading} />
              <RecentActivity items={stats.recentActivity} isLoading={isLoading} />
            </section>
          </div>
        </div>
      </div>

      <MobileBottomNav />
    </main>
  );
}
