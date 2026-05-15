"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ShoppingBag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { get } from "@/lib/api";
import { formatNPR, formatDate } from "@/lib/utils";
import { Order, PaginatedResponse } from "../../../types";
import { StatusBadge } from "../../../components/shared/status-badge";
import { EmptyState } from "../../../components/shared/empty-state";
import { PageHeader } from "../../../components/shared/page-header";
import { OrderDetail } from "../../../components/admin/order-detail";

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Shipped", value: "SHIPPED" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data, isLoading } = useQuery<PaginatedResponse<Order>>({
    queryKey: ["orders", search, status, page],
    queryFn: () =>
      get<PaginatedResponse<Order>>(
        `/seller/orders?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}${status ? `&status=${status}` : ""}`,
      ),
  });

  const orders = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="p-6">
      <PageHeader title="Orders" />

      {/* Filters */}
      <div className="space-y-3 mb-4">
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders…"
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

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead className="text-center">Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : orders.length === 0
              ? (
                <TableRow>
                  <TableCell colSpan={8} className="p-0">
                    <EmptyState
                      icon={ShoppingBag}
                      title="No orders yet"
                      description="Orders placed by customers will appear here."
                    />
                  </TableCell>
                </TableRow>
              )
              : orders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <TableCell className="font-mono text-xs">{order.orderNumber}</TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{order.buyerName}</p>
                      <p className="text-xs text-muted-foreground">{order.buyerEmail}</p>
                    </TableCell>
                    <TableCell className="text-center text-sm">{order.items?.length ?? "—"}</TableCell>
                    <TableCell className="text-sm font-medium">{formatNPR(Number(order.total))}</TableCell>
                    <TableCell><StatusBadge status={order.status} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {order.paymentMethod.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
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

      {/* Order detail sheet */}
      <Sheet open={!!selectedOrder} onOpenChange={(open) => { if (!open) setSelectedOrder(null); }}>
        <SheetContent className="w-full sm:max-w-md p-0 overflow-y-auto">
          {selectedOrder && (
            <OrderDetail order={selectedOrder} onClose={() => setSelectedOrder(null)} />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
