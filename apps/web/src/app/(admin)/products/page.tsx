"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { get } from "@/lib/api";
import { formatNPR } from "@/lib/utils";
import { Product, PaginatedResponse } from "../../../types";
import { StatusBadge } from "../../../components/shared/status-badge";
import { EmptyState } from "../../../components/shared/empty-state";
import { PageHeader } from "../../../components/shared/page-header";
import { ProductForm } from "../../../components/admin/product-form";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | undefined>(undefined);

  const { data, isLoading } = useQuery<PaginatedResponse<Product>>({
    queryKey: ["products", search, status, page],
    queryFn: () => get<PaginatedResponse<Product>>(`/seller/products?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}${status ? `&status=${status}` : ""}`),
  });

  const products = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const openAdd = () => { setEditProduct(undefined); setSheetOpen(true); };
  const openEdit = (p: Product) => { setEditProduct(p); setSheetOpen(true); };

  return (
    <div className="p-6">
      <PageHeader
        title="Products"
        action={
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1" /> Add Product
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products…"
            className="pl-8"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="">All status</option>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">IMG</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20">Actions</TableHead>
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
              : products.length === 0
              ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
                    <EmptyState
                      icon={Package}
                      title="No products yet"
                      description="Add your first product to start selling."
                      action={{ label: "Add Product", onClick: openAdd }}
                    />
                  </TableCell>
                </TableRow>
              )
              : products.map((p) => {
                  const isLow = p.stock <= p.lowStockThreshold;
                  return (
                    <TableRow key={p.id} className={isLow ? "bg-yellow-50" : undefined}>
                      <TableCell>
                        {p.images?.[0]
                          ? <img src={p.images[0]} alt={p.name} className="h-8 w-8 object-cover rounded" />
                          : <div className="h-8 w-8 bg-muted rounded flex items-center justify-center"><Package className="h-4 w-4 text-muted-foreground" /></div>
                        }
                      </TableCell>
                      <TableCell className="font-medium max-w-[160px] truncate">{p.name}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">{p.sku ?? "—"}</TableCell>
                      <TableCell>{formatNPR(Number(p.price))}</TableCell>
                      <TableCell>
                        <span className={isLow ? "text-orange-600 font-medium" : ""}>{p.stock}</span>
                        {isLow && <span className="ml-1 text-xs text-orange-500">↓ low</span>}
                      </TableCell>
                      <TableCell><StatusBadge status={p.status} /></TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>Edit</Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg p-0 overflow-y-auto">
          <ProductForm product={editProduct} onClose={() => setSheetOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
