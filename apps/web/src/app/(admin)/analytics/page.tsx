"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart3, Lock, TrendingUp, ShoppingBag, Package } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { get } from "@/lib/api";
import { formatNPR } from "@/lib/utils";
import { PageHeader } from "../../../components/shared/page-header";

interface AccessCheck {
  hasAccess: boolean;
}

interface DashboardSummary {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalProductViews: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  buyerName: string;
  total: string;
  status: string;
  createdAt: string;
}

interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  lowStockThreshold: number;
}

interface DashboardData {
  summary: DashboardSummary;
  recentOrders: RecentOrder[];
  lowStockProducts: LowStockProduct[];
  snapshots?: Array<{ date: string; orders: number; revenue: number }>;
}

const PERIODS = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
];

export default function AnalyticsPage() {
  const { data: access, isLoading: accessLoading } = useQuery<AccessCheck>({
    queryKey: ["access", "analytics"],
    queryFn: () => get<AccessCheck>("/subscriptions/check-access?feature=analytics"),
  });

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["analytics", "detail"],
    queryFn: () => get<DashboardData>("/analytics/dashboard?period=30d"),
    enabled: !!access?.hasAccess,
  });

  if (accessLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      </div>
    );
  }

  if (!access?.hasAccess) {
    return (
      <div className="p-6">
        <PageHeader title="Analytics" />
        <Card>
          <CardContent className="py-12 flex flex-col items-center text-center gap-4">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">PRO Feature</p>
              <p className="text-sm text-muted-foreground mt-1">
                Detailed analytics are available on the PRO plan. Upgrade to unlock insights about your store.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const summary = data?.summary;
  const snapshots = data?.snapshots ?? [];

  const revenueData = snapshots.map((s) => ({
    date: new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    revenue: s.revenue,
    orders: s.orders,
  }));

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Analytics" description="Store performance for the last 30 days." />

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Total Revenue",
            value: isLoading ? null : formatNPR(summary?.totalRevenue ?? 0),
            icon: TrendingUp,
          },
          {
            title: "Total Orders",
            value: isLoading ? null : String(summary?.totalOrders ?? 0),
            icon: ShoppingBag,
          },
          {
            title: "Avg Order Value",
            value: isLoading ? null : formatNPR(summary?.averageOrderValue ?? 0),
            icon: BarChart3,
          },
          {
            title: "Product Views",
            value: isLoading ? null : String(summary?.totalProductViews ?? 0),
            icon: Package,
          },
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

      {/* Charts */}
      {revenueData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Revenue (NPR)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => formatNPR(Number(v))} />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Orders per Day</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      ) : (
        !isLoading && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Not enough data to display charts yet. Orders will populate graphs over time.
            </CardContent>
          </Card>
        )
      )}

      {/* Low stock alert */}
      {(data?.lowStockProducts?.length ?? 0) > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Low Stock Products</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-muted-foreground">Product</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Stock</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Threshold</th>
                </tr>
              </thead>
              <tbody>
                {data!.lowStockProducts.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3 text-right text-red-600 font-medium">{p.stock}</td>
                    <td className="p-3 text-right text-muted-foreground">{p.lowStockThreshold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
