"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { get, patch } from "@/lib/api";
import { Icon } from "@/components/nk/primitives";
import { Tenant } from "@/types";
import { useAuthStore } from "@/store/auth.store";

const schema = z.object({
  name: z.string().min(1, "Store name is required"),
  description: z.string().optional(),
  logo: z.string().url("Invalid URL").optional().or(z.literal("")),
  banner: z.string().url("Invalid URL").optional().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 24, alignItems: "flex-start", padding: "18px 0", borderBottom: "1px solid var(--nk-border)" }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
        {hint && <div style={{ fontSize: 11.5, color: "var(--nk-muted)", marginTop: 3, lineHeight: 1.4 }}>{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

export default function StoreSettingsPage() {
  const qc   = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data: tenant, isLoading } = useQuery<Tenant>({
    queryKey: ["tenant", "my"],
    queryFn: () => get<Tenant>("/tenants/my"),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (tenant) {
      reset({ name: tenant.name ?? "", description: tenant.description ?? "", logo: tenant.logo ?? "", banner: tenant.banner ?? "" });
    }
  }, [tenant, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => patch(`/tenants/${user?.tenantId}`, values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tenant"] }); toast.success("Store settings saved"); },
    onError: () => toast.error("Failed to save settings"),
  });

  if (isLoading) {
    return (
      <div style={{ padding: 22, maxWidth: 720 }}>
        <div style={{ height: 28, width: 180, background: "var(--nk-bg-2)", borderRadius: 6, marginBottom: 22 }} />
        <div style={{ height: 300, background: "var(--nk-bg-2)", borderRadius: 8 }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 22, maxWidth: 720 }}>

      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.018em", margin: 0 }}>Store Settings</h1>
        <div style={{ fontSize: 12.5, color: "var(--nk-muted)", marginTop: 3 }}>Update your store's public profile.</div>
      </div>

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))}>

        {/* Store profile section */}
        <div className="nk-card" style={{ padding: "0 18px", marginBottom: 16 }}>
          <div style={{ padding: "14px 0", borderBottom: "1px solid var(--nk-border)", fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--nk-muted)" }}>Store Profile</div>

          <FieldRow label="Store name" hint="Shown on your public storefront.">
            <input className="nk-input" {...register("name")} placeholder="My Awesome Store" />
            {errors.name && <p style={{ fontSize: 11.5, color: "var(--nk-danger)", marginTop: 4 }}>{errors.name.message}</p>}
          </FieldRow>

          <FieldRow label="Description" hint="Short bio displayed to customers.">
            <textarea
              className="nk-input"
              {...register("description")}
              rows={3}
              placeholder="Tell customers about your store…"
              style={{ resize: "vertical", minHeight: 72 }}
            />
          </FieldRow>

          <FieldRow label="Logo URL" hint="Direct link to a square logo image.">
            <input className="nk-input" {...register("logo")} placeholder="https://example.com/logo.png" />
            {errors.logo && <p style={{ fontSize: 11.5, color: "var(--nk-danger)", marginTop: 4 }}>{errors.logo.message}</p>}
          </FieldRow>

          <FieldRow label="Banner URL" hint="Wide image shown at the top of your storefront.">
            <input className="nk-input" {...register("banner")} placeholder="https://example.com/banner.jpg" />
            {errors.banner && <p style={{ fontSize: 11.5, color: "var(--nk-danger)", marginTop: 4 }}>{errors.banner.message}</p>}
          </FieldRow>
        </div>

        {/* Read-only store info */}
        {tenant && (
          <div className="nk-card" style={{ padding: "0 18px", marginBottom: 22 }}>
            <div style={{ padding: "14px 0", borderBottom: "1px solid var(--nk-border)", fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--nk-muted)" }}>Store Info</div>
            {[
              { label: "Slug",   value: tenant.slug,                                  mono: true },
              { label: "Status", value: tenant.status.toLowerCase(),                  mono: false },
              { label: "Owner",  value: tenant.owner.name,                            mono: false },
            ].map((row) => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: "1px solid var(--nk-border)", fontSize: 13 }}>
                <span style={{ color: "var(--nk-muted)" }}>{row.label}</span>
                <span className={row.mono ? "nk-mono" : undefined} style={{ fontWeight: 500, textTransform: row.label === "Status" ? "capitalize" : undefined }}>{row.value}</span>
              </div>
            ))}
            <div style={{ height: 6 }} />
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" className="nk-btn nk-btn-primary" style={{ gap: 6 }} disabled={isSubmitting || mutation.isPending}>
            {(isSubmitting || mutation.isPending) ? (
              <>Saving…</>
            ) : (
              <><Icon name="check" size={14} /> Save settings</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
