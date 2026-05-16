"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BarChart3, CreditCard, RefreshCw, ShoppingBag, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { get, post } from "@/lib/api";
import { fmtRs } from "@/components/nk/primitives";

const G = "#16a34a";

interface PlatformSummary {
  totalTenants: number;
  activeTenants: number;
  pendingApproval: number;
  totalRevenue: number;
  totalOrders: number;
  activeSubscriptions: number;
  monthlyRecurringRevenue: number;
}
interface TopTenant { id?: string; name?: string; slug?: string; orderCount: number }
interface PlatformAnalyticsData {
  summary: PlatformSummary;
  topTenants: TopTenant[];
  subscriptionBreakdown: { basic: number; pro: number };
}

const PERIODS = [
  { label: "7 days",  value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
];

function KPI({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="nk-card" style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div className="nk-eyebrow">{label}</div>
        <Icon size={14} color="var(--nk-muted)" />
      </div>
      <div className="nk-tnum" style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.022em" }}>{value}</div>
    </div>
  );
}

export default function PlatformAnalyticsPage() {
  const [period, setPeriod] = useState("30d");

  const { data, isLoading } = useQuery<PlatformAnalyticsData>({
    queryKey: ["superadmin", "analytics", period],
    queryFn: () => get<PlatformAnalyticsData>(`/analytics/platform?period=${period}`),
  });

  const snapshotMutation = useMutation({
    mutationFn: () => post("/analytics/snapshot", {}),
    onSuccess: () => toast.success("Snapshot triggered — data will update shortly"),
    onError:   (e: any) => toast.error(e?.response?.data?.message ?? "Snapshot failed"),
  });

  const summary    = data?.summary;
  const topTenants = data?.topTenants ?? [];
  const breakdown  = data?.subscriptionBreakdown ?? { basic: 0, pro: 0 };

  const barData = [
    { name: "Basic", count: breakdown.basic, fill: "var(--nk-accent)" },
    { name: "Pro",   count: breakdown.pro,   fill: G },
  ];

  const stats = [
    { label: "Total Revenue · " + period, value: isLoading ? "—" : fmtRs(summary?.totalRevenue ?? 0),            icon: TrendingUp },
    { label: "Total Orders · " + period,  value: isLoading ? "—" : String(summary?.totalOrders ?? 0),            icon: ShoppingBag },
    { label: "Active Sellers",            value: isLoading ? "—" : String(summary?.activeTenants ?? 0),          icon: BarChart3 },
    { label: "Monthly Recurring Revenue", value: isLoading ? "—" : fmtRs(summary?.monthlyRecurringRevenue ?? 0), icon: CreditCard },
  ];

  return (
    <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.018em", margin: 0 }}>Platform Analytics</h1>
          <div style={{ fontSize: 12.5, color: "var(--nk-muted)", marginTop: 3 }}>Platform-wide metrics</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Period selector */}
          <div style={{ display: "flex", gap: 2, padding: 3, background: "var(--nk-bg-2)", borderRadius: 7, border: "1px solid var(--nk-border)" }}>
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className="nk-btn"
                style={{
                  height: 26, fontSize: 12, padding: "0 10px",
                  background: period === p.value ? "var(--nk-surface)" : "transparent",
                  color: period === p.value ? "var(--nk-fg)" : "var(--nk-muted)",
                  boxShadow: period === p.value ? "var(--nk-shadow-sm)" : "none",
                }}
              >{p.label}</button>
            ))}
          </div>

          {/* Snapshot trigger */}
          <button
            className="nk-btn"
            style={{ display: "flex", alignItems: "center", gap: 6, height: 32, fontSize: 12.5, padding: "0 14px", border: "1px solid var(--nk-border)" }}
            disabled={snapshotMutation.isPending}
            onClick={() => snapshotMutation.mutate()}
            title="Manually record analytics snapshot for all tenants"
          >
            <RefreshCw size={13} style={{ animation: snapshotMutation.isPending ? "spin 1s linear infinite" : undefined }} />
            {snapshotMutation.isPending ? "Running…" : "Trigger Snapshot"}
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {stats.map((s) => <KPI key={s.label} {...s} />)}
      </div>

      {/* Main content row */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 18 }}>

        {/* Top sellers */}
        <div className="nk-card">
          <div className="nk-card-hd"><h3>Top Sellers by Orders · {period}</h3></div>
          {isLoading ? (
            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
              {[1, 2, 3, 4, 5].map(i => <div key={i} style={{ height: 32, background: "var(--nk-bg-2)", borderRadius: 6 }} />)}
            </div>
          ) : topTenants.length === 0 ? (
            <div style={{ padding: "28px 16px", textAlign: "center", fontSize: 13, color: "var(--nk-muted)" }}>No order data yet.</div>
          ) : (
            <table className="nk-table">
              <thead>
                <tr>
                  <th style={{ width: 28 }}>#</th>
                  <th>Store</th>
                  <th className="nk-num">Orders</th>
                </tr>
              </thead>
              <tbody>
                {topTenants.map((t, idx) => (
                  <tr key={t.id ?? idx}>
                    <td style={{ fontSize: 11.5, color: "var(--nk-muted)" }}>{idx + 1}</td>
                    <td>
                      <div style={{ fontSize: 12.5, fontWeight: 500 }}>{t.name ?? "Unknown"}</div>
                      {t.slug && <div style={{ fontSize: 11, fontFamily: "monospace", color: "var(--nk-muted)" }}>{t.slug}</div>}
                    </td>
                    <td className="nk-num nk-tnum" style={{ fontSize: 13, fontWeight: 600 }}>{t.orderCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Subscription breakdown chart */}
        <div className="nk-card">
          <div className="nk-card-hd"><h3>Subscription Breakdown</h3></div>
          <div style={{ padding: "0 16px 16px" }}>
            {isLoading ? (
              <div style={{ height: 160, background: "var(--nk-bg-2)", borderRadius: 6 }} />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={barData} barSize={52}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--nk-border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--nk-muted)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "var(--nk-muted)" }} allowDecimals={false} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "var(--nk-surface)", border: "1px solid var(--nk-border)", borderRadius: 8, fontSize: 12 }}
                      cursor={{ fill: "var(--nk-bg-2)" }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="var(--nk-accent)" />
                  </BarChart>
                </ResponsiveContainer>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
                  {[
                    { label: "Basic",   value: breakdown.basic,   color: "var(--nk-accent)" },
                    { label: "Pro",     value: breakdown.pro,     color: G },
                    { label: "Active",  value: summary?.activeSubscriptions ?? 0, color: "var(--nk-fg)" },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ textAlign: "center", padding: "8px 0" }}>
                      <div className="nk-tnum" style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
                      <div style={{ fontSize: 11, color: "var(--nk-muted)", marginTop: 2 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Platform stats summary */}
      <div className="nk-card">
        <div className="nk-card-hd"><h3>Platform Stats</h3></div>
        <div style={{ padding: "4px 0 8px" }}>
          {isLoading ? (
            <div style={{ padding: "8px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
              {[1, 2, 3, 4].map(i => <div key={i} style={{ height: 28, background: "var(--nk-bg-2)", borderRadius: 6 }} />)}
            </div>
          ) : (
            [
              { label: "Total Registered Sellers", value: String(summary?.totalTenants ?? 0) },
              { label: "Active Sellers",            value: String(summary?.activeTenants ?? 0) },
              { label: "Pending Approval",          value: String(summary?.pendingApproval ?? 0) },
              { label: "Active Subscriptions",      value: String(summary?.activeSubscriptions ?? 0) },
            ].map(({ label, value }, i, arr) => (
              <div key={label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 18px",
                borderBottom: i < arr.length - 1 ? "1px solid var(--nk-border)" : undefined,
              }}>
                <span style={{ fontSize: 13, color: "var(--nk-muted)" }}>{label}</span>
                <span className="nk-tnum" style={{ fontSize: 13, fontWeight: 600 }}>{value}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
