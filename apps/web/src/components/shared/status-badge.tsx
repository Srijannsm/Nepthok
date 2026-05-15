import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  // Order statuses
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  CONFIRMED: "bg-blue-100 text-blue-800 border-blue-200",
  PROCESSING: "bg-purple-100 text-purple-800 border-purple-200",
  SHIPPED: "bg-indigo-100 text-indigo-800 border-indigo-200",
  DELIVERED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
  REFUNDED: "bg-orange-100 text-orange-800 border-orange-200",
  // Tenant statuses
  ACTIVE: "bg-green-100 text-green-800 border-green-200",
  SUSPENDED: "bg-red-100 text-red-800 border-red-200",
  // Product statuses
  DRAFT: "bg-gray-100 text-gray-700 border-gray-200",
  ARCHIVED: "bg-orange-100 text-orange-800 border-orange-200",
  // Subscription statuses
  TRIAL: "bg-blue-100 text-blue-800 border-blue-200",
  PAST_DUE: "bg-red-100 text-red-800 border-red-200",
  EXPIRED: "bg-gray-100 text-gray-600 border-gray-200",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium capitalize", STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600")}
    >
      {status.replace(/_/g, " ").toLowerCase()}
    </Badge>
  );
}
