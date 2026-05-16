"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { get, patch, post } from "@/lib/api";
import { Icon } from "@/components/nk/primitives";
import { formatDate } from "@/lib/utils";
import { Tenant, PaginatedResponse } from "../../../../types";
import { SellerDetail } from "../../../../components/superadmin/seller-detail";

const G = "#16a34a";

const STATUS_TABS = [
  { label: "All",       value: "" },
  { label: "Pending",   value: "PENDING" },
  { label: "Active",    value: "ACTIVE" },
  { label: "Suspended", value: "SUSPENDED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "var(--nk-success)", PENDING: "#ca8a04", SUSPENDED: "var(--nk-danger)", CANCELLED: "var(--nk-muted)",
};

function generatePassword(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  return Array.from({ length: 14 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const inputCls = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export default function SellersPage() {
  const [search, setSearch]           = useState("");
  const [status, setStatus]           = useState("");
  const [page, setPage]               = useState(1);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [suspendTarget, setSuspendTarget]   = useState<Tenant | null>(null);
  const [suspendReason, setSuspendReason]   = useState("");
  const [addOpen, setAddOpen]         = useState(false);
  const [credDialogData, setCredDialogData] = useState<{ storeName: string; email: string; password: string } | null>(null);

  const [formName, setFormName]               = useState("");
  const [formSlug, setFormSlug]               = useState("");
  const [formOwnerName, setFormOwnerName]     = useState("");
  const [formEmail, setFormEmail]             = useState("");
  const [formPhone, setFormPhone]             = useState("");
  const [formPassword, setFormPassword]       = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formErrors, setFormErrors]           = useState<Record<string, string>>({});

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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["superadmin"] }); toast.success("Seller approved"); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to approve"),
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => patch(`/tenants/${id}/suspend`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["superadmin"] });
      toast.success("Seller suspended");
      setSuspendTarget(null); setSuspendReason("");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to suspend"),
  });

  const addSellerMutation = useMutation({
    mutationFn: (data: { name: string; slug: string; ownerName: string; email: string; phone: string; password: string; description?: string }) =>
      post("/tenants", data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["superadmin"] });
      setAddOpen(false);
      setCredDialogData({ storeName: vars.name, email: vars.email, password: vars.password });
      resetAddForm();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to create seller"),
  });

  function resetAddForm() {
    setFormName(""); setFormSlug(""); setFormOwnerName(""); setFormEmail("");
    setFormPhone(""); setFormPassword(""); setFormDescription(""); setFormErrors({});
  }

  function openAddSheet() { resetAddForm(); setFormPassword(generatePassword()); setAddOpen(true); }

  function validateAddForm(): boolean {
    const errors: Record<string, string> = {};
    if (formName.trim().length < 2) errors.name = "At least 2 characters.";
    if (!/^[a-z0-9-]{2,}$/.test(formSlug)) errors.slug = "Lowercase letters, numbers, hyphens only.";
    if (formOwnerName.trim().length < 2) errors.ownerName = "At least 2 characters.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail)) errors.email = "Valid email required.";
    if (!/^(\+977\d{9,10}|9\d{9})$/.test(formPhone.replace(/\s/g, ""))) errors.phone = "Valid Nepal phone required.";
    if (formPassword.length < 8) errors.password = "At least 8 characters.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateAddForm()) return;
    addSellerMutation.mutate({
      name: formName.trim(), slug: formSlug.trim(), ownerName: formOwnerName.trim(),
      email: formEmail.trim(), phone: formPhone.trim(), password: formPassword,
      description: formDescription.trim() || undefined,
    });
  }

  const tenants    = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalCount = data?.total ?? 0;

  return (
    <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.018em", margin: 0 }}>Sellers</h1>
          {!isLoading && <div style={{ fontSize: 12.5, color: "var(--nk-muted)", marginTop: 3 }}>{totalCount} total</div>}
        </div>
        <button className="nk-btn nk-btn-primary" style={{ background: G, borderColor: G }} onClick={openAddSheet}>
          Add Seller
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex" }}><Icon name="search" size={13} color="var(--nk-muted)" /></span>
          <input
            className={inputCls}
            style={{ paddingLeft: 30, width: 220 }}
            placeholder="Search sellers…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div style={{ display: "flex", gap: 3, padding: 3, background: "var(--nk-bg-2)", borderRadius: 7, border: "1px solid var(--nk-border)" }}>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setStatus(tab.value); setPage(1); }}
              className="nk-btn"
              style={{
                height: 26, fontSize: 12, padding: "0 12px",
                background: status === tab.value ? "var(--nk-surface)" : "transparent",
                color: status === tab.value ? "var(--nk-fg)" : "var(--nk-muted)",
                boxShadow: status === tab.value ? "var(--nk-shadow-sm)" : "none",
              }}
            >{tab.label}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="nk-card" style={{ padding: 0 }}>
        <table className="nk-table">
          <thead>
            <tr>
              <th>Store</th>
              <th>Slug</th>
              <th>Owner</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Joined</th>
              <th style={{ width: 150 }}></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j}><div style={{ height: 18, background: "var(--nk-bg-2)", borderRadius: 4 }} /></td>
                  ))}
                </tr>
              ))
            ) : tenants.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "40px 16px", color: "var(--nk-muted)", fontSize: 13 }}>
                  No sellers found.
                </td>
              </tr>
            ) : (
              tenants.map((tenant) => {
                const statusColor = STATUS_COLOR[tenant.status] ?? "var(--nk-muted)";
                return (
                  <tr key={tenant.id} style={{ cursor: "pointer" }} onClick={() => setSelectedTenant(tenant)}>
                    <td style={{ fontSize: 12.5, fontWeight: 600 }}>{tenant.name}</td>
                    <td style={{ fontSize: 11.5, fontFamily: "monospace", color: "var(--nk-muted)" }}>{tenant.slug}</td>
                    <td style={{ fontSize: 12, color: "var(--nk-muted)" }}>{tenant.owner?.email ?? "—"}</td>
                    <td>
                      {tenant.subscription?.plan?.tier ? (
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 999,
                          background: tenant.subscription.plan.tier === "PRO" ? "rgba(22,163,74,0.1)" : "var(--nk-bg-2)",
                          color: tenant.subscription.plan.tier === "PRO" ? G : "var(--nk-muted)",
                        }}>{tenant.subscription.plan.tier}</span>
                      ) : <span style={{ fontSize: 11.5, color: "var(--nk-muted)" }}>None</span>}
                    </td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 999,
                        background: `${statusColor}18`, color: statusColor,
                      }}>{tenant.status}</span>
                    </td>
                    <td style={{ fontSize: 11.5, color: "var(--nk-muted)" }}>{formatDate(tenant.createdAt)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="nk-btn"
                          style={{ fontSize: 11.5, padding: "3px 10px", border: "1px solid var(--nk-border)" }}
                          onClick={() => setSelectedTenant(tenant)}
                        >View</button>
                        {tenant.status === "PENDING" && (
                          <button
                            className="nk-btn nk-btn-primary"
                            style={{ fontSize: 11.5, padding: "3px 10px", background: G, borderColor: G }}
                            disabled={approveMutation.isPending}
                            onClick={() => approveMutation.mutate(tenant.id)}
                          >Approve</button>
                        )}
                        {tenant.status === "ACTIVE" && (
                          <button
                            className="nk-btn"
                            style={{ fontSize: 11.5, padding: "3px 10px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "var(--nk-danger)" }}
                            onClick={() => setSuspendTarget(tenant)}
                          >Suspend</button>
                        )}
                      </div>
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

      {/* Add Seller sheet */}
      <Sheet open={addOpen} onOpenChange={(open) => { if (!open) { setAddOpen(false); resetAddForm(); } }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-4"><SheetTitle>Add Seller</SheetTitle></SheetHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            {[
              { label: "Store Name", value: formName, onChange: (v: string) => { setFormName(v); setFormSlug(toSlug(v)); }, placeholder: "e.g. Kathmandu Crafts", error: formErrors.name },
              { label: "Store Slug", value: formSlug, onChange: (v: string) => setFormSlug(v.toLowerCase().replace(/[^a-z0-9-]/g, "")), placeholder: "e.g. kathmandu-crafts", error: formErrors.slug },
              { label: "Owner Full Name", value: formOwnerName, onChange: setFormOwnerName, placeholder: "e.g. Ram Prasad", error: formErrors.ownerName },
              { label: "Owner Email", value: formEmail, onChange: setFormEmail, placeholder: "e.g. ram@example.com", type: "email", error: formErrors.email },
              { label: "Owner Phone", value: formPhone, onChange: setFormPhone, placeholder: "+977XXXXXXXXXX or 9XXXXXXXXX", error: formErrors.phone },
            ].map(({ label, value, onChange, placeholder, type, error }) => (
              <div key={label} className="space-y-1">
                <label className="text-sm font-medium">{label}</label>
                <input className={inputCls} type={type ?? "text"} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>
            ))}

            <div className="space-y-1">
              <label className="text-sm font-medium">Password</label>
              <div className="flex gap-2">
                <input className={`${inputCls} flex-1 font-mono`} readOnly value={formPassword} />
                <button type="button" className="nk-btn" style={{ border: "1px solid var(--nk-border)", padding: "0 10px", fontSize: 12, flexShrink: 0 }} onClick={() => setFormPassword(generatePassword())}>Regenerate</button>
              </div>
              {formErrors.password && <p className="text-xs text-destructive">{formErrors.password}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Description <span className="text-muted-foreground font-normal">(optional)</span></label>
              <textarea className={`${inputCls} h-20 resize-none py-2`} placeholder="Brief description…" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" className="nk-btn nk-btn-primary" style={{ flex: 1, background: G, borderColor: G }} disabled={addSellerMutation.isPending}>
                {addSellerMutation.isPending ? "Creating…" : "Create Seller"}
              </button>
              <button type="button" className="nk-btn" style={{ border: "1px solid var(--nk-border)", padding: "0 14px" }} onClick={() => { setAddOpen(false); resetAddForm(); }}>Cancel</button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

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

      {/* Suspend dialog */}
      <Dialog open={!!suspendTarget} onOpenChange={(open) => { if (!open) { setSuspendTarget(null); setSuspendReason(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Suspend {suspendTarget?.name}?</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">The seller will lose access to the admin panel.</p>
            <Input placeholder="Reason for suspension (optional)" value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} />
          </div>
          <DialogFooter>
            <button className="nk-btn" style={{ border: "1px solid var(--nk-border)", padding: "6px 14px", fontSize: 13 }} onClick={() => { setSuspendTarget(null); setSuspendReason(""); }}>Cancel</button>
            <button
              className="nk-btn"
              style={{ background: "var(--nk-danger)", borderColor: "var(--nk-danger)", color: "#fff", padding: "6px 14px", fontSize: 13 }}
              disabled={suspendMutation.isPending}
              onClick={() => suspendTarget && suspendMutation.mutate({ id: suspendTarget.id, reason: suspendReason })}
            >
              {suspendMutation.isPending ? "Suspending…" : "Suspend"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credentials dialog */}
      <Dialog open={!!credDialogData} onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader><DialogTitle>Seller account created</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2 text-sm">
            <p className="text-muted-foreground">Share these credentials securely with the seller.</p>
            <div className="rounded-md border p-3 space-y-2 bg-muted/30 text-sm">
              <div><span className="text-muted-foreground">Store:</span> <strong>{credDialogData?.storeName}</strong></div>
              <div><span className="text-muted-foreground">Email:</span> <strong>{credDialogData?.email}</strong></div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span className="text-muted-foreground">Password:</span>
                <code className="font-mono font-medium">{credDialogData?.password}</code>
                <button className="nk-btn" style={{ fontSize: 11.5, padding: "2px 8px", border: "1px solid var(--nk-border)" }}
                  onClick={() => { navigator.clipboard.writeText(credDialogData?.password ?? ""); toast.success("Copied"); }}>Copy</button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <button className="nk-btn nk-btn-primary" style={{ background: G, borderColor: G, padding: "6px 16px", fontSize: 13 }} onClick={() => setCredDialogData(null)}>
              I have copied the credentials
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
