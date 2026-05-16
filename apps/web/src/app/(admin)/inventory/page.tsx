"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { get, patch } from "@/lib/api";
import { fmtRs, Icon, Badge } from "@/components/nk/primitives";
import { Product, PaginatedResponse } from "@/types";

interface StockEdit { productId: string; value: string; }

export default function InventoryPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage]     = useState(1);
  const [editing, setEdit]  = useState<StockEdit | null>(null);

  const { data, isLoading } = useQuery<PaginatedResponse<Product>>({
    queryKey: ["inventory", search, page],
    queryFn: () =>
      get<PaginatedResponse<Product>>(
        `/seller/products?page=${page}&limit=20&status=ACTIVE${search ? `&search=${encodeURIComponent(search)}` : ""}`,
      ),
  });

  const products   = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const mutation = useMutation({
    mutationFn: ({ id, stock }: { id: string; stock: number }) => patch(`/seller/products/${id}`, { stock }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Stock updated");
      setEdit(null);
    },
    onError: () => toast.error("Failed to update stock"),
  });

  const save = (product: Product) => {
    if (!editing || editing.productId !== product.id) return;
    const n = parseInt(editing.value, 10);
    if (isNaN(n) || n < 0) { toast.error("Invalid value"); return; }
    mutation.mutate({ id: product.id, stock: n });
  };

  return (
    <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.018em", margin: 0 }}>Inventory</h1>
        <div style={{ fontSize: 12.5, color: "var(--nk-muted)", marginTop: 3 }}>Monitor and adjust stock levels for active products.</div>
      </div>

      {/* Search */}
      <div className="nk-card" style={{ padding: "10px 14px" }}>
        <div style={{ position: "relative", maxWidth: 320 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--nk-muted)", pointerEvents: "none" }}>
            <Icon name="search" size={14} />
          </span>
          <input
            className="nk-input"
            style={{ paddingLeft: 32, height: 34, fontSize: 13 }}
            placeholder="Search products…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="nk-card" style={{ overflow: "hidden", padding: 0 }}>
        {isLoading ? (
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ height: 44, background: "var(--nk-bg-2)", borderRadius: 6 }} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--nk-bg-2)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <Icon name="warehouse" size={18} color="var(--nk-muted)" />
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>No active products</div>
            <div style={{ fontSize: 13, color: "var(--nk-muted)" }}>Active products with stock tracking will appear here.</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="nk-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th style={{ width: 110 }}>SKU</th>
                  <th className="nk-num" style={{ width: 110 }}>Price</th>
                  <th style={{ width: 80, textAlign: "center" }}>Stock</th>
                  <th style={{ width: 90, textAlign: "center" }}>Threshold</th>
                  <th style={{ width: 80 }}>Level</th>
                  <th style={{ width: 130 }}>Adjust</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const isLow  = p.stock <= p.lowStockThreshold;
                  const isOut  = p.stock === 0;
                  const isEditingThis = editing?.productId === p.id;
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 500, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                      </td>
                      <td className="nk-mono" style={{ fontSize: 11.5, color: "var(--nk-muted)" }}>{p.sku ?? "—"}</td>
                      <td className="nk-num nk-tnum">{fmtRs(Number(p.price))}</td>
                      <td style={{ textAlign: "center" }}>
                        <span className="nk-tnum" style={{ fontSize: 13, fontWeight: 600, color: isOut ? "var(--nk-danger)" : isLow ? "var(--nk-warning)" : "var(--nk-fg)" }}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="nk-tnum" style={{ textAlign: "center", fontSize: 12.5, color: "var(--nk-muted)" }}>{p.lowStockThreshold}</td>
                      <td>
                        {isOut
                          ? <Badge tone="danger">Out</Badge>
                          : isLow
                          ? <Badge tone="warn">Low</Badge>
                          : <Badge tone="success">OK</Badge>
                        }
                      </td>
                      <td>
                        {isEditingThis ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <input
                              type="number"
                              className="nk-input nk-tnum"
                              style={{ width: 64, height: 28, fontSize: 13, padding: "0 8px" }}
                              value={editing.value}
                              onChange={(e) => setEdit({ productId: p.id, value: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") save(p);
                                if (e.key === "Escape") setEdit(null);
                              }}
                              autoFocus
                              min={0}
                            />
                            <button
                              className="nk-btn nk-btn-primary nk-btn-sm"
                              style={{ height: 28, fontSize: 11.5, padding: "0 8px" }}
                              onClick={() => save(p)}
                              disabled={mutation.isPending}
                            >
                              {mutation.isPending ? "…" : "Save"}
                            </button>
                            <button
                              className="nk-btn nk-btn-ghost nk-btn-sm"
                              style={{ height: 28, fontSize: 11.5, padding: "0 6px" }}
                              onClick={() => setEdit(null)}
                            >
                              <Icon name="x" size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            className="nk-btn nk-btn-secondary nk-btn-sm"
                            style={{ height: 28, fontSize: 12 }}
                            onClick={() => setEdit({ productId: p.id, value: String(p.stock) })}
                          >
                            Adjust
                          </button>
                        )}
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
    </div>
  );
}
