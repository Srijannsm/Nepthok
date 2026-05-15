"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Store } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { get, patch } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Tenant, PaginatedResponse } from "../../../../types";
import { StatusBadge } from "../../../../components/shared/status-badge";
import { EmptyState } from "../../../../components/shared/empty-state";
import { PageHeader } from "../../../../components/shared/page-header";
import { SellerDetail } from "../../../../components/superadmin/seller-detail";

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Active", value: "ACTIVE" },
  { label: "Suspended", value: "SUSPENDED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export default function SellersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<Tenant | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<PaginatedResponse<Tenant>>({
    queryKey: ["superadmin", "sellers", search, status, page],
    queryFn: () =>
      get<PaginatedResponse<Tenant>>(
        `/tenants?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}${status ? `&status=${status}` : ""}`,
      ),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => patch(`/tenants/${id}/approve`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["superadmin", "sellers"] });
      toast.success("Seller approved");
    },
    onError: () => toast.error("Failed to approve seller"),
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      patch(`/tenants/${id}/suspend`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["superadmin", "sellers"] });
      toast.success("Seller suspended");
      setSuspendTarget(null);
      setSuspendReason("");
    },
    onError: () => toast.error("Failed to suspend seller"),
  });

  const tenants = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="p-6">
      <PageHeader title="Sellers" />

      <div className="space-y-3 mb-4">
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sellers…"
            className="pl-8"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setStatus(tab.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                status === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Store Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Owner Email</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-36">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : tenants.length === 0
              ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
                    <EmptyState
                      icon={Store}
                      title="No sellers found"
                      description="Seller registrations will appear here."
                    />
                  </TableCell>
                </TableRow>
              )
              : tenants.map((tenant) => (
                  <TableRow
                    key={tenant.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedTenant(tenant)}
                  >
                    <TableCell className="text-sm font-medium">{tenant.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{tenant.slug}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{tenant.owner?.email ?? "—"}</TableCell>
                    <TableCell className="text-xs">
                      {tenant.subscription?.plan?.tier ?? <span className="text-muted-foreground">None</span>}
                    </TableCell>
                    <TableCell><StatusBadge status={tenant.status} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(tenant.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="ghost" onClick={() => setSelectedTenant(tenant)}>
                          View
                        </Button>
                        {tenant.status === "PENDING" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={approveMutation.isPending}
                            onClick={() => approveMutation.mutate(tenant.id)}
                          >
                            Approve
                          </Button>
                        )}
                        {tenant.status === "ACTIVE" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setSuspendTarget(tenant)}
                          >
                            Suspend
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Seller detail sheet */}
      <Sheet open={!!selectedTenant} onOpenChange={(open) => { if (!open) setSelectedTenant(null); }}>
        <SheetContent className="w-full sm:max-w-lg p-0 overflow-y-auto">
          {selectedTenant && (
            <SellerDetail
              tenantId={selectedTenant.id}
              onApprove={() => { approveMutation.mutate(selectedTenant.id); setSelectedTenant(null); }}
              onSuspend={() => { setSuspendTarget(selectedTenant); setSelectedTenant(null); }}
              currentStatus={selectedTenant.status}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Suspend confirmation dialog */}
      <Dialog open={!!suspendTarget} onOpenChange={(open) => { if (!open) { setSuspendTarget(null); setSuspendReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend {suspendTarget?.name}?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              The seller will lose access to the admin panel. Provide a reason below.
            </p>
            <Input
              placeholder="Reason for suspension (optional)"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSuspendTarget(null); setSuspendReason(""); }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={suspendMutation.isPending}
              onClick={() => suspendTarget && suspendMutation.mutate({ id: suspendTarget.id, reason: suspendReason })}
            >
              Suspend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
