"use client";

import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";
import { fmtRs, Icon, AreaChart, Badge } from "@/components/nk/primitives";

interface AccessCheck { hasAccess: boolean; }

interface DashboardData {
  summary: { totalOrders: number; totalRevenue: number; averageOrderValue: number; totalProductViews?: number };
  lowStockProducts: { id: string; name: string; stock: number; lowStockThreshold: number }[];
  topProducts?: { id: string; name: string; price: number; sold30?: number }[];
  trend?: number[];
  snapshots?: { date: string; orders: number; revenue: number }[];
}

export default function AnalyticsPage() {
  const { data: access, isLoading: accessLoading } = useQuery<AccessCheck>({
    queryKey: ["access", "analytics"],
    queryFn: () => get<AccessCheck>("/subscriptions/check-access?feature=analytics"),
  });

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["analytics", "detail"],
    queryFn: () => get<DashboardData>("/analytics/dashboard?period=30d"),
    enabled: !!access?.hasAccess,
  });

  if (accessLoading) {
    return (
      <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ height: 28, width: 160, background: "var(--nk-bg-2)", borderRadius: 6 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {[1, 2, 3, 4].map((i) => <div key={i} style={{ height: 90, background: "var(--nk-bg-2)", borderRadius: 8 }} />)}
        </div>
      </div>
    );
  }

  if (!access?.hasAccess) {
    return (
      <div style={{ padding: 22 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.018em", margin: "0 0 16px" }}>Analytics</h1>
        <div className="nk-card" style={{ padding: "48px 24px", textAlign: "center" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--nk-bg-2)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <Icon name="lock" size={20} color="var(--nk-muted)" />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>PRO Feature</div>
          <div style={{ fontSize: 13, color: "var(--nk-muted)", maxWidth: 360, margin: "0 auto 18px" }}>
            Detailed analytics are available on the PRO plan. Upgrade to unlock insights about your store.
          </div>
          <a href="/subscription" className="nk-btn nk-btn-primary" style={{ display: "inline-flex" }}>
            Upgrade to PRO <Icon name="arrowRight" size={13} />
          </a>
        </div>
      </div>
    );
  }

  const summary   = data?.summary;
  const snapshots = data?.snapshots ?? [];
  const lowStock  = data?.lowStockProducts ?? [];
  const top       = data?.topProducts ?? [];
  const trend     = data?.trend ?? snapshots.map((s) => s.revenue);

  const labels = snapshots.map((s) =>
    new Date(s.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
  );

  const kpis = [
    { label: "Revenue · 30d",    value: fmtRs(summary?.totalRevenue ?? 0) },
    { label: "Orders · 30d",     value: String(summary?.totalOrders ?? 0) },
    { label: "Avg order value",  value: fmtRs(summary?.averageOrderValue ?? 0) },
    { label: "Product views",    value: String(summary?.totalProductViews ?? 0) },
  ];

  return (
    <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 18 }}>

      <div>
        <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.018em", margin: 0 }}>Analytics</h1>
        <div style={{ fontSize: 12.5, color: "var(--nk-muted)", marginTop: 3 }}>Store performance · last 30 days</div>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {kpis.map((k) => (
          <div key={k.label} className="nk-card" style={{ padding: 18 }}>
            <div className="nk-eyebrow" style={{ marginBottom: 10 }}>{k.label}</div>
            <div className="nk-tnum" style={{ fontSize: 22, fontWeight: 600 }}>{isLoading ? "—" : k.value}</div>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      {trend.length > 1 ? (
        <div className="nk-card" style={{ padding: 18 }}>
          <div className="nk-card-hd" style={{ marginBottom: 14 }}>
            <h3>Revenue trend</h3>
          </div>
          <AreaChart
            data={trend}
            height={200}
            labels={labels}
            yFormat={(v) => v === 0 ? "" : `${Math.round(v / 1000)}k`}
          />
        </div>
      ) : !isLoading && (
        <div className="nk-card" style={{ padding: "32px 24px", textAlign: "center", fontSize: 13, color: "var(--nk-muted)" }}>
          Not enough data to display charts yet. Orders will populate graphs over time.
        </div>
      )}

      {/* Bottom row: top products + low stock */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>

        {/* Top products */}
        <div className="nk-card">
          <div className="nk-card-hd"><h3>Top products · 30d</h3></div>
          {top.length === 0 ? (
            <div style={{ padding: "20px 16px", fontSize: 13, color: "var(--nk-muted)" }}>No sales data yet.</div>
          ) : (
            <table className="nk-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="nk-num" style={{ width: 70 }}>Sold</th>
                  <th className="nk-num" style={{ width: 110 }}>Price</th>
                </tr>
              </thead>
              <tbody>
                {top.slice(0, 8).map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontSize: 12.5, fontWeight: 500, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</td>
                    <td className="nk-num nk-tnum" style={{ fontSize: 12 }}>{p.sold30 ?? "—"}</td>
                    <td className="nk-num nk-tnum" style={{ fontSize: 12 }}>{fmtRs(p.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Low stock */}
        <div className="nk-card">
          <div className="nk-card-hd">
            <h3>Low stock alerts</h3>
            {lowStock.length > 0 && <Badge tone="warn">{lowStock.length}</Badge>}
          </div>
          {lowStock.length === 0 ? (
            <div style={{ padding: "20px 16px", fontSize: 13, color: "var(--nk-muted)" }}>All products well-stocked.</div>
          ) : (
            <table className="nk-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="nk-num" style={{ width: 70 }}>Stock</th>
                  <th className="nk-num" style={{ width: 90 }}>Threshold</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontSize: 12.5, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</td>
                    <td className="nk-num nk-tnum" style={{ fontSize: 12, color: p.stock === 0 ? "var(--nk-danger)" : "var(--nk-warning)", fontWeight: 600 }}>{p.stock}</td>
                    <td className="nk-num nk-tnum" style={{ fontSize: 12, color: "var(--nk-muted)" }}>{p.lowStockThreshold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
