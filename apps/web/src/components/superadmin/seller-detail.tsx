"use client";

import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { get } from "@/lib/api";
import { formatNPR, formatDate } from "@/lib/utils";
import { Tenant } from "../../types";
import { StatusBadge } from "../shared/status-badge";

interface RecentOrder {
  id: string;
  orderNumber: string;
  buyerName: string;
  total: string;
  status: string;
  createdAt: string;
}

interface TenantDetail extends Tenant {
  _count?: { products: number; orders: number };
  recentOrders?: RecentOrder[];
  totalRevenue?: number;
}

interface Props {
  tenantId: string;
  currentStatus: string;
  onApprove: () => void;
  onSuspend: () => void;
}

export function SellerDetail({ tenantId, currentStatus, onApprove, onSuspend }: Props) {
  const { data: tenant, isLoading } = useQuery<TenantDetail>({
    queryKey: ["superadmin", "tenant", tenantId],
    queryFn: () => get<TenantDetail>(`/tenants/${tenantId}`),
  });

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!tenant) return null;

  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="border-b p-4">
        <div className="flex items-center gap-3">
          <SheetTitle>{tenant.name}</SheetTitle>
          <StatusBadge status={tenant.status} />
        </div>
        <p className="text-xs font-mono text-muted-foreground">{tenant.slug}</p>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto divide-y">
        {/* Owner info */}
        <section className="p-4 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Owner</p>
          <p className="text-sm font-medium">{tenant.owner?.name ?? "—"}</p>
          <p className="text-sm text-muted-foreground">{tenant.owner?.email ?? "—"}</p>
          <p className="text-sm text-muted-foreground">{tenant.owner?.phone ?? "—"}</p>
        </section>

        {/* Subscription info */}
        <section className="p-4 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Subscription</p>
          {tenant.subscription ? (
            <>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{tenant.subscription.plan?.name ?? "—"}</p>
                <StatusBadge status={tenant.subscription.status} />
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDate(tenant.subscription.currentPeriodStart)} →{" "}
                {formatDate(tenant.subscription.currentPeriodEnd)}
              </p>
              <p className="text-sm text-muted-foreground">
                MRR: {formatNPR(Number(tenant.subscription.plan?.price ?? 0))}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No active subscription</p>
          )}
        </section>

        {/* Store description */}
        {tenant.description && (
          <section className="p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Description</p>
            <p className="text-sm text-muted-foreground">{tenant.description}</p>
          </section>
        )}

        {/* Store links */}
        <section className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Store</p>
          <a
            href={`/store/${tenant.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            View Store <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </section>

        {/* Metadata */}
        <section className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Info</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Joined</span>
              <span>{formatDate(tenant.createdAt)}</span>
            </div>
          </div>
        </section>

        <Separator />

        {/* Actions */}
        <section className="p-4 space-y-2">
          {currentStatus === "PENDING" && (
            <Button className="w-full" onClick={onApprove}>
              Approve Seller
            </Button>
          )}
          {currentStatus === "ACTIVE" && (
            <Button className="w-full" variant="destructive" onClick={onSuspend}>
              Suspend Seller
            </Button>
          )}
        </section>
      </div>
    </div>
  );
}
