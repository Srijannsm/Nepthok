"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Store } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { get, patch, post } from "@/lib/api";
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

function generatePassword(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  return Array.from({ length: 14 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function SellersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<Tenant | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [credDialogData, setCredDialogData] = useState<{ storeName: string; email: string; password: string } | null>(null);

  // Add Seller form state
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formOwnerName, setFormOwnerName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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
      toast.success("Seller approved successfully");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to approve seller"),
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      patch(`/tenants/${id}/suspend`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["superadmin", "sellers"] });
      toast.success("Seller suspended successfully");
      setSuspendTarget(null);
      setSuspendReason("");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to suspend seller"),
  });

  const addSellerMutation = useMutation({
    mutationFn: (data: {
      name: string; slug: string; ownerName: string; email: string;
      phone: string; password: string; description?: string;
    }) => post(`/tenants`, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["superadmin", "sellers"] });
      setAddOpen(false);
      setCredDialogData({ storeName: vars.name, email: vars.email, password: vars.password });
      resetAddForm();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to create seller"),
  });

  function resetAddForm() {
    setFormName("");
    setFormSlug("");
    setFormOwnerName("");
    setFormEmail("");
    setFormPhone("");
    setFormPassword("");
    setFormDescription("");
    setFormErrors({});
  }

  function openAddSheet() {
    resetAddForm();
    setFormPassword(generatePassword());
    setAddOpen(true);
  }

  function validateAddForm(): boolean {
    const errors: Record<string, string> = {};
    if (formName.trim().length < 2) errors.name = "Store name must be at least 2 characters.";
    if (!/^[a-z0-9-]{2,}$/.test(formSlug)) errors.slug = "Slug must be at least 2 chars, lowercase letters, numbers, and hyphens only.";
    if (formOwnerName.trim().length < 2) errors.ownerName = "Owner name must be at least 2 characters.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail)) errors.email = "Enter a valid email address.";
    if (!/^(\+977\d{9,10}|9\d{9})$/.test(formPhone.replace(/\s/g, ""))) errors.phone = "Enter a valid Nepal phone number (e.g. +977XXXXXXXXXX or 9XXXXXXXXX).";
    if (formPassword.length < 8) errors.password = "Password must be at least 8 characters.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateAddForm()) return;
    addSellerMutation.mutate({
      name: formName.trim(),
      slug: formSlug.trim(),
      ownerName: formOwnerName.trim(),
      email: formEmail.trim(),
      phone: formPhone.trim(),
      password: formPassword,
      description: formDescription.trim() || undefined,
    });
  }

  const tenants = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const inputCls = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

  return (
    <div className="p-6">
      <PageHeader
        title="Sellers"
        action={
          <Button onClick={openAddSheet}>Add Seller</Button>
        }
      />

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

      {/* Add Seller sheet */}
      <Sheet open={addOpen} onOpenChange={(open) => { if (!open) { setAddOpen(false); resetAddForm(); } }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Add Seller</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Store Name</label>
              <input
                className={inputCls}
                placeholder="e.g. Kathmandu Crafts"
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  setFormSlug(toSlug(e.target.value));
                }}
              />
              {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Store Slug</label>
              <input
                className={inputCls}
                placeholder="e.g. kathmandu-crafts"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              />
              {formErrors.slug && <p className="text-xs text-destructive">{formErrors.slug}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Owner Full Name</label>
              <input
                className={inputCls}
                placeholder="e.g. Ram Prasad"
                value={formOwnerName}
                onChange={(e) => setFormOwnerName(e.target.value)}
              />
              {formErrors.ownerName && <p className="text-xs text-destructive">{formErrors.ownerName}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Owner Email</label>
              <input
                type="email"
                className={inputCls}
                placeholder="e.g. ram@example.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
              {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Owner Phone</label>
              <input
                className={inputCls}
                placeholder="e.g. +977XXXXXXXXXX or 9XXXXXXXXX"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
              />
              {formErrors.phone && <p className="text-xs text-destructive">{formErrors.phone}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Password</label>
              <div className="flex gap-2">
                <input
                  className={`${inputCls} flex-1 font-mono`}
                  readOnly
                  value={formPassword}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormPassword(generatePassword())}
                >
                  Regenerate
                </Button>
              </div>
              {formErrors.password && <p className="text-xs text-destructive">{formErrors.password}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Description <span className="text-muted-foreground font-normal">(optional)</span></label>
              <textarea
                className={`${inputCls} h-20 resize-none py-2`}
                placeholder="Brief description of the store…"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={addSellerMutation.isPending} className="flex-1">
                {addSellerMutation.isPending ? "Creating…" : "Create Seller"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setAddOpen(false); resetAddForm(); }}
              >
                Cancel
              </Button>
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

      {/* Credentials dialog — cannot be dismissed until confirmed */}
      <Dialog open={!!credDialogData} onOpenChange={() => {}}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Seller account created</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm">
            <p className="text-muted-foreground">Share these credentials securely with the seller. This dialog cannot be dismissed until you confirm you have copied them.</p>
            <div className="rounded-md border p-3 space-y-2 bg-muted/30">
              <div><span className="text-muted-foreground">Store:</span> <span className="font-medium">{credDialogData?.storeName}</span></div>
              <div><span className="text-muted-foreground">Login Email:</span> <span className="font-medium">{credDialogData?.email}</span></div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-muted-foreground">Password:</span>
                <span className="font-mono font-medium">{credDialogData?.password}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { navigator.clipboard.writeText(credDialogData?.password ?? ""); toast.success("Copied"); }}
                >
                  Copy
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setCredDialogData(null)}>I have copied the credentials</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
