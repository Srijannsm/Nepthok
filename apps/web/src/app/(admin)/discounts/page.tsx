"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { get, post, del } from "@/lib/api";
import { fmtRs, Icon, Badge, StatusBadge } from "@/components/nk/primitives";
import { PaginatedResponse } from "@/types";

interface Discount {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: string;
  minOrderAmount: string | null;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface AccessCheck { hasAccess: boolean; }

const schema = z.object({
  code: z.string().min(3).max(20).regex(/^[A-Z0-9_-]+$/, "Uppercase letters, numbers, hyphens, underscores only"),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.coerce.number().min(0.01),
  minOrderAmount: z.coerce.number().min(0).optional(),
  maxUses: z.coerce.number().int().min(1).optional(),
  expiresAt: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function DiscountsPage() {
  const qc = useQueryClient();
  const [page, setPage]         = useState(1);
  const [sheetOpen, setSheet]   = useState(false);

  const { data: access, isLoading: accessLoading } = useQuery<AccessCheck>({
    queryKey: ["access", "discounts"],
    queryFn: () => get<AccessCheck>("/subscriptions/check-access?feature=discounts"),
  });

  const { data, isLoading } = useQuery<PaginatedResponse<Discount>>({
    queryKey: ["discounts", page],
    queryFn: () => get<PaginatedResponse<Discount>>(`/seller/discounts?page=${page}&limit=20`),
    enabled: !!access?.hasAccess,
  });

  const discounts  = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues, unknown, FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: { type: "PERCENTAGE" },
  });

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => post("/seller/discounts", values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["discounts"] });
      toast.success("Discount code created");
      setSheet(false);
      reset();
    },
    onError: () => toast.error("Failed to create discount"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => del(`/seller/discounts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["discounts"] }),
    onError: () => toast.error("Failed to deactivate discount"),
  });

  if (accessLoading) {
    return (
      <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ height: 28, width: 180, background: "var(--nk-bg-2)", borderRadius: 6 }} />
        <div style={{ height: 180, background: "var(--nk-bg-2)", borderRadius: 8 }} />
      </div>
    );
  }

  if (!access?.hasAccess) {
    return (
      <div style={{ padding: 22 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.018em", margin: "0 0 16px" }}>Discount Codes</h1>
        <div className="nk-card" style={{ padding: "48px 24px", textAlign: "center" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--nk-bg-2)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <Icon name="lock" size={20} color="var(--nk-muted)" />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>PRO Feature</div>
          <div style={{ fontSize: 13, color: "var(--nk-muted)", maxWidth: 360, margin: "0 auto 18px" }}>
            Discount codes are available on the PRO plan. Upgrade to create and manage discount codes for your customers.
          </div>
          <a href="/subscription" className="nk-btn nk-btn-primary" style={{ display: "inline-flex" }}>
            Upgrade to PRO <Icon name="arrowRight" size={13} />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.018em", margin: 0 }}>Discount Codes</h1>
          <div style={{ fontSize: 12.5, color: "var(--nk-muted)", marginTop: 3 }}>{discounts.length} codes</div>
        </div>
        <button className="nk-btn nk-btn-primary" style={{ gap: 6 }} onClick={() => { reset(); setSheet(true); }}>
          <Icon name="plus" size={14} />
          Create code
        </button>
      </div>

      {/* Table */}
      <div className="nk-card" style={{ overflow: "hidden", padding: 0 }}>
        {isLoading ? (
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2, 3].map((i) => <div key={i} style={{ height: 44, background: "var(--nk-bg-2)", borderRadius: 6 }} />)}
          </div>
        ) : discounts.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--nk-bg-2)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <Icon name="tag" size={18} color="var(--nk-muted)" />
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>No discount codes</div>
            <div style={{ fontSize: 13, color: "var(--nk-muted)", marginBottom: 16 }}>Create your first discount code to offer deals to customers.</div>
            <button className="nk-btn nk-btn-primary nk-btn-sm" onClick={() => { reset(); setSheet(true); }}>
              <Icon name="plus" size={13} /> Create code
            </button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="nk-table">
              <thead>
                <tr>
                  <th style={{ width: 120 }}>Code</th>
                  <th style={{ width: 100 }}>Type</th>
                  <th className="nk-num" style={{ width: 100 }}>Value</th>
                  <th className="nk-num" style={{ width: 120 }}>Min order</th>
                  <th style={{ width: 90, textAlign: "center" }}>Used / Max</th>
                  <th style={{ width: 110 }}>Expires</th>
                  <th style={{ width: 90 }}>Status</th>
                  <th style={{ width: 50 }}></th>
                </tr>
              </thead>
              <tbody>
                {discounts.map((d) => {
                  const expires = d.expiresAt
                    ? new Date(d.expiresAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })
                    : "Never";
                  return (
                    <tr key={d.id}>
                      <td className="nk-mono" style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: "0.04em" }}>{d.code}</td>
                      <td style={{ fontSize: 12, color: "var(--nk-muted)", textTransform: "capitalize" }}>{d.type.toLowerCase()}</td>
                      <td className="nk-num nk-tnum" style={{ fontWeight: 500 }}>
                        {d.type === "PERCENTAGE" ? `${d.value}%` : fmtRs(Number(d.value))}
                      </td>
                      <td className="nk-num nk-tnum" style={{ fontSize: 12, color: "var(--nk-muted)" }}>
                        {d.minOrderAmount ? fmtRs(Number(d.minOrderAmount)) : "—"}
                      </td>
                      <td className="nk-tnum" style={{ textAlign: "center", fontSize: 12 }}>
                        {d.usedCount} / {d.maxUses ?? "∞"}
                      </td>
                      <td style={{ fontSize: 12, color: "var(--nk-muted)" }}>{expires}</td>
                      <td><StatusBadge status={d.isActive ? "ACTIVE" : "ARCHIVED"} /></td>
                      <td>
                        <button
                          className="nk-btn nk-btn-ghost nk-btn-icon"
                          style={{ height: 28, width: 28, color: "var(--nk-danger)" }}
                          disabled={deleteMutation.isPending || !d.isActive}
                          onClick={() => deleteMutation.mutate(d.id)}
                          title="Deactivate"
                        >
                          <Icon name="x" size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderTop: "1px solid var(--nk-border)", fontSize: 12.5, color: "var(--nk-muted)" }}>
            <span>Page {page} of {totalPages}</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="nk-btn nk-btn-secondary nk-btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <button className="nk-btn nk-btn-secondary nk-btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Create sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheet}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto" style={{ padding: 0 }}>
          <div style={{ padding: 22, borderBottom: "1px solid var(--nk-border)" }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Create Discount Code</h2>
          </div>
          <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>

            <div>
              <label className="nk-label">Code *</label>
              <input className="nk-input nk-mono" {...register("code")} placeholder="SAVE20" style={{ textTransform: "uppercase" }} />
              {errors.code && <p style={{ fontSize: 11.5, color: "var(--nk-danger)", marginTop: 4 }}>{errors.code.message}</p>}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label className="nk-label">Type *</label>
                <select className="nk-input" {...register("type")}>
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed (NPR)</option>
                </select>
              </div>
              <div>
                <label className="nk-label">Value *</label>
                <input className="nk-input nk-tnum" type="number" step="0.01" {...register("value")} placeholder="10" />
                {errors.value && <p style={{ fontSize: 11.5, color: "var(--nk-danger)", marginTop: 4 }}>{errors.value.message}</p>}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label className="nk-label">Min order (NPR)</label>
                <input className="nk-input nk-tnum" type="number" {...register("minOrderAmount")} placeholder="500" />
              </div>
              <div>
                <label className="nk-label">Max uses</label>
                <input className="nk-input nk-tnum" type="number" {...register("maxUses")} placeholder="100" />
              </div>
            </div>

            <div>
              <label className="nk-label">Expires at</label>
              <input className="nk-input" type="date" {...register("expiresAt")} />
            </div>

            <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
              <button type="button" className="nk-btn nk-btn-secondary" style={{ flex: 1 }} onClick={() => setSheet(false)}>Cancel</button>
              <button type="submit" className="nk-btn nk-btn-primary" style={{ flex: 1 }} disabled={isSubmitting || createMutation.isPending}>
                {(isSubmitting || createMutation.isPending) ? "Creating…" : "Create code"}
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
