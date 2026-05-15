"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { get, patch } from "@/lib/api";
import { Tenant } from "../../../types";
import { PageHeader } from "../../../components/shared/page-header";
import { useAuthStore } from "../../../store/auth.store";

const schema = z.object({
  name: z.string().min(1, "Store name is required"),
  description: z.string().optional(),
  logo: z.string().url("Invalid URL").optional().or(z.literal("")),
  banner: z.string().url("Invalid URL").optional().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

export default function StoreSettingsPage() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data: tenant, isLoading } = useQuery<Tenant>({
    queryKey: ["tenant", "my"],
    queryFn: () => get<Tenant>("/tenants/my"),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (tenant) {
      reset({
        name: tenant.name ?? "",
        description: tenant.description ?? "",
        logo: tenant.logo ?? "",
        banner: tenant.banner ?? "",
      });
    }
  }, [tenant, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      patch(`/tenants/${user?.tenantId}`, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenant"] });
      toast.success("Store settings saved");
    },
    onError: () => toast.error("Failed to save settings"),
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <PageHeader title="Store Settings" description="Update your store's public profile." />

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Store Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Store Name *</Label>
              <Input {...register("name")} placeholder="My Awesome Store" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea {...register("description")} rows={3} placeholder="Tell customers about your store…" />
            </div>
            <div className="space-y-1">
              <Label>Logo URL</Label>
              <Input {...register("logo")} placeholder="https://example.com/logo.png" />
              {errors.logo && <p className="text-xs text-destructive">{errors.logo.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Banner URL</Label>
              <Input {...register("banner")} placeholder="https://example.com/banner.jpg" />
              {errors.banner && <p className="text-xs text-destructive">{errors.banner.message}</p>}
            </div>
          </CardContent>
        </Card>

        {tenant && (
          <Card>
            <CardHeader><CardTitle className="text-base">Store Info</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Slug</span>
                <span className="font-mono">{tenant.slug}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="capitalize">{tenant.status.toLowerCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Owner</span>
                <span>{tenant.owner.name}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || mutation.isPending}>
            {(isSubmitting || mutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
