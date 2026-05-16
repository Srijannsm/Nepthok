"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { get } from "@/lib/api";
import { fmtRs, Icon, Avatar, StatusBadge } from "@/components/nk/primitives";
import { Order, PaginatedResponse } from "@/types";
import { OrderDetail } from "@/components/admin/order-detail";

const STATUS_TABS = [
  { label: "All",       value: "" },
  { label: "Pending",   value: "PENDING" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Processing",value: "PROCESSING" },
  { label: "Shipped",   value: "SHIPPED" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export default function OrdersPage() {
  const [search, setSearch]         = useState("");
  const [status, setStatus]         = useState("");
  const [page, setPage]             = useState(1);
  const [selected, setSelected]     = useState<Order | null>(null);
  const [selected2, setSelected2]   = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery<PaginatedResponse<Order>>({
    queryKey: ["orders", search, status, page],
    queryFn: () =>
      get<PaginatedResponse<Order>>(
        `/seller/orders?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}${status ? `&status=${status}` : ""}`,
      ),
  });

  const orders = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  const toggleRow = (id: string) =>
    setSelected2((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const allChecked = orders.length > 0 && orders.every((o) => selected2.has(o.id));
  const toggleAll = () =>
    setSelected2(allChecked ? new Set() : new Set(orders.map((o) => o.id)));

  return (
    <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.018em", margin: 0 }}>Orders</h1>
          <div style={{ fontSize: 12.5, color: "var(--nk-muted)", marginTop: 3 }}>
            {isLoading ? "Loading…" : `${total} total orders`}
          </div>
        </div>
        <button className="nk-btn nk-btn-secondary" style={{ gap: 6 }}>
          <Icon name="download" size={14} />
          Export CSV
        </button>
      </div>

      {/* Toolbar card */}
      <div className="nk-card" style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 220px", maxWidth: 320 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--nk-muted)", pointerEvents: "none" }}>
            <Icon name="search" size={14} />
          </span>
          <input
            className="nk-input"
            style={{ paddingLeft: 32, height: 34, fontSize: 13 }}
            placeholder="Search orders, customers…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {/* Status tabs */}
        <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              className="nk-btn"
              onClick={() => { setStatus(tab.value); setPage(1); }}
              style={{
                height: 30, fontSize: 12, padding: "0 10px",
                background: status === tab.value ? "var(--nk-fg)" : "transparent",
                color: status === tab.value ? "var(--nk-bg)" : "var(--nk-muted)",
                border: status === tab.value ? "1px solid var(--nk-fg)" : "1px solid transparent",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk action bar */}
      {selected2.size > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", background: "var(--nk-accent-soft)", borderRadius: "var(--nk-r-md)", border: "1px solid var(--nk-accent)", fontSize: 13 }}>
          <span style={{ fontWeight: 500, color: "var(--nk-accent)" }}>{selected2.size} selected</span>
          <div style={{ flex: 1 }} />
          <button className="nk-btn nk-btn-secondary nk-btn-sm">Mark shipped</button>
          <button className="nk-btn nk-btn-secondary nk-btn-sm">Print labels</button>
          <button className="nk-btn nk-btn-ghost nk-btn-sm" onClick={() => setSelected2(new Set())}>Clear</button>
        </div>
      )}

      {/* Table */}
      <div className="nk-card" style={{ overflow: "hidden", padding: 0 }}>
        {isLoading ? (
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ height: 44, background: "var(--nk-bg-2)", borderRadius: 6 }} />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--nk-bg-2)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <Icon name="cart" size={18} color="var(--nk-muted)" />
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>No orders yet</div>
            <div style={{ fontSize: 13, color: "var(--nk-muted)" }}>Orders placed by customers will appear here.</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="nk-table">
              <thead>
                <tr>
                  <th style={{ width: 36, padding: "0 8px 0 16px" }}>
                    <input type="checkbox" checked={allChecked} onChange={toggleAll} style={{ cursor: "pointer" }} />
                  </th>
                  <th style={{ width: 110 }}>Order</th>
                  <th>Customer</th>
                  <th style={{ width: 50, textAlign: "center" }}>Items</th>
                  <th style={{ width: 110 }}>Payment</th>
                  <th style={{ width: 120 }}>Status</th>
                  <th style={{ width: 100 }}>Date</th>
                  <th className="nk-num" style={{ width: 110 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const initials = (order.buyerName ?? "?").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
                  const date = new Date(order.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
                  const isChecked = selected2.has(order.id);
                  return (
                    <tr
                      key={order.id}
                      className="nk-clickable"
                      style={{ background: isChecked ? "var(--nk-accent-soft)" : undefined }}
                      onClick={() => setSelected(order)}
                    >
                      <td style={{ padding: "0 8px 0 16px" }} onClick={(e) => { e.stopPropagation(); toggleRow(order.id); }}>
                        <input type="checkbox" checked={isChecked} onChange={() => toggleRow(order.id)} style={{ cursor: "pointer" }} />
                      </td>
                      <td className="nk-mono" style={{ fontSize: 12, color: "var(--nk-muted)" }}>{order.orderNumber}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Avatar initials={initials} size={24} />
                          <div>
                            <div style={{ fontSize: 12.5, fontWeight: 500 }}>{order.buyerName}</div>
                            <div style={{ fontSize: 11, color: "var(--nk-muted)" }}>{order.buyerEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: "center", fontSize: 13 }}>{order.items?.length ?? "—"}</td>
                      <td style={{ fontSize: 12, color: "var(--nk-muted)" }}>{order.paymentMethod?.replace(/_/g, " ")}</td>
                      <td><StatusBadge status={order.status} /></td>
                      <td style={{ fontSize: 12, color: "var(--nk-muted)" }}>{date}</td>
                      <td className="nk-num nk-tnum" style={{ fontWeight: 500, fontSize: 13 }}>{fmtRs(Number(order.total))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
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

      {/* Order detail sheet */}
      <Sheet open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <SheetContent className="w-full sm:max-w-md p-0 overflow-y-auto">
          {selected && <OrderDetail order={selected} onClose={() => setSelected(null)} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}
