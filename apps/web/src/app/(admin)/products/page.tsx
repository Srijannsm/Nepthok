"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { get } from "@/lib/api";
import { fmtRs, Icon, StatusBadge, Badge } from "@/components/nk/primitives";
import { Product, PaginatedResponse } from "@/types";
import { ProductForm } from "@/components/admin/product-form";

const STATUS_OPTS = [
  { label: "All",      value: "" },
  { label: "Active",   value: "ACTIVE" },
  { label: "Draft",    value: "DRAFT" },
  { label: "Archived", value: "ARCHIVED" },
];

export default function ProductsPage() {
  const [search, setSearch]     = useState("");
  const [status, setStatus]     = useState("");
  const [page, setPage]         = useState(1);
  const [sheetOpen, setSheet]   = useState(false);
  const [editProduct, setEdit]  = useState<Product | undefined>(undefined);

  const { data, isLoading } = useQuery<PaginatedResponse<Product>>({
    queryKey: ["products", search, status, page],
    queryFn: () =>
      get<PaginatedResponse<Product>>(
        `/seller/products?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}${status ? `&status=${status}` : ""}`,
      ),
  });

  const products = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  const openAdd  = () => { setEdit(undefined); setSheet(true); };
  const openEdit = (p: Product) => { setEdit(p); setSheet(true); };

  return (
    <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.018em", margin: 0 }}>Products</h1>
          <div style={{ fontSize: 12.5, color: "var(--nk-muted)", marginTop: 3 }}>
            {isLoading ? "Loading…" : `${total} products`}
          </div>
        </div>
        <button className="nk-btn nk-btn-primary" style={{ gap: 6 }} onClick={openAdd}>
          <Icon name="plus" size={14} />
          Add product
        </button>
      </div>

      {/* Toolbar */}
      <div className="nk-card" style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 220px", maxWidth: 320 }}>
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
        <div style={{ display: "flex", gap: 2 }}>
          {STATUS_OPTS.map((opt) => (
            <button
              key={opt.value}
              className="nk-btn"
              onClick={() => { setStatus(opt.value); setPage(1); }}
              style={{
                height: 30, fontSize: 12, padding: "0 10px",
                background: status === opt.value ? "var(--nk-fg)" : "transparent",
                color: status === opt.value ? "var(--nk-bg)" : "var(--nk-muted)",
                border: status === opt.value ? "1px solid var(--nk-fg)" : "1px solid transparent",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="nk-card" style={{ overflow: "hidden", padding: 0 }}>
        {isLoading ? (
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ height: 52, background: "var(--nk-bg-2)", borderRadius: 6 }} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--nk-bg-2)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <Icon name="pkg" size={18} color="var(--nk-muted)" />
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>No products yet</div>
            <div style={{ fontSize: 13, color: "var(--nk-muted)", marginBottom: 16 }}>Add your first product to start selling.</div>
            <button className="nk-btn nk-btn-primary nk-btn-sm" onClick={openAdd}>
              <Icon name="plus" size={13} /> Add product
            </button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="nk-table">
              <thead>
                <tr>
                  <th style={{ width: 52 }}>Img</th>
                  <th>Name</th>
                  <th style={{ width: 110 }}>SKU</th>
                  <th style={{ width: 80, textAlign: "center" }}>Stock</th>
                  <th style={{ width: 100 }}>Status</th>
                  <th className="nk-num" style={{ width: 110 }}>Price</th>
                  <th style={{ width: 70 }}></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const isLow = p.stock <= p.lowStockThreshold;
                  const isOut = p.stock === 0;
                  return (
                    <tr key={p.id} className="nk-clickable" onClick={() => openEdit(p)}>
                      <td>
                        {p.images?.[0] ? (
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 6, border: "1px solid var(--nk-border)" }}
                          />
                        ) : (
                          <div style={{ width: 36, height: 36, background: "var(--nk-bg-2)", borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--nk-border)" }}>
                            <Icon name="pkg" size={15} color="var(--nk-muted-2)" />
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 500, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                        {p.category && <div style={{ fontSize: 11, color: "var(--nk-muted)" }}>{typeof p.category === "string" ? p.category : (p.category as { name: string }).name}</div>}
                      </td>
                      <td className="nk-mono" style={{ fontSize: 11.5, color: "var(--nk-muted)" }}>{p.sku ?? "—"}</td>
                      <td style={{ textAlign: "center" }}>
                        <span
                          className="nk-tnum"
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: isOut ? "var(--nk-danger)" : isLow ? "var(--nk-warning)" : "var(--nk-fg)",
                          }}
                        >
                          {p.stock}
                        </span>
                        {isLow && !isOut && <div style={{ fontSize: 10, color: "var(--nk-warning)" }}>low</div>}
                        {isOut && <div style={{ fontSize: 10, color: "var(--nk-danger)" }}>out</div>}
                      </td>
                      <td><StatusBadge status={p.status} /></td>
                      <td className="nk-num nk-tnum" style={{ fontWeight: 500 }}>{fmtRs(Number(p.price))}</td>
                      <td>
                        <button
                          className="nk-btn nk-btn-ghost nk-btn-sm"
                          onClick={(e) => { e.stopPropagation(); openEdit(p); }}
                          style={{ fontSize: 12 }}
                        >
                          Edit
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

      {/* Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheet}>
        <SheetContent className="w-full sm:max-w-lg p-0 overflow-y-auto">
          <ProductForm product={editProduct} onClose={() => setSheet(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
