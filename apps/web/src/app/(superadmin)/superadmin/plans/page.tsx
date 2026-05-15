"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CreditCard, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { get, patch } from "@/lib/api";
import { formatNPR } from "@/lib/utils";
import { Plan } from "../../../../types";
import { PageHeader } from "../../../../components/shared/page-header";
import { EmptyState } from "../../../../components/shared/empty-state";

interface PlanWithStats extends Plan {
  isActive?: boolean;
  _count?: { subscriptions: number };
}

interface EditForm {
  name: string;
  price: string;
  maxProducts: string;
  features: string;
  isActive: boolean;
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["superadmin", "plans"] });
      toast.success("Plan updated");
      setEditingPlan(null);
    },
    onError: () => toast.error("Failed to update plan"),
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
    const features = form.features.split("\n").map((f) => f.trim()).filter(Boolean);
    updateMutation.mutate({
      id: editingPlan.id,
      data: {
        name: form.name,
        price: form.price,
        maxProducts: form.maxProducts ? Number(form.maxProducts) : null,
        features,
        isActive: form.isActive,
      } as Partial<Plan> & { isActive?: boolean },
    });
  }

  return (
    <div className="p-6">
      <PageHeader title="Subscription Plans" />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-72 w-full" />)}
        </div>
      ) : !plans?.length ? (
        <EmptyState icon={CreditCard} title="No plans found" description="Plans will appear here." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <Badge variant={plan.tier === "PRO" ? "default" : "secondary"}>{plan.tier}</Badge>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(plan)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-2xl font-bold mt-1">{formatNPR(Number(plan.price))}<span className="text-sm font-normal text-muted-foreground">/month</span></p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">
                    Max Products: {plan.maxProducts ?? "Unlimited"}
                  </p>
                  <Separator />
                </div>
                <div className="space-y-1.5">
                  {(plan.features as string[]).map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit plan sheet */}
      <Sheet open={!!editingPlan} onOpenChange={(open) => { if (!open) setEditingPlan(null); }}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Edit Plan — {editingPlan?.name}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Price (NPR/month)</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Max Products (leave blank for unlimited)</Label>
              <Input
                type="number"
                value={form.maxProducts}
                onChange={(e) => setForm((f) => ({ ...f, maxProducts: e.target.value }))}
                placeholder="Unlimited"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Features (one per line)</Label>
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                value={form.features}
                onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))}
                placeholder="Order management&#10;Inventory tracking&#10;Analytics"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="h-4 w-4"
              />
              <Label htmlFor="isActive">Active (visible to sellers)</Label>
            </div>
            <Button className="w-full" onClick={handleSave} disabled={updateMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
