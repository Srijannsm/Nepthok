"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { get, post, patch } from "@/lib/api";
import { Product, Category } from "../../types";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be >= 0"),
  comparePrice: z.coerce.number().optional(),
  sku: z.string().optional(),
  stock: z.coerce.number().int().min(0, "Stock must be >= 0"),
  lowStockThreshold: z.coerce.number().int().min(0).default(10),
  categoryId: z.string().min(1, "Category is required"),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("DRAFT"),
  isFeatured: z.boolean().default(false),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  product?: Product;
  onClose: () => void;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
}

export function ProductForm({ product, onClose }: Props) {
  const qc = useQueryClient();
  const [images, setImages] = useState<string[]>(product?.images ?? [""]);
  const [tiersEnabled, setTiersEnabled] = useState(!!product?.pricingTiers?.length);
  const [tiers, setTiers] = useState<Array<{ minQty: number; price: number; label: string }>>(
    product?.pricingTiers ?? [],
  );

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => get<Category[]>("/categories"),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues, unknown, FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: product?.name ?? "",
      slug: product?.slug ?? "",
      description: product?.description ?? "",
      price: product?.price ? Number(product.price) : 0,
      comparePrice: product?.comparePrice ? Number(product.comparePrice) : undefined,
      sku: product?.sku ?? "",
      stock: product?.stock ?? 0,
      lowStockThreshold: product?.lowStockThreshold ?? 10,
      categoryId: product?.category?.id ?? "",
      status: (product?.status as "DRAFT" | "ACTIVE" | "ARCHIVED") ?? "DRAFT",
      isFeatured: product?.isFeatured ?? false,
    },
  });

  const nameVal = watch("name");
  useEffect(() => {
    if (!product) setValue("slug", slugify(nameVal ?? ""));
  }, [nameVal, product, setValue]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const { status, ...rest } = values;
      const base = {
        ...rest,
        images: images.filter(Boolean),
        pricingTiers: tiersEnabled ? tiers : undefined,
      };
      return product
        ? patch(`/seller/products/${product.id}`, { ...base, status })
        : post("/seller/products", base);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success(product ? "Product updated" : "Product created");
      onClose();
    },
    onError: () => toast.error("Failed to save product"),
  });

  const addImage = () => setImages((prev) => [...prev, ""]);
  const removeImage = (i: number) => setImages((prev) => prev.filter((_, idx) => idx !== i));
  const setImage = (i: number, v: string) => setImages((prev) => prev.map((x, idx) => (idx === i ? v : x)));

  const addTier = () => setTiers((prev) => [...prev, { minQty: 10, price: 0, label: "Wholesale" }]);
  const removeTier = (i: number) => setTiers((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="border-b">
        <SheetTitle>{product ? "Edit Product" : "Add Product"}</SheetTitle>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Name + Slug */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Name *</Label>
            <Input {...register("name")} placeholder="iPhone 15 Case" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Slug *</Label>
            <Input {...register("slug")} placeholder="iphone-15-case" />
            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <Label>Description</Label>
          <Textarea {...register("description")} rows={3} placeholder="Product description…" />
        </div>

        {/* Price + Compare Price */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Price (NPR) *</Label>
            <Input type="number" {...register("price")} placeholder="850" />
            {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Compare Price (NPR)</Label>
            <Input type="number" {...register("comparePrice")} placeholder="1200" />
          </div>
        </div>

        {/* SKU + Stock + Threshold */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label>SKU</Label>
            <Input {...register("sku")} placeholder="CASE-001" />
          </div>
          <div className="space-y-1">
            <Label>Stock</Label>
            <Input type="number" {...register("stock")} placeholder="50" />
            {errors.stock && <p className="text-xs text-destructive">{errors.stock.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Low Stock At</Label>
            <Input type="number" {...register("lowStockThreshold")} placeholder="10" />
          </div>
        </div>

        {/* Category + Status */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Category *</Label>
            <select
              className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register("categoryId")}
            >
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <select
              className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register("status")}
            >
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>

        {/* Featured */}
        <div className="flex items-center gap-2">
          <input type="checkbox" id="featured" {...register("isFeatured")} className="h-4 w-4" />
          <Label htmlFor="featured">Featured product</Label>
        </div>

        {/* Images */}
        <div className="space-y-2">
          <Label>Images (URLs)</Label>
          {images.map((url, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={url}
                onChange={(e) => setImage(i, e.target.value)}
                placeholder="https://…"
              />
              {images.length > 1 && (
                <Button type="button" size="icon" variant="ghost" onClick={() => removeImage(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          {images.length < 5 && (
            <Button type="button" size="sm" variant="outline" onClick={addImage}>
              <Plus className="h-4 w-4 mr-1" /> Add image
            </Button>
          )}
        </div>

        {/* Pricing Tiers */}
        <div className="space-y-3 border rounded-lg p-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="tiers-toggle"
              checked={tiersEnabled}
              onChange={(e) => setTiersEnabled(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="tiers-toggle">Enable wholesale pricing tiers</Label>
          </div>
          {tiersEnabled && (
            <div className="space-y-2">
              {tiers.map((tier, i) => (
                <div key={i} className="grid grid-cols-4 gap-2 items-end">
                  <div className="space-y-1">
                    <Label className="text-xs">Min Qty</Label>
                    <Input
                      type="number"
                      value={tier.minQty}
                      onChange={(e) => setTiers((prev) => prev.map((t, idx) => idx === i ? { ...t, minQty: Number(e.target.value) } : t))}
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs">Price (NPR)</Label>
                    <Input
                      type="number"
                      value={tier.price}
                      onChange={(e) => setTiers((prev) => prev.map((t, idx) => idx === i ? { ...t, price: Number(e.target.value) } : t))}
                    />
                  </div>
                  <Button type="button" size="icon" variant="ghost" onClick={() => removeTier(i)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" size="sm" variant="outline" onClick={addTier}>
                <Plus className="h-4 w-4 mr-1" /> Add tier
              </Button>
            </div>
          )}
        </div>
      </div>

      <SheetFooter className="border-t p-4">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit((v) => mutation.mutate(v))}
          disabled={isSubmitting || mutation.isPending}
        >
          {(isSubmitting || mutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {product ? "Save changes" : "Create product"}
        </Button>
      </SheetFooter>
    </div>
  );
}
