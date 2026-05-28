"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeCheck,
  Camera,
  FileCheck2,
  Home,
  LockKeyhole,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DashboardSummary = {
  balance: number;
  income: number;
  expenses: number;
  vaultCount: number;
  einvoicesReady: number;
  scanQueue: number;
};

const summary: DashboardSummary = {
  balance: 8240,
  income: 12600,
  expenses: 4360,
  vaultCount: 84,
  einvoicesReady: 12,
  scanQueue: 3,
};

const weeklyTrend = [
  { day: "Mon", spend: 220, income: 0 },
  { day: "Tue", spend: 180, income: 0 },
  { day: "Wed", spend: 320, income: 1200 },
  { day: "Thu", spend: 140, income: 0 },
  { day: "Fri", spend: 460, income: 0 },
  { day: "Sat", spend: 280, income: 0 },
  { day: "Sun", spend: 210, income: 0 },
];

const categorySpend = [
  { category: "Food", amount: 1240 },
  { category: "Transport", amount: 720 },
  { category: "Utilities", amount: 540 },
  { category: "Office", amount: 430 },
  { category: "Other", amount: 280 },
];

const recentActivity = [
  {
    title: "Jaya Grocer",
    detail: "Food - OCR matched total",
    amount: "-RM 86.40",
    status: "Saved safely",
  },
  {
    title: "Client retainer",
    detail: "Income - Manual ledger",
    amount: "+RM 3,200.00",
    status: "Confirmed",
  },
  {
    title: "LHDN invoice batch",
    detail: "12 documents ready",
    amount: "CSV/PDF",
    status: "Validated",
  },
];

const money = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
  maximumFractionDigits: 0,
});

const navItems = [
  ["Home", Home],
  ["Scan", Camera],
  ["Ledger", ReceiptText],
  ["Invoices", FileCheck2],
  ["Vault", LockKeyhole],
] satisfies Array<[string, LucideIcon]>;

function DesktopSidebar() {
  return (
    <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-64 shrink-0 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm lg:block">
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
        {navItems.map(([label, Icon], index) => (
          <Button
            key={label}
            variant={index === 0 ? "primary" : "ghost"}
            className="flex h-12 w-full justify-start px-3"
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </Button>
        ))}
      </nav>
    </aside>
  );
}

function MobileTopBar() {
  return (
    <header className="sticky top-0 z-20 -mx-4 border-b border-zinc-200 bg-zinc-50/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase text-zinc-500">Today</p>
          <h1 className="truncate text-lg font-semibold text-zinc-950">
            Manaresit
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" className="h-11 w-11 rounded-full p-0">
            <Search className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Search</span>
          </Button>
          <Button className="h-11 w-11 rounded-full bg-rose-500 p-0 hover:bg-rose-600">
            <Plus className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Add transaction</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

function TrustBadge({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Badge className="shrink-0 gap-2 px-3 py-2 text-xs sm:text-sm">
      <Icon className="h-4 w-4 text-emerald-600" aria-hidden="true" />
      {label}
    </Badge>
  );
}

function BalanceCard() {
  return (
    <Card className="bg-zinc-950 p-5 text-white sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-300">Available balance</p>
          <p className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
            {money.format(summary.balance)}
          </p>
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
          <p className="mt-1 text-sm font-semibold">
            {money.format(summary.income)}
          </p>
        </div>
        <div>
          <div className="flex items-center gap-2 text-rose-300">
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            <p className="text-xs font-medium">Expenses</p>
          </div>
          <p className="mt-1 text-sm font-semibold">
            {money.format(summary.expenses)}
          </p>
        </div>
      </div>
    </Card>
  );
}

function ScanCard() {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <Sparkles className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-zinc-950">
            AI receipt scanner
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-500">
            3 scans waiting. Last receipt saved 2 minutes ago.
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button className="h-12 bg-rose-500 hover:bg-rose-600">
          <Camera className="h-4 w-4" aria-hidden="true" />
          Camera
        </Button>
        <Button variant="secondary" className="h-12">
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

function MobileTrustRail() {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="flex min-w-max gap-2 sm:min-w-0 sm:flex-wrap">
        <TrustBadge icon={ShieldCheck} label="Private by default" />
        <TrustBadge icon={BadgeCheck} label="Vault sync healthy" />
        <TrustBadge icon={LockKeyhole} label={`${summary.vaultCount} receipts`} />
      </div>
    </div>
  );
}

function CashflowChart() {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold sm:text-lg">Cashflow</h2>
          <p className="mt-1 text-sm text-zinc-500">This week</p>
        </div>
        <Badge className="bg-emerald-50 text-emerald-700">Healthy</Badge>
      </div>

      <div className="mt-5 h-48 sm:h-64 lg:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={weeklyTrend} margin={{ left: -18, right: 8 }}>
            <defs>
              <linearGradient id="spend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fb7185" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="#e4e4e7"
              strokeDasharray="4 4"
              vertical={false}
            />
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
      </div>
    </Card>
  );
}

function CategoryChart() {
  return (
    <Card className="p-4 sm:p-5">
      <h2 className="text-base font-semibold sm:text-lg">Categories</h2>
      <p className="mt-1 text-sm text-zinc-500">Auto-categorized spend</p>

      <div className="mt-5 h-56 sm:h-64 lg:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={categorySpend}
            layout="vertical"
            margin={{ left: -8, right: 8 }}
          >
            <CartesianGrid
              stroke="#e4e4e7"
              strokeDasharray="4 4"
              horizontal={false}
            />
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
      </div>
    </Card>
  );
}

function InvoiceTracker() {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold sm:text-lg">
            E-Invoice tracker
          </h2>
          <p className="mt-1 text-sm text-zinc-500">Compliance exports</p>
        </div>
        <FileCheck2 className="h-5 w-5 text-rose-500" aria-hidden="true" />
      </div>

      <div className="mt-5">
        <p className="text-3xl font-semibold">{summary.einvoicesReady}</p>
        <p className="mt-1 text-sm text-zinc-500">
          documents ready for PDF and CSV reporting.
        </p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-200">
          <div className="h-full w-3/4 rounded-full bg-rose-500" />
        </div>
      </div>
    </Card>
  );
}

function RecentActivity() {
  return (
    <Card className="p-4 sm:p-5">
      <h2 className="text-base font-semibold sm:text-lg">Recent activity</h2>
      <div className="mt-3 divide-y divide-zinc-100">
        {recentActivity.map((item) => (
          <div
            key={item.title}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-4"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-950">
                {item.title}
              </p>
              <p className="mt-1 truncate text-sm text-zinc-500">
                {item.detail}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-zinc-950">
                {item.amount}
              </p>
              <p className="mt-1 text-xs font-medium text-emerald-700">
                {item.status}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function MobileBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2 shadow-sm backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {navItems.map(([label, Icon], index) => (
          <button
            key={label}
            className={cn(
              "flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-medium transition",
              index === 0
                ? "bg-zinc-950 text-white"
                : "text-zinc-500 hover:bg-zinc-100",
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

export function MainDashboard() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="mx-auto flex w-full max-w-7xl gap-8 px-4 pb-28 sm:px-6 lg:px-8 lg:py-6">
        <DesktopSidebar />

        <div className="min-w-0 flex-1">
          <MobileTopBar />

          <div className="space-y-4 pt-4 sm:space-y-5 lg:pt-0">
            <header className="hidden items-end justify-between gap-6 lg:flex">
              <div className="max-w-2xl">
                <p className="text-sm font-medium text-rose-600">
                  Weekly financial pulse
                </p>
                <h1 className="mt-2 text-4xl font-semibold tracking-normal text-zinc-950">
                  Money, receipts, and e-invoices, organized for today.
                </h1>
              </div>
              <MobileTrustRail />
            </header>

            <div className="lg:hidden">
              <MobileTrustRail />
            </div>

            <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
              <BalanceCard />
              <ScanCard />
            </section>

            <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              <MiniStat
                title="Receipts"
                value={`${summary.vaultCount}`}
                icon={LockKeyhole}
                tone="emerald"
              />
              <MiniStat
                title="To review"
                value={`${summary.scanQueue}`}
                icon={Sparkles}
                tone="rose"
              />
              <MiniStat
                title="E-Invoices"
                value={`${summary.einvoicesReady}`}
                icon={FileCheck2}
              />
              <MiniStat
                title="This month"
                value={money.format(summary.expenses)}
                icon={ArrowUpRight}
              />
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
              <CashflowChart />
              <CategoryChart />
            </section>

            <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
              <InvoiceTracker />
              <RecentActivity />
            </section>
          </div>
        </div>
      </div>

      <MobileBottomNav />
    </main>
  );
}
