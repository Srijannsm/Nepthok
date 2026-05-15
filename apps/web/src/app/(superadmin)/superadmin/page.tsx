"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CreditCard, ShoppingBag, Store } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { get } from "@/lib/api";
import { formatNPR, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { PageHeader } from "../../../components/shared/page-header";

interface PlatformSummary {
  totalTenants: number;
  activeTenants: number;
  pendingApproval: number;
  totalRevenue: number;
  totalOrders: number;
  activeSubscriptions: number;
  monthlyRecurringRevenue: number;
}

interface RecentTenant {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

interface PlatformData {
  summary: PlatformSummary;
  recentTenants: RecentTenant[];
  subscriptionBreakdown: { basic: number; pro: number };
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
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function SuperAdminDashboard() {
  const { data, isLoading } = useQuery<PlatformData>({
    queryKey: ["superadmin", "platform"],
    queryFn: () => get<PlatformData>("/analytics/platform?period=30d"),
  });

  const summary = data?.summary;
  const recentTenants = data?.recentTenants ?? [];
  const breakdown = data?.subscriptionBreakdown;

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Platform Overview" description="All stores — last 30 days" />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Sellers"
          value={String(summary?.totalTenants ?? 0)}
          icon={Store}
          loading={isLoading}
        />
        <StatCard
          title="Monthly Recurring Revenue"
          value={formatNPR(summary?.monthlyRecurringRevenue ?? 0)}
          icon={CreditCard}
          loading={isLoading}
        />
        <StatCard
          title="Total Orders"
          value={String(summary?.totalOrders ?? 0)}
          icon={ShoppingBag}
          loading={isLoading}
        />
        <StatCard
          title="Pending Approvals"
          value={String(summary?.pendingApproval ?? 0)}
          icon={AlertTriangle}
          loading={isLoading}
          alert={(summary?.pendingApproval ?? 0) > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Active Stores</CardTitle></CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : recentTenants.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No active stores yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Store</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTenants.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-sm font-medium">{t.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{t.slug}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(t.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Subscription Breakdown</CardTitle></CardHeader>
          <CardContent className="space-y-3 pt-2">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
            ) : (
              [
                { label: "Active Tenants", value: String(summary?.activeTenants ?? 0) },
                { label: "Active Subscriptions", value: String(summary?.activeSubscriptions ?? 0) },
                { label: "Basic Plan Subscribers", value: String(breakdown?.basic ?? 0) },
                { label: "Pro Plan Subscribers", value: String(breakdown?.pro ?? 0) },
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
    </div>
  );
}
