"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { get, post, patch, del } from "@/lib/api";
import { Category } from "../../../../types";
import { EmptyState } from "../../../../components/shared/empty-state";
import { PageHeader } from "../../../../components/shared/page-header";

function slugify(str: string) {
  return str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

type CategoryWithParent = Category & { parent?: { id: string; name: string } | null; isActive?: boolean };

interface CatForm {
  name: string;
  slug: string;
  description: string;
  image: string;
  parentId: string;
  isActive: boolean;
}

const emptyForm: CatForm = { name: "", slug: "", description: "", image: "", parentId: "", isActive: true };

export default function CategoriesPage() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<CategoryWithParent | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<CategoryWithParent | null>(null);
  const [form, setForm] = useState<CatForm>(emptyForm);
  const qc = useQueryClient();

  const { data: categories, isLoading } = useQuery<CategoryWithParent[]>({
    queryKey: ["superadmin", "categories"],
    queryFn: () => get<CategoryWithParent[]>("/categories"),
  });

  const createMutation = useMutation({
    mutationFn: (body: Partial<CatForm>) => post("/categories", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["superadmin", "categories"] });
      toast.success("Category created");
      closeSheet();
    },
    onError: () => toast.error("Failed to create category"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<CatForm> }) => patch(`/categories/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["superadmin", "categories"] });
      toast.success("Category updated");
      closeSheet();
    },
    onError: () => toast.error("Failed to update category"),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => del(`/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["superadmin", "categories"] });
      toast.success("Category deactivated");
      setDeactivateTarget(null);
    },
    onError: () => toast.error("Failed to deactivate category"),
  });

  function openCreate() {
    setEditingCat(null);
    setForm(emptyForm);
    setSheetOpen(true);
  }

  function openEdit(cat: CategoryWithParent) {
    setEditingCat(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: "",
      image: "",
      parentId: "",
      isActive: true,
    });
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setEditingCat(null);
    setForm(emptyForm);
  }

  function handleSave() {
    const body: Partial<CatForm> = {
      name: form.name,
      slug: form.slug,
      description: form.description || undefined,
      image: form.image || undefined,
      parentId: form.parentId || undefined,
    };
    if (editingCat) {
      updateMutation.mutate({ id: editingCat.id, body });
    } else {
      createMutation.mutate(body);
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  const allCats: CategoryWithParent[] = [];
  function flatten(cats: CategoryWithParent[], depth = 0) {
    for (const cat of cats) {
      allCats.push({ ...cat, _depth: depth } as CategoryWithParent & { _depth: number });
      if (cat.children?.length) flatten(cat.children as CategoryWithParent[], depth + 1);
    }
  }
  if (categories) flatten(categories);

  return (
    <div className="p-6">
      <PageHeader
        title="Categories"
        action={<Button onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />Add Category</Button>}
      />

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead>Subcategories</TableHead>
              <TableHead className="w-36">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : allCats.length === 0
              ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <EmptyState
                      icon={Tag}
                      title="No categories yet"
                      description="Add categories to organise products."
                    />
                  </TableCell>
                </TableRow>
              )
              : allCats.map((cat) => {
                  const depth = (cat as CategoryWithParent & { _depth?: number })._depth ?? 0;
                  return (
                    <TableRow key={cat.id}>
                      <TableCell>
                        <span
                          className="text-sm font-medium"
                          style={{ paddingLeft: depth * 16 }}
                        >
                          {depth > 0 && <span className="text-muted-foreground mr-1">└</span>}
                          {cat.name}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{cat.slug}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {cat.parent?.name ?? <span className="text-muted-foreground/50">Root</span>}
                      </TableCell>
                      <TableCell>
                        {(cat.children?.length ?? 0) > 0 && (
                          <Badge variant="secondary">{cat.children!.length}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(cat)}>Edit</Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeactivateTarget(cat)}
                          >
                            Deactivate
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </div>

      {/* Add / Edit sheet */}
      <Sheet open={sheetOpen} onOpenChange={(open) => { if (!open) closeSheet(); }}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editingCat ? "Edit Category" : "Add Category"}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({ ...f, name, slug: editingCat ? f.slug : slugify(name) }));
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Image URL (optional)</Label>
              <Input
                value={form.image}
                onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Parent Category (optional)</Label>
              <select
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.parentId}
                onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
              >
                <option value="">None (root category)</option>
                {(categories ?? [])
                  .filter((c) => !editingCat || c.id !== editingCat.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
            </div>
            <Button className="w-full" onClick={handleSave} disabled={!form.name || !form.slug || isPending}>
              {editingCat ? "Save Changes" : "Create Category"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Deactivate confirmation */}
      <Dialog open={!!deactivateTarget} onOpenChange={(open) => { if (!open) setDeactivateTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate "{deactivateTarget?.name}"?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            This category will no longer appear for sellers. Categories with active subcategories cannot be deactivated.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deactivateMutation.isPending}
              onClick={() => deactivateTarget && deactivateMutation.mutate(deactivateTarget.id)}
            >
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
