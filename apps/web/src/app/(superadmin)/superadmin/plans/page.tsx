"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { get, patch } from "@/lib/api";
import { Icon } from "@/components/nk/primitives";
import { fmtRs } from "@/components/nk/primitives";
import { Plan } from "../../../../types";

const G = "#16a34a";

interface PlanWithStats extends Plan {
  isActive?: boolean;
  _count?: { subscriptions: number };
}

interface EditForm {
  name: string; price: string; maxProducts: string; features: string; isActive: boolean;
}

export default function PlansPage() {
  const [editingPlan, setEditingPlan] = useState<PlanWithStats | null>(null);
  const [form, setForm] = useState<EditForm>({ name: "", price: "", maxProducts: "", features: "", isActive: true });
  const qc = useQueryClient();

  const { data: plans, isLoading } = useQuery<PlanWithStats[]>({
    queryKey: ["superadmin", "plans"],
    queryFn: () => get<PlanWithStats[]>("/plans"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Plan> & { isActive?: boolean } }) =>
      patch(`/plans/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["superadmin", "plans"] }); toast.success("Plan updated"); setEditingPlan(null); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to update plan"),
  });

  function openEdit(plan: PlanWithStats) {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      price: String(plan.price),
      maxProducts: plan.maxProducts !== null ? String(plan.maxProducts) : "",
      features: (plan.features as string[]).join("\n"),
      isActive: plan.isActive !== false,
    });
  }

  function handleSave() {
    if (!editingPlan) return;
    updateMutation.mutate({
      id: editingPlan.id,
      data: {
        name: form.name,
        price: form.price,
        maxProducts: form.maxProducts ? Number(form.maxProducts) : null,
        features: form.features.split("\n").map(f => f.trim()).filter(Boolean),
        isActive: form.isActive,
      } as Partial<Plan> & { isActive?: boolean },
    });
  }

  return (
    <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.018em", margin: 0 }}>Subscription Plans</h1>
        <div style={{ fontSize: 12.5, color: "var(--nk-muted)", marginTop: 3 }}>Manage plan pricing and features</div>
      </div>

      {/* Plan cards */}
      {isLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          {[1, 2].map(i => <div key={i} style={{ height: 280, background: "var(--nk-surface)", borderRadius: 10, border: "1px solid var(--nk-border)" }} />)}
        </div>
      ) : !plans?.length ? (
        <div style={{ textAlign: "center", padding: "48px 16px", color: "var(--nk-muted)", fontSize: 13 }}>No plans found.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          {plans.map((plan) => {
            const isPro = plan.tier === "PRO";
            return (
              <div key={plan.id} className="nk-card" style={{ padding: 0, overflow: "hidden" }}>
                {/* Card header */}
                <div style={{
                  padding: "18px 20px", background: isPro ? `linear-gradient(135deg, ${G}18, ${G}08)` : "var(--nk-bg)",
                  borderBottom: "1px solid var(--nk-border)",
                  display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em" }}>{plan.name}</span>
                      <span style={{
                        fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                        padding: "2px 7px", borderRadius: 999,
                        background: isPro ? `${G}18` : "var(--nk-bg-2)",
                        color: isPro ? G : "var(--nk-muted)",
                      }}>{plan.tier}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                      <span className="nk-tnum" style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", color: isPro ? G : "var(--nk-fg)" }}>
                        {fmtRs(Number(plan.price))}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--nk-muted)" }}>/month</span>
                    </div>
                  </div>
                  <button
                    className="nk-btn"
                    style={{ padding: "6px 8px", border: "1px solid var(--nk-border)", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}
                    onClick={() => openEdit(plan)}
                  >
                    <Icon name="settings" size={12} /> Edit
                  </button>
                </div>

                {/* Body */}
                <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ fontSize: 12.5, color: "var(--nk-muted)" }}>
                    Max products: <strong style={{ color: "var(--nk-fg)" }}>{plan.maxProducts ?? "Unlimited"}</strong>
                    {plan._count?.subscriptions !== undefined && (
                      <> · <strong style={{ color: "var(--nk-fg)" }}>{plan._count.subscriptions}</strong> subscribers</>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {(plan.features as string[]).map((feature) => (
                      <div key={feature} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13 }}>
                        <Icon name="check" size={14} color={isPro ? G : "var(--nk-success)"} />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit sheet */}
      <Sheet open={!!editingPlan} onOpenChange={(open) => { if (!open) setEditingPlan(null); }}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader><SheetTitle>Edit Plan — {editingPlan?.name}</SheetTitle></SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Price (NPR/month)</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Max Products (leave blank for unlimited)</Label>
              <Input type="number" value={form.maxProducts} onChange={(e) => setForm(f => ({ ...f, maxProducts: e.target.value }))} placeholder="Unlimited" />
            </div>
            <div className="space-y-1.5">
              <Label>Features (one per line)</Label>
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                value={form.features}
                onChange={(e) => setForm(f => ({ ...f, features: e.target.value }))}
                placeholder="Order management&#10;Inventory tracking"
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))} style={{ width: 16, height: 16 }} />
              <Label htmlFor="isActive">Active (visible to sellers)</Label>
            </div>
            <button
              className="nk-btn nk-btn-primary"
              style={{ width: "100%", background: G, borderColor: G, justifyContent: "center" }}
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
