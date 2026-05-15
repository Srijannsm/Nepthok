"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Tag, Trash2, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { get, post, del } from "@/lib/api";
import { formatNPR, formatDate } from "@/lib/utils";
import { PaginatedResponse } from "../../../types";
import { StatusBadge } from "../../../components/shared/status-badge";
import { EmptyState } from "../../../components/shared/empty-state";
import { PageHeader } from "../../../components/shared/page-header";

interface Discount {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: string;
  minOrderAmount: string | null;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface AccessCheck {
  hasAccess: boolean;
  reason?: string;
}

const schema = z.object({
  code: z.string().min(3).max(20).regex(/^[A-Z0-9_-]+$/, "Uppercase letters, numbers, hyphens, underscores only"),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.coerce.number().min(0.01),
  minOrderAmount: z.coerce.number().min(0).optional(),
  maxUses: z.coerce.number().int().min(1).optional(),
  expiresAt: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function DiscountsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: access, isLoading: accessLoading } = useQuery<AccessCheck>({
    queryKey: ["access", "discounts"],
    queryFn: () => get<AccessCheck>("/subscriptions/check-access?feature=discounts"),
  });

  const { data, isLoading } = useQuery<PaginatedResponse<Discount>>({
    queryKey: ["discounts", page],
    queryFn: () => get<PaginatedResponse<Discount>>(`/seller/discounts?page=${page}&limit=20`),
    enabled: !!access?.hasAccess,
  });

  const discounts = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues, unknown, FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: { type: "PERCENTAGE" },
  });

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => post("/seller/discounts", values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["discounts"] });
      toast.success("Discount code created");
      setSheetOpen(false);
      reset();
    },
    onError: () => toast.error("Failed to create discount"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => del(`/seller/discounts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["discounts"] });
      toast.success("Discount deactivated");
    },
    onError: () => toast.error("Failed to deactivate discount"),
  });

  if (accessLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!access?.hasAccess) {
    return (
      <div className="p-6">
        <PageHeader title="Discount Codes" />
        <Card>
          <CardContent className="py-12 flex flex-col items-center text-center gap-4">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">PRO Feature</p>
              <p className="text-sm text-muted-foreground mt-1">
                Discount codes are available on the PRO plan. Upgrade to create and manage discount codes.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Discount Codes"
        action={
          <Button size="sm" onClick={() => { reset(); setSheetOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Create Code
          </Button>
        }
      />

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Min Order</TableHead>
              <TableHead className="text-center">Used / Max</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
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
              : discounts.length === 0
              ? (
                <TableRow>
                  <TableCell colSpan={8} className="p-0">
                    <EmptyState
                      icon={Tag}
                      title="No discount codes"
                      description="Create your first discount code to offer deals to customers."
                      action={{ label: "Create Code", onClick: () => { reset(); setSheetOpen(true); } }}
                    />
                  </TableCell>
                </TableRow>
              )
              : discounts.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono font-semibold">{d.code}</TableCell>
                    <TableCell className="text-sm capitalize">{d.type.toLowerCase()}</TableCell>
                    <TableCell className="text-sm font-medium">
                      {d.type === "PERCENTAGE" ? `${d.value}%` : formatNPR(Number(d.value))}
                    </TableCell>
                    <TableCell className="text-sm">
                      {d.minOrderAmount ? formatNPR(Number(d.minOrderAmount)) : "—"}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {d.usedCount} / {d.maxUses ?? "∞"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {d.expiresAt ? formatDate(d.expiresAt) : "Never"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={d.isActive ? "ACTIVE" : "ARCHIVED"} />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        disabled={deleteMutation.isPending || !d.isActive}
                        onClick={() => deleteMutation.mutate(d.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
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

      {/* Create sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Create Discount Code</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="space-y-4 mt-4">
            <div className="space-y-1">
              <Label>Code *</Label>
              <Input {...register("code")} placeholder="SAVE20" className="uppercase" />
              {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Type *</Label>
                <select
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...register("type")}
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed (NPR)</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>Value *</Label>
                <Input type="number" step="0.01" {...register("value")} placeholder="10" />
                {errors.value && <p className="text-xs text-destructive">{errors.value.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Min Order (NPR)</Label>
                <Input type="number" {...register("minOrderAmount")} placeholder="500" />
              </div>
              <div className="space-y-1">
                <Label>Max Uses</Label>
                <Input type="number" {...register("maxUses")} placeholder="100" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Expires At</Label>
              <Input type="date" {...register("expiresAt")} />
            </div>
            <SheetFooter>
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
                {(isSubmitting || createMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
