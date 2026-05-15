import {
  BillingCycle,
  PaymentMethod,
  PaymentStatus,
  PlanTier,
  SubscriptionStatus,
} from "@nepthok/database";

export class SubscriptionResponseDto {
  id: string;
  tenantId: string;
  planId: string;
  status: SubscriptionStatus;
  plan: {
    id: string;
    name: string;
    tier: PlanTier;
    price: unknown;
    billingCycle: BillingCycle;
    features: unknown;
  };
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelledAt: Date | null;
  payments: Array<{
    id: string;
    amount: unknown;
    method: PaymentMethod;
    status: PaymentStatus;
    paidAt: Date | null;
    transactionId: string | null;
  }>;
}
