"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, CreditCard, ShoppingBag, TrendingUp } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { get } from "@/lib/api";
import { formatNPR } from "@/lib/utils";
import { PageHeader } from "../../../../components/shared/page-header";

interface PlatformSummary {
  totalTenants: number;
  activeTenants: number;
  pendingApproval: number;
  totalRevenue: number;
  totalOrders: number;
  activeSubscriptions: number;
  monthlyRecurringRevenue: number;
}

interface TopTenant {
  id?: string;
  name?: string;
  slug?: string;
  orderCount: number;
}

interface PlatformAnalyticsData {
  summary: PlatformSummary;
  topTenants: TopTenant[];
  subscriptionBreakdown: { basic: number; pro: number };
}

const PERIODS = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
];

export default function PlatformAnalyticsPage() {
  const [period, setPeriod] = useState("30d");

  const { data, isLoading } = useQuery<PlatformAnalyticsData>({
    queryKey: ["superadmin", "analytics", period],
    queryFn: () => get<PlatformAnalyticsData>(`/analytics/platform?period=${period}`),
  });

  const summary = data?.summary;
  const topTenants = data?.topTenants ?? [];
  const breakdown = data?.subscriptionBreakdown;

  const subscriptionChartData = breakdown
    ? [
        { name: "Basic", count: breakdown.basic },
        { name: "Pro", count: breakdown.pro },
      ]
    : [];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Platform Analytics"
        action={
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  period === p.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { title: "Total Revenue", value: isLoading ? null : formatNPR(summary?.totalRevenue ?? 0), icon: TrendingUp },
          { title: "Total Orders", value: isLoading ? null : String(summary?.totalOrders ?? 0), icon: ShoppingBag },
          { title: "Active Sellers", value: isLoading ? null : String(summary?.activeTenants ?? 0), icon: BarChart3 },
          { title: "Monthly Recurring Revenue", value: isLoading ? null : formatNPR(summary?.monthlyRecurringRevenue ?? 0), icon: CreditCard },
        ].map(({ title, value, icon: Icon }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {value === null ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold">{value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Sellers table */}
        <Card>
          <CardHeader><CardTitle className="text-base">Top Sellers by Orders</CardTitle></CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : topTenants.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No order data yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Store</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topTenants.map((t, idx) => (
                    <TableRow key={t.id ?? idx}>
                      <TableCell>
                        <p className="text-sm font-medium">{t.name ?? "Unknown"}</p>
                        {t.slug && <p className="text-xs font-mono text-muted-foreground">{t.slug}</p>}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">{t.orderCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Subscription breakdown chart */}
        <Card>
          <CardHeader><CardTitle className="text-base">Subscription Breakdown</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={subscriptionChartData} barSize={48}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex justify-around mt-3 text-sm">
                  <div className="text-center">
                    <p className="font-semibold text-lg">{breakdown?.basic ?? 0}</p>
                    <p className="text-muted-foreground text-xs">Basic</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-lg">{breakdown?.pro ?? 0}</p>
                    <p className="text-muted-foreground text-xs">Pro</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-lg">{summary?.activeSubscriptions ?? 0}</p>
                    <p className="text-muted-foreground text-xs">Total Active</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Platform stats summary */}
      <Card>
        <CardHeader><CardTitle className="text-base">Platform Stats</CardTitle></CardHeader>
        <CardContent className="space-y-3 pt-2">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
          ) : (
            [
              { label: "Total Registered Sellers", value: String(summary?.totalTenants ?? 0) },
              { label: "Active Sellers", value: String(summary?.activeTenants ?? 0) },
              { label: "Pending Approval", value: String(summary?.pendingApproval ?? 0) },
              { label: "Active Subscriptions", value: String(summary?.activeSubscriptions ?? 0) },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center text-sm border-b last:border-0 pb-2 last:pb-0">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-semibold">{value}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
