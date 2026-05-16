"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { patch } from "@/lib/api";
import { formatNPR, formatDate } from "@/lib/utils";
import { Order } from "../../types";
import { StatusBadge } from "../shared/status-badge";

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["REFUNDED"],
};

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: "Confirm",
  PROCESSING: "Mark Processing",
  SHIPPED: "Mark Shipped",
  DELIVERED: "Mark Delivered",
  REFUNDED: "Refund",
  CANCELLED: "Cancel order",
};

interface Props {
  order: Order;
  onClose: () => void;
}

export function OrderDetail({ order, onClose }: Props) {
  const qc = useQueryClient();
  const [nextStatus, setNextStatus] = useState("");
  const [note, setNote] = useState("");

  const transitions = VALID_TRANSITIONS[order.status] ?? [];

  const mutation = useMutation({
    mutationFn: (status: string) =>
      patch(`/seller/orders/${order.id}/status`, { status, note: note || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order status updated");
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to update order status"),
  });

  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="border-b p-4">
        <div className="flex items-center gap-3">
          <SheetTitle className="font-mono">{order.orderNumber}</SheetTitle>
          <StatusBadge status={order.status} />
        </div>
        <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto divide-y">
        {/* Buyer info */}
        <section className="p-4 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Buyer</p>
          <p className="text-sm font-medium">{order.buyerName}</p>
          <p className="text-sm text-muted-foreground">{order.buyerEmail}</p>
          <p className="text-sm text-muted-foreground">{order.buyerPhone}</p>
        </section>

        {/* Shipping address */}
        <section className="p-4 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Shipping Address</p>
          <p className="text-sm">{order.shippingAddress.street}</p>
          <p className="text-sm text-muted-foreground">
            {order.shippingAddress.city}, {order.shippingAddress.district}
          </p>
          <p className="text-sm text-muted-foreground">{order.shippingAddress.province} Province</p>
        </section>

        {/* Items */}
        <section className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Items</p>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-start text-sm">
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-muted-foreground text-xs">
                    {item.quantity} × {formatNPR(Number(item.unitPrice))}
                  </p>
                </div>
                <p className="font-medium">{formatNPR(Number(item.total))}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Order summary */}
        <section className="p-4 space-y-1.5 text-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Summary</p>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatNPR(Number(order.subtotal))}</span>
          </div>
          {Number(order.discount) > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>−{formatNPR(Number(order.discount))}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span>{formatNPR(Number(order.shippingFee))}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatNPR(Number(order.total))}</span>
          </div>
        </section>

        {/* Payment info */}
        <section className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Payment</p>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{order.paymentMethod.replace(/_/g, " ")}</span>
            <StatusBadge status={order.paymentStatus} />
          </div>
        </section>

        {/* Update status */}
        {transitions.length > 0 && (
          <section className="p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Update Status</p>
            <select
              className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={nextStatus}
              onChange={(e) => setNextStatus(e.target.value)}
            >
              <option value="">Select next status…</option>
              {transitions.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
              ))}
            </select>
            <input
              className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={!nextStatus || mutation.isPending}
                onClick={() => mutation.mutate(nextStatus)}
              >
                {mutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Update Status
              </Button>
              {["PENDING", "CONFIRMED"].includes(order.status) && (
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate("CANCELLED")}
                >
                  Cancel Order
                </Button>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
