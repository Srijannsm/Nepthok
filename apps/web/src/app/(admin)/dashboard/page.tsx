"use client";

import { useQuery } from "@tanstack/react-query";
import { Package, ShoppingCart, TrendingUp, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { get } from "@/lib/api";
import { formatNPR } from "@/lib/utils";
import { useAuthStore } from "../../../store/auth.store";

interface DashboardSummary {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalProductViews: number;
  conversionRate: null;
}

interface DashboardData {
  summary: DashboardSummary;
  lowStockProducts: { id: string; name: string; stock: number; lowStockThreshold: number }[];
}

function StatCard({
  title,
  value,
  icon: Icon,
  loading,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <p className="text-2xl font-bold">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["analytics", "dashboard"],
    queryFn: () => get<DashboardData>("/analytics/dashboard?period=30d"),
  });

  const summary = data?.summary;
  const lowStockCount = data?.lowStockProducts?.length ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user?.name ?? "Seller"}</h1>
        <p className="text-muted-foreground text-sm mt-1">Here&apos;s your store overview for the last 30 days.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Orders"
          value={String(summary?.totalOrders ?? 0)}
          icon={ShoppingCart}
          loading={isLoading}
        />
        <StatCard
          title="Total Revenue"
          value={formatNPR(summary?.totalRevenue ?? 0)}
          icon={TrendingUp}
          loading={isLoading}
        />
        <StatCard
          title="Products Listed"
          value={isLoading ? "—" : "—"}
          icon={Package}
          loading={isLoading}
        />
        <StatCard
          title="Low Stock Alerts"
          value={String(lowStockCount)}
          icon={AlertTriangle}
          loading={isLoading}
        />
      </div>
    </div>
  );
}
