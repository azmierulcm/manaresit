"use client";

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
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardStats } from "@/hooks/use-dashboard-stats";

export function CashflowChart({
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
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Income
          </span>
          <span className="flex items-center gap-1 text-xs text-rose-500 font-medium">
            <span className="h-2 w-2 rounded-full bg-rose-500" /> Expenses
          </span>
          <Badge className="bg-emerald-50 text-emerald-700">Live</Badge>
        </div>
      </div>

      <div className="mt-5 h-48 sm:h-64 lg:h-72">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: -18, right: 8 }}>
              <defs>
                <linearGradient id="gradSpend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e4e4e7" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 12 }} width={38} />
              <Tooltip
                cursor={{ stroke: "#d4d4d8" }}
                contentStyle={{ borderRadius: "16px", border: "1px solid #e4e4e7", boxShadow: "0 1px 2px rgb(0 0 0 / 0.05)" }}
              />
              <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2} fill="url(#gradIncome)" />
              <Area type="monotone" dataKey="spend" name="Expenses" stroke="#f43f5e" strokeWidth={2} fill="url(#gradSpend)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}

export function CategoryChart({
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
                contentStyle={{ borderRadius: "16px", border: "1px solid #e4e4e7" }}
              />
              <Bar dataKey="amount" fill="#10b981" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
