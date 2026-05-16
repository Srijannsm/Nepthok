"use client";

import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";
import { fmtRs, Icon, StatusBadge, Badge } from "@/components/nk/primitives";
import { Subscription, Plan } from "@/types";

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
      <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16, maxWidth: 680 }}>
        {[1, 2, 3].map((i) => <div key={i} style={{ height: i === 1 ? 160 : 100, background: "var(--nk-bg-2)", borderRadius: 8 }} />)}
      </div>
    );
  }

  const sub = subscription;

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 18, maxWidth: 680 }}>

      <div>
        <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.018em", margin: 0 }}>Subscription</h1>
        <div style={{ fontSize: 12.5, color: "var(--nk-muted)", marginTop: 3 }}>Your current plan and billing history.</div>
      </div>

      {/* Current plan card */}
      {sub ? (
        <div className="nk-card">
          <div className="nk-card-hd">
            <h3>Current Plan</h3>
            <StatusBadge status={sub.status} />
          </div>
          <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{sub.plan.name}</div>
                <div style={{ fontSize: 12.5, color: "var(--nk-muted)", marginTop: 2, textTransform: "capitalize" }}>{sub.plan.tier.toLowerCase()} tier</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span className="nk-tnum" style={{ fontSize: 22, fontWeight: 600 }}>{fmtRs(Number(sub.plan.price))}</span>
                <span style={{ fontSize: 12.5, color: "var(--nk-muted)" }}>/mo</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, paddingTop: 12, borderTop: "1px solid var(--nk-border)", fontSize: 13 }}>
              <div>
                <div style={{ color: "var(--nk-muted)", marginBottom: 3 }}>Period start</div>
                <div style={{ fontWeight: 500 }}>{fmt(sub.currentPeriodStart)}</div>
              </div>
              <div>
                <div style={{ color: "var(--nk-muted)", marginBottom: 3 }}>Period end</div>
                <div style={{ fontWeight: 500 }}>{fmt(sub.currentPeriodEnd)}</div>
              </div>
            </div>

            {sub.plan.features.length > 0 && (
              <div style={{ paddingTop: 12, borderTop: "1px solid var(--nk-border)" }}>
                <div style={{ fontSize: 12.5, fontWeight: 500, marginBottom: 10 }}>Included features</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px" }}>
                  {sub.plan.features.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "var(--nk-muted)" }}>
                      <Icon name="check" size={12} color="var(--nk-success)" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="nk-card" style={{ padding: "48px 24px", textAlign: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--nk-bg-2)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <Icon name="card" size={18} color="var(--nk-muted)" />
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>No active subscription</div>
          <div style={{ fontSize: 13, color: "var(--nk-muted)" }}>Contact support to activate a subscription plan.</div>
        </div>
      )}

      {/* Available plans */}
      {plans && plans.length > 0 && (
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--nk-muted)", marginBottom: 12 }}>Available Plans</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {plans.map((plan) => {
              const isCurrent = sub?.plan.id === plan.id;
              return (
                <div
                  key={plan.id}
                  className="nk-card"
                  style={{ border: isCurrent ? "1.5px solid var(--nk-accent)" : undefined }}
                >
                  <div style={{ padding: "14px 16px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{plan.name}</div>
                      {isCurrent && <Badge tone="accent">Current</Badge>}
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <span className="nk-tnum" style={{ fontSize: 20, fontWeight: 600 }}>{fmtRs(Number(plan.price))}</span>
                      <span style={{ fontSize: 12.5, color: "var(--nk-muted)" }}>/mo</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <div style={{ fontSize: 12.5, color: "var(--nk-muted)" }}>
                        {plan.maxProducts === null ? "Unlimited products" : `Up to ${plan.maxProducts} products`}
                      </div>
                      {plan.features.map((f, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "var(--nk-muted)" }}>
                          <Icon name="check" size={12} color="var(--nk-success)" />
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--nk-muted)", marginTop: 10 }}>To change or cancel your plan, contact support.</div>
        </div>
      )}

      {/* Payment history */}
      {sub?.payments && sub.payments.length > 0 && (
        <div className="nk-card" style={{ overflow: "hidden", padding: 0 }}>
          <div className="nk-card-hd"><h3>Payment History</h3></div>
          <table className="nk-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Method</th>
                <th className="nk-num">Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sub.payments.map((payment) => (
                <tr key={payment.id}>
                  <td style={{ fontSize: 12.5 }}>{fmt(payment.paidAt)}</td>
                  <td style={{ fontSize: 12.5, textTransform: "capitalize" }}>{payment.method.replace(/_/g, " ").toLowerCase()}</td>
                  <td className="nk-num nk-tnum" style={{ fontWeight: 500 }}>{fmtRs(Number(payment.amount))}</td>
                  <td><StatusBadge status={payment.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
