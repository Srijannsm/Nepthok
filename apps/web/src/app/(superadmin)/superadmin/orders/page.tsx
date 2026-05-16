"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { get } from "@/lib/api";
import { Icon } from "@/components/nk/primitives";
import { fmtRs } from "@/components/nk/primitives";
import { formatDate } from "@/lib/utils";
import { Order, PaginatedResponse } from "../../../../types";
import { OrderDetail } from "../../../../components/admin/order-detail";

const STATUS_TABS = [
  { label: "All",        value: "" },
  { label: "Pending",    value: "PENDING" },
  { label: "Confirmed",  value: "CONFIRMED" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Shipped",    value: "SHIPPED" },
  { label: "Delivered",  value: "DELIVERED" },
  { label: "Cancelled",  value: "CANCELLED" },
];

const STATUS_COLOR: Record<string, string> = {
  PENDING: "#ca8a04", CONFIRMED: "var(--nk-accent)", PROCESSING: "var(--nk-accent)",
  SHIPPED: "var(--nk-accent)", DELIVERED: "var(--nk-success)", FULFILLED: "var(--nk-success)",
  CANCELLED: "var(--nk-danger)",
};

interface AdminOrder extends Order {
  tenant?: { id: string; name: string; slug: string };
}

const inputCls = "flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export default function AdminOrdersPage() {
  const [search, setSearch]             = useState("");
  const [status, setStatus]             = useState("");
  const [page, setPage]                 = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  const { data, isLoading } = useQuery<PaginatedResponse<AdminOrder>>({
    queryKey: ["superadmin", "orders", search, status, page],
    queryFn: () =>
      get<PaginatedResponse<AdminOrder>>(
        `/admin/orders?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}${status ? `&status=${status}` : ""}`,
      ),
  });

  const orders     = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalCount = data?.total ?? 0;

  return (
    <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.018em", margin: 0 }}>All Orders</h1>
        <div style={{ fontSize: 12.5, color: "var(--nk-muted)", marginTop: 3 }}>Read-only · {!isLoading ? totalCount : "…"} total across all sellers</div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex" }}><Icon name="search" size={13} color="var(--nk-muted)" /></span>
          <input
            className={inputCls}
            style={{ paddingLeft: 30, width: 220 }}
            placeholder="Search orders…"
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
                height: 26, fontSize: 11.5, padding: "0 10px",
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
              <th>Order #</th>
              <th>Seller</th>
              <th>Buyer</th>
              <th className="nk-num">Total</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 7 }).map((__, j) => <td key={j}><div style={{ height: 18, background: "var(--nk-bg-2)", borderRadius: 4 }} /></td>)}</tr>
              ))
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "40px 16px", fontSize: 13, color: "var(--nk-muted)" }}>
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const statusColor = STATUS_COLOR[order.status] ?? "var(--nk-muted)";
                return (
                  <tr key={order.id} style={{ cursor: "pointer" }} onClick={() => setSelectedOrder(order)}>
                    <td style={{ fontSize: 11.5, fontFamily: "monospace", color: "var(--nk-muted)" }}>{order.orderNumber}</td>
                    <td>
                      <div style={{ fontSize: 12.5, fontWeight: 600 }}>{order.tenant?.name ?? "—"}</div>
                      <div style={{ fontSize: 11, fontFamily: "monospace", color: "var(--nk-muted)" }}>{order.tenant?.slug}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: 12.5, fontWeight: 500 }}>{order.buyerName}</div>
                      <div style={{ fontSize: 11.5, color: "var(--nk-muted)" }}>{order.buyerEmail}</div>
                    </td>
                    <td className="nk-num nk-tnum" style={{ fontSize: 13, fontWeight: 600 }}>{fmtRs(Number(order.total))}</td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 999,
                        background: `${statusColor}18`, color: statusColor,
                      }}>{order.status}</span>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--nk-muted)" }}>{order.paymentMethod.replace(/_/g, " ")}</td>
                    <td style={{ fontSize: 11.5, color: "var(--nk-muted)" }}>{formatDate(order.createdAt)}</td>
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

      {/* Order detail sheet */}
      <Sheet open={!!selectedOrder} onOpenChange={(open) => { if (!open) setSelectedOrder(null); }}>
        <SheetContent className="w-full sm:max-w-md p-0 overflow-y-auto">
          {selectedOrder && <OrderDetail order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}
