"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { get, post, patch, del } from "@/lib/api";
import { Category } from "../../../../types";

const G = "#16a34a";

function slugify(str: string) {
  return str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

type CategoryWithParent = Category & { parent?: { id: string; name: string } | null; isActive?: boolean; _depth?: number };

interface CatForm { name: string; slug: string; description: string; image: string; parentId: string; isActive: boolean }

const emptyForm: CatForm = { name: "", slug: "", description: "", image: "", parentId: "", isActive: true };

export default function CategoriesPage() {
  const [sheetOpen, setSheetOpen]         = useState(false);
  const [editingCat, setEditingCat]       = useState<CategoryWithParent | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<CategoryWithParent | null>(null);
  const [form, setForm]                   = useState<CatForm>(emptyForm);
  const qc = useQueryClient();

  const { data: categories, isLoading } = useQuery<CategoryWithParent[]>({
    queryKey: ["superadmin", "categories"],
    queryFn: () => get<CategoryWithParent[]>("/categories"),
  });

  const createMutation = useMutation({
    mutationFn: (body: Partial<CatForm>) => post("/categories", body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["superadmin", "categories"] }); toast.success("Category created"); closeSheet(); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<CatForm> }) => patch(`/categories/${id}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["superadmin", "categories"] }); toast.success("Category updated"); closeSheet(); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed"),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => del(`/categories/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["superadmin", "categories"] }); toast.success("Category deactivated"); setDeactivateTarget(null); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed"),
  });

  function openCreate() { setEditingCat(null); setForm(emptyForm); setSheetOpen(true); }
  function openEdit(cat: CategoryWithParent) {
    setEditingCat(cat);
    setForm({ name: cat.name, slug: cat.slug, description: "", image: "", parentId: "", isActive: true });
    setSheetOpen(true);
  }
  function closeSheet() { setSheetOpen(false); setEditingCat(null); setForm(emptyForm); }
  function handleSave() {
    const body: Partial<CatForm> = { name: form.name, slug: form.slug, description: form.description || undefined, image: form.image || undefined, parentId: form.parentId || undefined };
    editingCat ? updateMutation.mutate({ id: editingCat.id, body }) : createMutation.mutate(body);
  }

  const allCats: CategoryWithParent[] = [];
  function flatten(cats: CategoryWithParent[], depth = 0) {
    for (const cat of cats) {
      allCats.push({ ...cat, _depth: depth });
      if (cat.children?.length) flatten(cat.children as CategoryWithParent[], depth + 1);
    }
  }
  if (categories) flatten(categories);

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.018em", margin: 0 }}>Categories</h1>
          <div style={{ fontSize: 12.5, color: "var(--nk-muted)", marginTop: 3 }}>Global product categories for all sellers</div>
        </div>
        <button className="nk-btn nk-btn-primary" style={{ background: G, borderColor: G, display: "flex", alignItems: "center", gap: 6 }} onClick={openCreate}>
          <Plus size={14} /> Add Category
        </button>
      </div>

      {/* Table */}
      <div className="nk-card" style={{ padding: 0 }}>
        <table className="nk-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Parent</th>
              <th>Sub-categories</th>
              <th style={{ width: 130 }}></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 5 }).map((__, j) => <td key={j}><div style={{ height: 18, background: "var(--nk-bg-2)", borderRadius: 4 }} /></td>)}</tr>
              ))
            ) : allCats.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "36px 16px", fontSize: 13, color: "var(--nk-muted)" }}>
                  No categories yet. Add one to organise products.
                </td>
              </tr>
            ) : (
              allCats.map((cat) => (
                <tr key={cat.id}>
                  <td>
                    <span style={{ paddingLeft: (cat._depth ?? 0) * 16, fontSize: 12.5, fontWeight: (cat._depth ?? 0) === 0 ? 600 : 400 }}>
                      {(cat._depth ?? 0) > 0 && <span style={{ color: "var(--nk-muted)", marginRight: 4 }}>└</span>}
                      {cat.name}
                    </span>
                  </td>
                  <td style={{ fontSize: 11.5, fontFamily: "monospace", color: "var(--nk-muted)" }}>{cat.slug}</td>
                  <td style={{ fontSize: 12.5, color: "var(--nk-muted)" }}>
                    {cat.parent?.name ?? <span style={{ color: "var(--nk-border)", fontStyle: "italic" }}>Root</span>}
                  </td>
                  <td>
                    {(cat.children?.length ?? 0) > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 999, background: "var(--nk-bg-2)", color: "var(--nk-muted)" }}>
                        {cat.children!.length}
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="nk-btn" style={{ fontSize: 11.5, padding: "3px 10px", border: "1px solid var(--nk-border)" }} onClick={() => openEdit(cat)}>Edit</button>
                      <button
                        className="nk-btn"
                        style={{ fontSize: 11.5, padding: "3px 10px", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--nk-danger)" }}
                        onClick={() => setDeactivateTarget(cat)}
                      >Deactivate</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit sheet */}
      <Sheet open={sheetOpen} onOpenChange={(open) => { if (!open) closeSheet(); }}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader><SheetTitle>{editingCat ? "Edit Category" : "Add Category"}</SheetTitle></SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => { const n = e.target.value; setForm(f => ({ ...f, name: n, slug: editingCat ? f.slug : slugify(n) })); }} />
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm(f => ({ ...f, slug: slugify(e.target.value) }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Image URL (optional)</Label>
              <Input value={form.image} onChange={(e) => setForm(f => ({ ...f, image: e.target.value }))} placeholder="https://…" />
            </div>
            <div className="space-y-1.5">
              <Label>Parent Category (optional)</Label>
              <select
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.parentId}
                onChange={(e) => setForm(f => ({ ...f, parentId: e.target.value }))}
              >
                <option value="">None (root category)</option>
                {(categories ?? []).filter(c => !editingCat || c.id !== editingCat.id).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <button
              className="nk-btn nk-btn-primary"
              style={{ width: "100%", justifyContent: "center", background: G, borderColor: G }}
              onClick={handleSave}
              disabled={!form.name || !form.slug || isPending}
            >
              {editingCat ? "Save Changes" : "Create Category"}
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Deactivate dialog */}
      <Dialog open={!!deactivateTarget} onOpenChange={(open) => { if (!open) setDeactivateTarget(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Deactivate "{deactivateTarget?.name}"?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">This category will no longer appear for sellers.</p>
          <DialogFooter>
            <button className="nk-btn" style={{ border: "1px solid var(--nk-border)", padding: "6px 14px", fontSize: 13 }} onClick={() => setDeactivateTarget(null)}>Cancel</button>
            <button
              className="nk-btn"
              style={{ background: "var(--nk-danger)", borderColor: "var(--nk-danger)", color: "#fff", padding: "6px 14px", fontSize: 13 }}
              disabled={deactivateMutation.isPending}
              onClick={() => deactivateTarget && deactivateMutation.mutate(deactivateTarget.id)}
            >
              {deactivateMutation.isPending ? "Deactivating…" : "Deactivate"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
