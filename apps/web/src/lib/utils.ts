import { clsx, type ClassValue } from "clsx";
import { format, formatDistanceToNow } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNPR(amount: number): string {
  return `NPR ${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: string): string {
  return format(new Date(date), "MMM d, yyyy");
}

export function formatRelativeTime(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getOrderStatusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING: "text-yellow-600",
    CONFIRMED: "text-blue-600",
    PROCESSING: "text-purple-600",
    SHIPPED: "text-indigo-600",
    DELIVERED: "text-green-600",
    CANCELLED: "text-red-600",
    REFUNDED: "text-gray-600",
  };
  return map[status] ?? "text-gray-500";
}

export function getStatusBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (["DELIVERED", "ACTIVE", "APPROVED"].includes(status)) return "default";
  if (["PENDING", "TRIAL", "PROCESSING"].includes(status)) return "secondary";
  if (["CANCELLED", "SUSPENDED", "EXPIRED"].includes(status)) return "destructive";
  return "outline";
}

