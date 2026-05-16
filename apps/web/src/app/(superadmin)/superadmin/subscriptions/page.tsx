"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { get, post } from "@/lib/api";
import { Icon } from "@/components/nk/primitives";
import { fmtRs } from "@/components/nk/primitives";
import { formatDate } from "@/lib/utils";
import { Plan, PaginatedResponse } from "../../../../types";

const G = "#16a34a";

interface SubTenant  { id: string; name: string; slug: string }
interface SubPlan    { id: string; name: string; tier: string; price: string }
interface SubPayment { id: string; amount: string; method: string; paidAt: string }
interface AdminSubscription {
  id: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  tenant: SubTenant;
  plan: SubPlan;
  payments: SubPayment[];
}

const STATUS_TABS = [
  { label: "All",      value: "" },
  { label: "Trial",    value: "TRIAL" },
  { label: "Active",   value: "ACTIVE" },
  { label: "Past Due", value: "PAST_DUE" },
  { label: "Expired",  value: "EXPIRED" },
  { label: "Cancelled",value: "CANCELLED" },
];

const PAYMENT_METHODS = [
  { label: "eSewa",         value: "ESEWA" },
  { label: "Khalti",        value: "KHALTI" },
  { label: "Bank Transfer", value: "BANK_TRANSFER" },
];

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "var(--nk-success)", TRIAL: "var(--nk-accent)",
  PAST_DUE: "var(--nk-warning)", EXPIRED: "var(--nk-danger)", CANCELLED: "var(--nk-muted)",
};

export default function SubscriptionsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage]                 = useState(1);
  const [paymentTarget, setPaymentTarget] = useState<AdminSubscription | null>(null);
  const [assignOpen, setAssignOpen]     = useState(false);

  const [paymentForm, setPaymentForm] = useState({ amount: "", method: "ESEWA", transactionId: "" });
  const [assignForm, setAssignForm]   = useState({ tenantId: "", planId: "", paymentMethod: "ESEWA" });

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

  const { data: tenantsData } = useQuery<PaginatedResponse<{ id: string; name: string; slug: string }>>({
    queryKey: ["superadmin", "tenants-dropdown"],
    queryFn: () => get("/tenants?page=1&limit=100&status=ACTIVE"),
    enabled: assignOpen,
  });
  const tenantOptions = tenantsData?.items ?? [];

  const recordPaymentMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: unknown }) => post(`/subscriptions/${id}/payments`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["superadmin", "subscriptions"] });
      toast.success("Payment recorded");
      setPaymentTarget(null);
      setPaymentForm({ amount: "", method: "ESEWA", transactionId: "" });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to record payment"),
  });

  const assignPlanMutation = useMutation({
    mutationFn: (body: unknown) => post("/subscriptions", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["superadmin", "subscriptions"] });
      toast.success("Plan assigned");
      setAssignOpen(false);
      setAssignForm({ tenantId: "", planId: "", paymentMethod: "ESEWA" });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to assign plan"),
  });

  const subs       = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const selectCls = "flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.018em", margin: 0 }}>Subscriptions</h1>
          <div style={{ fontSize: 12.5, color: "var(--nk-muted)", marginTop: 3 }}>Seller plan management</div>
        </div>
        <button
          className="nk-btn nk-btn-primary"
          style={{ background: G, borderColor: G }}
          onClick={() => setAssignOpen(true)}
        >
          Assign Plan
        </button>
      </div>

      {/* Status filter */}
      <div style={{ display: "flex", gap: 4, padding: 3, background: "var(--nk-bg-2)", borderRadius: 7, border: "1px solid var(--nk-border)", alignSelf: "flex-start" }}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className="nk-btn"
            style={{
              height: 26, fontSize: 12, padding: "0 12px",
              background: statusFilter === tab.value ? "var(--nk-surface)" : "transparent",
              color: statusFilter === tab.value ? "var(--nk-fg)" : "var(--nk-muted)",
              boxShadow: statusFilter === tab.value ? "var(--nk-shadow-sm)" : "none",
            }}
          >{tab.label}</button>
        ))}
      </div>

      {/* Table */}
      <div className="nk-card" style={{ padding: 0 }}>
        <table className="nk-table">
          <thead>
            <tr>
              <th>Seller</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Period</th>
              <th>Last Payment</th>
              <th style={{ width: 140 }}></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j}><div style={{ height: 18, background: "var(--nk-bg-2)", borderRadius: 4 }} /></td>
                  ))}
                </tr>
              ))
            ) : subs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "36px 16px" }}>
                  <span style={{ display: "flex", justifyContent: "center", marginBottom: 8, opacity: 0.3 }}><Icon name="refresh" size={22} /></span>
                  <div style={{ fontSize: 13, color: "var(--nk-muted)" }}>No subscriptions found.</div>
                </td>
              </tr>
            ) : (
              subs.map((sub) => {
                const lastPayment = sub.payments?.[0];
                const statusColor = STATUS_COLOR[sub.status] ?? "var(--nk-muted)";
                return (
                  <tr key={sub.id}>
                    <td>
                      <div style={{ fontSize: 12.5, fontWeight: 600 }}>{sub.tenant?.name ?? "—"}</div>
                      <div style={{ fontSize: 11, fontFamily: "monospace", color: "var(--nk-muted)" }}>{sub.tenant?.slug}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: 12.5, fontWeight: 500 }}>{sub.plan?.name ?? "—"}</div>
                      <div style={{ fontSize: 11, color: "var(--nk-muted)" }}>{sub.plan?.tier}</div>
                    </td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 999,
                        background: `${statusColor}18`, color: statusColor,
                      }}>{sub.status}</span>
                    </td>
                    <td style={{ fontSize: 11.5, color: "var(--nk-muted)" }}>
                      {formatDate(sub.currentPeriodStart)} → {formatDate(sub.currentPeriodEnd)}
                    </td>
                    <td style={{ fontSize: 11.5, color: "var(--nk-muted)" }}>
                      {lastPayment ? (
                        <>
                          <div style={{ fontWeight: 500, color: "var(--nk-fg)" }}>{fmtRs(Number(lastPayment.amount))}</div>
                          <div>{formatDate(lastPayment.paidAt)}</div>
                        </>
                      ) : "—"}
                    </td>
                    <td>
                      <button
                        className="nk-btn"
                        style={{ fontSize: 12, padding: "4px 12px", border: "1px solid var(--nk-border)" }}
                        onClick={() => {
                          setPaymentTarget(sub);
                          setPaymentForm({ amount: sub.plan?.price ?? "", method: "ESEWA", transactionId: "" });
                        }}
                      >
                        Record Payment
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: "var(--nk-muted)" }}>
          <span>Page {page} of {totalPages}</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="nk-btn" style={{ border: "1px solid var(--nk-border)", padding: "4px 12px", fontSize: 12 }} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            <button className="nk-btn" style={{ border: "1px solid var(--nk-border)", padding: "4px 12px", fontSize: 12 }} disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
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
              <Input type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <select className={selectCls} value={paymentForm.method} onChange={(e) => setPaymentForm(f => ({ ...f, method: e.target.value }))}>
                {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Transaction ID (optional)</Label>
              <Input value={paymentForm.transactionId} onChange={(e) => setPaymentForm(f => ({ ...f, transactionId: e.target.value }))} placeholder="e.g. ESW-12345" />
            </div>
          </div>
          <DialogFooter>
            <button className="nk-btn" style={{ border: "1px solid var(--nk-border)", padding: "6px 14px", fontSize: 13 }} onClick={() => setPaymentTarget(null)}>Cancel</button>
            <button
              className="nk-btn nk-btn-primary"
              style={{ background: G, borderColor: G, padding: "6px 14px", fontSize: 13 }}
              disabled={!paymentForm.amount || recordPaymentMutation.isPending}
              onClick={() =>
                paymentTarget && recordPaymentMutation.mutate({
                  id: paymentTarget.id,
                  body: { amount: Number(paymentForm.amount), method: paymentForm.method, transactionId: paymentForm.transactionId || undefined },
                })
              }
            >
              {recordPaymentMutation.isPending ? "Saving…" : "Record Payment"}
            </button>
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
              <Label>Seller Store</Label>
              <select className={selectCls} value={assignForm.tenantId} onChange={(e) => setAssignForm(f => ({ ...f, tenantId: e.target.value }))}>
                <option value="">Select active seller…</option>
                {tenantOptions.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.slug})</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">Only active sellers are listed.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Plan</Label>
              <select className={selectCls} value={assignForm.planId} onChange={(e) => setAssignForm(f => ({ ...f, planId: e.target.value }))}>
                <option value="">Select plan…</option>
                {(plans ?? []).map(p => (
                  <option key={p.id} value={p.id}>{p.name} — {fmtRs(Number(p.price))}/mo</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <select className={selectCls} value={assignForm.paymentMethod} onChange={(e) => setAssignForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <button className="nk-btn" style={{ border: "1px solid var(--nk-border)", padding: "6px 14px", fontSize: 13 }} onClick={() => setAssignOpen(false)}>Cancel</button>
            <button
              className="nk-btn nk-btn-primary"
              style={{ background: G, borderColor: G, padding: "6px 14px", fontSize: 13 }}
              disabled={!assignForm.tenantId || !assignForm.planId || assignPlanMutation.isPending}
              onClick={() =>
                assignPlanMutation.mutate({
                  tenantId: assignForm.tenantId,
                  planId: assignForm.planId,
                  paymentMethod: assignForm.paymentMethod,
                })
              }
            >
              {assignPlanMutation.isPending ? "Assigning…" : "Assign Plan"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
