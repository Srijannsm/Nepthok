export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: "SUPER_ADMIN" | "SELLER_ADMIN" | "SELLER_STAFF";
  tenantId: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  banner: string | null;
  status: "PENDING" | "ACTIVE" | "SUSPENDED" | "CANCELLED";
  owner: Pick<User, "id" | "name" | "email" | "phone">;
  subscription: Subscription | null;
  createdAt: string;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  tier: "BASIC" | "PRO";
  price: string;
  billingCycle: "MONTHLY" | "YEARLY";
  maxProducts: number | null;
  features: string[];
}

export interface SubscriptionPayment {
  id: string;
  amount: string;
  method: string;
  status: string;
  paidAt: string;
  transactionId: string | null;
}

export interface Subscription {
  id: string;
  status: "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | "EXPIRED";
  plan: Plan;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  payments: SubscriptionPayment[];
}

export interface PricingTier {
  minQty: number;
  price: number;
  label: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  children?: Category[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  comparePrice: string | null;
  stock: number;
  lowStockThreshold: number;
  images: string[];
  category: Category | null;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  pricingTiers: PricingTier[] | null;
  isFeatured: boolean;
  sku: string | null;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  productName: string;
  productSku: string | null;
  quantity: number;
  unitPrice: string;
  total: string;
}

export interface ShippingAddress {
  street: string;
  city: string;
  district: string;
  province: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED";
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  subtotal: string;
  discount: string;
  shippingFee: string;
  total: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
