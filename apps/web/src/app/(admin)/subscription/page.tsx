"use client";

import { useQuery } from "@tanstack/react-query";
import { CreditCard, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { get } from "@/lib/api";
import { formatNPR, formatDate } from "@/lib/utils";
import { Subscription, Plan } from "../../../types";
import { StatusBadge } from "../../../components/shared/status-badge";
import { EmptyState } from "../../../components/shared/empty-state";
import { PageHeader } from "../../../components/shared/page-header";

export default function SubscriptionPage() {
  const { data: subscription, isLoading } = useQuery<Subscription | null>({
    queryKey: ["subscription", "my"],
    queryFn: () => get<Subscription>("/subscriptions/my").catch(() => null),
  });

  const { data: plans } = useQuery<Plan[]>({
    queryKey: ["plans"],
    queryFn: () => get<Plan[]>("/plans"),
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <PageHeader title="Subscription" description="Your current plan and billing history." />

      {/* Current plan */}
      {subscription ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Current Plan</CardTitle>
            <StatusBadge status={subscription.status} />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold">{subscription.plan.name}</p>
                <p className="text-sm text-muted-foreground capitalize">{subscription.plan.tier.toLowerCase()} tier</p>
              </div>
              <p className="text-2xl font-bold">{formatNPR(Number(subscription.plan.price))}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm pt-2 border-t">
              <div>
                <p className="text-muted-foreground">Period Start</p>
                <p className="font-medium">{formatDate(subscription.currentPeriodStart)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Period End</p>
                <p className="font-medium">{formatDate(subscription.currentPeriodEnd)}</p>
              </div>
            </div>
            {subscription.plan.features.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-2">Included features</p>
                <ul className="grid grid-cols-2 gap-1">
                  {subscription.plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={CreditCard}
              title="No active subscription"
              description="Contact support to activate a subscription plan."
            />
          </CardContent>
        </Card>
      )}

      {/* Available plans */}
      {plans && plans.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Available Plans</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {plans.map((plan) => (
              <Card key={plan.id} className={subscription?.plan.id === plan.id ? "border-primary" : undefined}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                    {subscription?.plan.id === plan.id && (
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">Current</span>
                    )}
                  </div>
                  <p className="text-xl font-bold">{formatNPR(Number(plan.price))}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    <li className="text-sm text-muted-foreground">
                      {plan.maxProducts === null ? "Unlimited products" : `Up to ${plan.maxProducts} products`}
                    </li>
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">To change or cancel your plan, contact support.</p>
        </div>
      )}

      {/* Payment history */}
      {subscription?.payments && subscription.payments.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Payment History</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Method</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Amount</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {subscription.payments.map((payment) => (
                  <tr key={payment.id} className="border-b last:border-0">
                    <td className="p-3">{formatDate(payment.paidAt)}</td>
                    <td className="p-3 capitalize">{payment.method.replace(/_/g, " ").toLowerCase()}</td>
                    <td className="p-3 text-right font-medium">{formatNPR(Number(payment.amount))}</td>
                    <td className="p-3 text-right">
                      <StatusBadge status={payment.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
