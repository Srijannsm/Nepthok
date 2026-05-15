"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Package,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { get } from "@/lib/api";
import { formatNPR, formatDate } from "@/lib/utils";
import { useAuthStore } from "../../../store/auth.store";
import { StatusBadge } from "../../../components/shared/status-badge";
import { EmptyState } from "../../../components/shared/empty-state";
import { cn } from "@/lib/utils";

interface DashboardSummary {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalProductViews: number;
  conversionRate: null;
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
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  loading: boolean;
  alert?: boolean;
}

function StatCard({ title, value, icon: Icon, loading, alert }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={cn("h-4 w-4", alert ? "text-red-500" : "text-muted-foreground")} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <>
            <Skeleton className="h-8 w-20 mb-1" />
            <Skeleton className="h-3 w-24" />
          </>
        ) : (
          <>
            <p className={cn("text-2xl font-bold", alert && "text-red-600")}>{value}</p>
            <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
          </>
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
  const recentOrders = data?.recentOrders ?? [];
  const lowStockProducts = data?.lowStockProducts ?? [];
  const lowStockCount = lowStockProducts.length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user?.name ?? "Seller"}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Store overview for the last 30 days
        </p>
      </div>

      {/* Stat cards — 2 cols mobile, 4 cols desktop */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Orders"
          value={String(summary?.totalOrders ?? 0)}
          icon={ShoppingBag}
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
          value="—"
          icon={Package}
          loading={isLoading}
        />
        <StatCard
          title="Low Stock Alerts"
          value={String(lowStockCount)}
          icon={AlertTriangle}
          loading={isLoading}
          alert={lowStockCount > 0}
        />
      </div>

      {/* Two-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                title="No orders yet"
                description="Orders will appear here once customers start purchasing."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.orderNumber}</TableCell>
                      <TableCell className="text-sm max-w-[100px] truncate">{order.buyerName}</TableCell>
                      <TableCell className="text-sm">
                        {formatNPR(Number(order.total))}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Low Stock Products</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : lowStockProducts.length === 0 ? (
              <EmptyState
                icon={Package}
                title="All products are well-stocked"
                description="Products with stock at or below their threshold will appear here."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Threshold</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="text-sm font-medium">{product.name}</TableCell>
                      <TableCell className="text-right text-sm text-red-600 font-medium">
                        {product.stock}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {product.lowStockThreshold}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
