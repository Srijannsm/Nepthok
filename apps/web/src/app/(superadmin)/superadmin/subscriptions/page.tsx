"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { get, post } from "@/lib/api";
import { formatNPR, formatDate } from "@/lib/utils";
import { Plan, PaginatedResponse } from "../../../../types";
import { StatusBadge } from "../../../../components/shared/status-badge";
import { EmptyState } from "../../../../components/shared/empty-state";
import { PageHeader } from "../../../../components/shared/page-header";

interface SubscriptionTenant {
  id: string;
  name: string;
  slug: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  tier: string;
  price: string;
  billingCycle: string;
}

interface SubscriptionPayment {
  id: string;
  amount: string;
  method: string;
  status: string;
  paidAt: string;
}

interface AdminSubscription {
  id: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  tenant: SubscriptionTenant;
  plan: SubscriptionPlan;
  payments: SubscriptionPayment[];
}

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Trial", value: "TRIAL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Past Due", value: "PAST_DUE" },
  { label: "Expired", value: "EXPIRED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const PAYMENT_METHODS = [
  { label: "eSewa", value: "ESEWA" },
  { label: "Khalti", value: "KHALTI" },
  { label: "Bank Transfer", value: "BANK_TRANSFER" },
];

export default function SubscriptionsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [paymentTarget, setPaymentTarget] = useState<AdminSubscription | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);

  const [paymentForm, setPaymentForm] = useState({ amount: "", method: "ESEWA", transactionId: "" });
  const [assignForm, setAssignForm] = useState({ tenantId: "", planId: "", paymentMethod: "ESEWA" });

  const qc = useQueryClient();

  const { data, isLoading } = useQuery<PaginatedResponse<AdminSubscription>>({
    queryKey: ["superadmin", "subscriptions", statusFilter, page],
    queryFn: () =>
      get<PaginatedResponse<AdminSubscription>>(
        `/subscriptions?page=${page}&limit=20${statusFilter ? `&status=${statusFilter}` : ""}`,
      ),
  });

  const { data: plans } = useQuery<Plan[]>({
    queryKey: ["plans"],
    queryFn: () => get<Plan[]>("/plans"),
    enabled: assignOpen,
  });

  const recordPaymentMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: unknown }) =>
      post(`/subscriptions/${id}/payments`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["superadmin", "subscriptions"] });
      toast.success("Payment recorded");
      setPaymentTarget(null);
      setPaymentForm({ amount: "", method: "ESEWA", transactionId: "" });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to record payment"),
  });

  const assignPlanMutation = useMutation({
    mutationFn: (body: unknown) => post("/subscriptions", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["superadmin", "subscriptions"] });
      toast.success("Plan assigned");
      setAssignOpen(false);
      setAssignForm({ tenantId: "", planId: "", paymentMethod: "ESEWA" });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to assign plan"),
  });

  const subs = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  function openPaymentDialog(sub: AdminSubscription) {
    setPaymentTarget(sub);
    setPaymentForm({ amount: sub.plan?.price ?? "", method: "ESEWA", transactionId: "" });
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Subscriptions"
        action={
          <Button onClick={() => setAssignOpen(true)}>Assign Plan</Button>
        }
      />

      <div className="flex gap-1 flex-wrap mb-4">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Seller</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Last Payment</TableHead>
              <TableHead className="w-36">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : subs.length === 0
              ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <EmptyState
                      icon={RefreshCw}
                      title="No subscriptions found"
                      description="Subscriptions will appear here once sellers are assigned plans."
                    />
                  </TableCell>
                </TableRow>
              )
              : subs.map((sub) => {
                  const lastPayment = sub.payments?.[0];
                  return (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <p className="text-sm font-medium">{sub.tenant?.name ?? "—"}</p>
                        <p className="text-xs font-mono text-muted-foreground">{sub.tenant?.slug ?? ""}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{sub.plan?.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{sub.plan?.tier ?? ""}</p>
                      </TableCell>
                      <TableCell><StatusBadge status={sub.status} /></TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(sub.currentPeriodStart)} → {formatDate(sub.currentPeriodEnd)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {lastPayment ? (
                          <div>
                            <p>{formatNPR(Number(lastPayment.amount))}</p>
                            <p>{formatDate(lastPayment.paidAt)}</p>
                          </div>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => openPaymentDialog(sub)}>
                          Record Payment
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
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

      {/* Record Payment dialog */}
      <Dialog open={!!paymentTarget} onOpenChange={(open) => { if (!open) setPaymentTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment — {paymentTarget?.tenant?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Amount (NPR)</Label>
              <Input
                type="number"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <select
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={paymentForm.method}
                onChange={(e) => setPaymentForm((f) => ({ ...f, method: e.target.value }))}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Transaction ID (optional)</Label>
              <Input
                value={paymentForm.transactionId}
                onChange={(e) => setPaymentForm((f) => ({ ...f, transactionId: e.target.value }))}
                placeholder="e.g. ESW-12345"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentTarget(null)}>Cancel</Button>
            <Button
              disabled={!paymentForm.amount || recordPaymentMutation.isPending}
              onClick={() =>
                paymentTarget &&
                recordPaymentMutation.mutate({
                  id: paymentTarget.id,
                  body: {
                    amount: Number(paymentForm.amount),
                    method: paymentForm.method,
                    transactionId: paymentForm.transactionId || undefined,
                  },
                })
              }
            >
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Plan dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Plan to Seller</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Tenant ID</Label>
              <Input
                value={assignForm.tenantId}
                onChange={(e) => setAssignForm((f) => ({ ...f, tenantId: e.target.value }))}
                placeholder="Paste tenant ID"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Plan</Label>
              <select
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={assignForm.planId}
                onChange={(e) => setAssignForm((f) => ({ ...f, planId: e.target.value }))}
              >
                <option value="">Select plan…</option>
                {(plans ?? []).map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {formatNPR(Number(p.price))}/mo</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <select
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={assignForm.paymentMethod}
                onChange={(e) => setAssignForm((f) => ({ ...f, paymentMethod: e.target.value }))}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button
              disabled={!assignForm.tenantId || !assignForm.planId || assignPlanMutation.isPending}
              onClick={() =>
                assignPlanMutation.mutate({
                  tenantId: assignForm.tenantId,
                  planId: assignForm.planId,
                  paymentMethod: assignForm.paymentMethod,
                })
              }
            >
              Assign Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
