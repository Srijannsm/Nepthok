// Shared TypeScript types for Nepthok
// Add domain types here as the project grows.

export type TenantId = string;
export type UserId = string;

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
}

export interface PricingTier {
  minQty: number;
  maxQty: number | null;
  price: number;
}

export interface ProductWithTiers {
  price: number;
  pricingTiers?: PricingTier[] | null;
}
