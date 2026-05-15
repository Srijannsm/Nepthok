"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Package, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { get, patch } from "@/lib/api";
import { formatNPR } from "@/lib/utils";
import { Product, PaginatedResponse } from "../../../types";
import { EmptyState } from "../../../components/shared/empty-state";
import { PageHeader } from "../../../components/shared/page-header";

interface StockEdit {
  productId: string;
  value: string;
}

export default function InventoryPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<StockEdit | null>(null);

  const { data, isLoading } = useQuery<PaginatedResponse<Product>>({
    queryKey: ["inventory", search, page],
    queryFn: () =>
      get<PaginatedResponse<Product>>(
        `/seller/products?page=${page}&limit=20&status=ACTIVE${search ? `&search=${encodeURIComponent(search)}` : ""}`,
      ),
  });

  const products = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const mutation = useMutation({
    mutationFn: ({ id, stock }: { id: string; stock: number }) =>
      patch(`/seller/products/${id}`, { stock }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Stock updated");
      setEditing(null);
    },
    onError: () => toast.error("Failed to update stock"),
  });

  const saveStock = (product: Product) => {
    if (!editing || editing.productId !== product.id) return;
    const newStock = parseInt(editing.value, 10);
    if (isNaN(newStock) || newStock < 0) {
      toast.error("Invalid stock value");
      return;
    }
    mutation.mutate({ id: product.id, stock: newStock });
  };

  return (
    <div className="p-6">
      <PageHeader title="Inventory" description="Monitor and adjust stock levels for active products." />

      <div className="relative max-w-xs mb-4">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products…"
          className="pl-8"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="text-center">Stock</TableHead>
              <TableHead className="text-center">Threshold</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="w-24">Adjust</TableHead>
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
                      title="No active products"
                      description="Active products with stock tracking will appear here."
                    />
                  </TableCell>
                </TableRow>
              )
              : products.map((product) => {
                  const isLow = product.stock <= product.lowStockThreshold;
                  const isEditing = editing?.productId === product.id;
                  return (
                    <TableRow key={product.id} className={isLow ? "bg-yellow-50" : undefined}>
                      <TableCell className="font-medium max-w-[180px] truncate">{product.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{product.sku ?? "—"}</TableCell>
                      <TableCell className="text-sm">{formatNPR(Number(product.price))}</TableCell>
                      <TableCell className="text-center">
                        <span className={isLow ? "text-orange-600 font-semibold" : "font-medium"}>
                          {product.stock}
                        </span>
                        {isLow && <span className="ml-1 text-xs text-orange-500">↓</span>}
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {product.lowStockThreshold}
                      </TableCell>
                      <TableCell className="text-center">
                        {isLow
                          ? <span className="text-xs font-medium text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">Low</span>
                          : <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">OK</span>
                        }
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              className="h-7 w-16 text-sm px-2"
                              value={editing.value}
                              onChange={(e) => setEditing({ productId: product.id, value: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveStock(product);
                                if (e.key === "Escape") setEditing(null);
                              }}
                              autoFocus
                            />
                            <Button
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => saveStock(product)}
                              disabled={mutation.isPending}
                            >
                              {mutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => setEditing({ productId: product.id, value: String(product.stock) })}
                          >
                            Edit
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
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
    </div>
  );
}
