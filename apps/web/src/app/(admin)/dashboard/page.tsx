"use client";

import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";
import { formatNPR } from "@/lib/utils";
import { useAuthStore } from "../../../store/auth.store";
import { Icon, Avatar, Badge, StatusBadge, Sparkline, AreaChart, fmtRs } from "../../../components/nk/primitives";

// ── Types ─────────────────────────────────────────────────────────────────────
interface TrendPoint {
  date: string;
  totalRevenue: number;
  totalOrders: number;
}

interface DashboardData {
  summary: { totalOrders: number; totalRevenue: number; averageOrderValue: number; totalProductViews: number };
  recentOrders: { id: string; orderNumber: string; buyerName: string; total: string; status: string; createdAt: string; paymentMethod?: string }[];
  lowStockProducts: { id: string; name: string; sku?: string; stock: number; lowStockThreshold: number }[];
  topProducts?: { productId: string; productName: string; orderCount: number; totalQuantity: number }[];
  trend: TrendPoint[];
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PendingActionRow({ icon, tone, label, hint, count }: { icon: string; tone: string; label: string; hint: string; count: number }) {
  return (
    <div className="nk-row" style={{ display: "grid", gridTemplateColumns: "28px 1fr auto", gap: 12, alignItems: "center", padding: "11px 16px", cursor: "pointer" }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: `var(--nk-${tone}-soft)`, color: `var(--nk-${tone})`, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={14} />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 11.5, color: "var(--nk-muted)", marginTop: 1 }}>{hint}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="nk-tnum" style={{ fontSize: 14, fontWeight: 600 }}>{count}</span>
        <Icon name="chevRight" size={14} color="var(--nk-muted-2)" />
      </div>
    </div>
  );
}

// ── Seller Dashboard (Variant C) ──────────────────────────────────────────────
function SellerDashboard({ userName }: { userName: string }) {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["analytics", "dashboard"],
    queryFn: () => get<DashboardData>("/analytics/dashboard?period=30d"),
  });

  const summary = data?.summary;
  const recentOrders = data?.recentOrders ?? [];
  const lowStock = data?.lowStockProducts ?? [];
  const trendNumbers = (data?.trend ?? []).map((t) => Number(t.totalRevenue));
  const trendLabels = (data?.trend ?? []).map((t) =>
    new Date(t.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
  );

  const payBreakdown = [
    { method: "eSewa",  pct: 46, tone: "#16a34a" },
    { method: "Khalti", pct: 36, tone: "#6d28d9" },
    { method: "COD",    pct: 18, tone: "#737373" },
  ];

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) + " NPT";

  return (
    <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 18 }}>

      {/* Today hero band */}
      <div className="nk-card" style={{ overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr", minHeight: 160 }}>
          {/* Col 1: today revenue */}
          <div style={{ padding: 22, borderRight: "1px solid var(--nk-border)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--nk-success)", boxShadow: "0 0 0 4px var(--nk-success-soft)" }} />
              <div className="nk-eyebrow">Today · {timeStr}</div>
            </div>
            <div>
              {isLoading ? (
                <div style={{ height: 36, background: "var(--nk-bg-2)", borderRadius: 6, width: 160 }} />
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                    <span className="nk-tnum" style={{ fontSize: 36, fontWeight: 600, letterSpacing: "-0.028em", lineHeight: 1 }}>
                      {fmtRs(summary?.totalRevenue ?? 0)}
                    </span>
                    <Badge tone="success" dot>last 30d</Badge>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12.5, color: "var(--nk-muted)" }}>
                    <span className="nk-tnum" style={{ color: "var(--nk-fg)", fontWeight: 500 }}>{summary?.totalOrders ?? 0} orders</span>
                    {" · "}avg {fmtRs(summary?.averageOrderValue ?? 0)}
                  </div>
                </>
              )}
            </div>
            <div style={{ display: "flex", gap: 3, padding: 3, alignSelf: "flex-start", background: "var(--nk-bg-2)", borderRadius: "var(--nk-r-md)", border: "1px solid var(--nk-border)" }}>
              {["Today", "7d", "30d", "90d"].map((r, i) => (
                <button key={r} className="nk-btn" style={{ height: 24, fontSize: 11.5, padding: "0 10px", background: i === 0 ? "var(--nk-surface)" : "transparent", color: i === 0 ? "var(--nk-fg)" : "var(--nk-muted)", boxShadow: i === 0 ? "var(--nk-shadow-sm)" : "none" }}>{r}</button>
              ))}
            </div>
          </div>

          {/* Col 2: trend chart */}
          <div style={{ borderRight: "1px solid var(--nk-border)", padding: "14px 6px 14px 18px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div className="nk-eyebrow">Revenue trend</div>
            {trendNumbers.length === 0 ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, color: "var(--nk-muted)", height: 110 }}>
                Not enough data yet
              </div>
            ) : (
              <AreaChart data={trendNumbers} labels={trendLabels} height={110} yFormat={() => ""} />
            )}
          </div>

          {/* Col 3: payment breakdown */}
          <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="nk-eyebrow">Payments · 30d</div>
            {payBreakdown.map((p) => (
              <div key={p.method}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 500 }}>{p.method}</span>
                  <span className="nk-tnum" style={{ fontSize: 12, color: "var(--nk-muted)" }}>{p.pct}%</span>
                </div>
                <div className="nk-progress" style={{ height: 4 }}>
                  <div style={{ width: p.pct + "%", background: p.tone }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two columns: activity + widgets */}
      <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 18 }}>

        {/* Left: low stock + recent orders */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Activity / low stock feed */}
          <div className="nk-card">
            <div className="nk-card-hd">
              <h3>Low stock alerts</h3>
              <Badge tone="warn">{lowStock.length}</Badge>
            </div>
            {lowStock.length === 0 ? (
              <div style={{ padding: "20px 16px", fontSize: 13, color: "var(--nk-muted)" }}>All products well-stocked.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {lowStock.slice(0, 5).map((p, i) => (
                  <div key={p.id} className="nk-row" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 80px 70px", gap: 12, alignItems: "center", padding: "10px 16px", borderTop: i === 0 ? 0 : "1px solid var(--nk-border)" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                      {p.sku && <div className="nk-mono" style={{ fontSize: 10.5, color: "var(--nk-muted)" }}>{p.sku}</div>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.stock === 0 ? "var(--nk-danger)" : "var(--nk-warning)" }} />
                      <span className="nk-tnum" style={{ fontSize: 12, fontWeight: 500, color: p.stock === 0 ? "var(--nk-danger)" : "var(--nk-warning)" }}>{p.stock} left</span>
                    </div>
                    <button className="nk-btn nk-btn-secondary nk-btn-sm" style={{ height: 24, fontSize: 11, padding: "0 8px" }}>Restock</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent orders */}
          <div className="nk-card">
            <div className="nk-card-hd">
              <h3>Recent orders</h3>
              <a href="/orders" style={{ fontSize: 11.5, color: "var(--nk-accent)", textDecoration: "none", fontWeight: 500 }}>All orders →</a>
            </div>
            {isLoading ? (
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                {[1, 2, 3].map(i => <div key={i} style={{ height: 38, background: "var(--nk-bg-2)", borderRadius: 6 }} />)}
              </div>
            ) : recentOrders.length === 0 ? (
              <div style={{ padding: "20px 16px", fontSize: 13, color: "var(--nk-muted)" }}>No orders yet.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="nk-table">
                  <thead>
                    <tr>
                      <th style={{ width: 100 }}>Order</th>
                      <th>Customer</th>
                      <th>Status</th>
                      <th className="nk-num">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.slice(0, 6).map((o) => (
                      <tr key={o.id} className="nk-clickable">
                        <td className="nk-mono" style={{ fontSize: 12, color: "var(--nk-muted)" }}>{o.orderNumber}</td>
                        <td style={{ fontSize: 12.5, fontWeight: 500 }}>{o.buyerName}</td>
                        <td><StatusBadge status={o.status} /></td>
                        <td className="nk-num nk-tnum" style={{ fontWeight: 500 }}>{fmtRs(Number(o.total))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: stacked widgets */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Mini KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="nk-card" style={{ padding: 16 }}>
              <div className="nk-eyebrow" style={{ marginBottom: 8 }}>Orders · 30d</div>
              <div className="nk-tnum" style={{ fontSize: 22, fontWeight: 600 }}>{isLoading ? "—" : summary?.totalOrders ?? 0}</div>
              <div style={{ marginTop: 4, fontSize: 11.5, color: "var(--nk-muted)" }}>total placed</div>
            </div>
            <div className="nk-card" style={{ padding: 16 }}>
              <div className="nk-eyebrow" style={{ marginBottom: 8 }}>Avg order</div>
              <div className="nk-tnum" style={{ fontSize: 22, fontWeight: 600 }}>{isLoading ? "—" : fmtRs(summary?.averageOrderValue ?? 0)}</div>
              <div style={{ marginTop: 4, fontSize: 11.5, color: "var(--nk-muted)" }}>last 30 days</div>
            </div>
          </div>

          {/* Needs attention */}
          <div className="nk-card">
            <div className="nk-card-hd">
              <h3>Needs attention</h3>
              <Badge tone="warn">—</Badge>
            </div>
            <PendingActionRow icon="cart"    tone="warning" label="Orders to fulfill"       hint="Check pending queue"      count={recentOrders.filter(o => o.status === "PENDING").length} />
            <PendingActionRow icon="alert"   tone="warning" label="Low stock items"         hint="Below reorder threshold"  count={lowStock.length} />
            <PendingActionRow icon="refresh" tone="info"    label="Processing orders"       hint="In progress"              count={recentOrders.filter(o => o.status === "PROCESSING").length} />
          </div>

          {/* PRO insight card */}
          <div className="nk-card" style={{ background: "var(--nk-fg)", color: "var(--nk-bg)", border: "1px solid transparent", overflow: "hidden", position: "relative" }}>
            <div style={{ padding: 18 }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)", marginBottom: 8 }}>PRO insight</div>
              <div style={{ fontSize: 14, lineHeight: 1.45, maxWidth: 360, color: "#fff" }}>
                Keep your best-sellers stocked — they drive repeat purchases and higher average order values.
              </div>
              <a href="/analytics" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 14, height: 30, padding: "0 12px", background: "var(--nk-bg)", color: "var(--nk-fg)", borderRadius: "var(--nk-r-md)", fontSize: 12, fontWeight: 500, textDecoration: "none" }}>
                View analytics <Icon name="arrowRight" size={12} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Platform (SUPER_ADMIN) view — keep simple ─────────────────────────────────
function PlatformDashboard() {
  const { data, isLoading } = useQuery<{ summary: { totalTenants: number; activeSubscriptions: number; totalOrders: number; monthlyRecurringRevenue: number; pendingApproval: number } }>({
    queryKey: ["analytics", "platform"],
    queryFn: () => get("/analytics/platform?period=30d"),
  });
  const s = data?.summary;
  return (
    <div style={{ padding: 22 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.018em", margin: "0 0 6px" }}>Platform Overview</h1>
      <p style={{ fontSize: 13, color: "var(--nk-muted)", marginBottom: 22 }}>All stores · last 30 days</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {[
          { label: "Total Sellers",   value: String(s?.totalTenants ?? 0) },
          { label: "Active Subs",     value: String(s?.activeSubscriptions ?? 0) },
          { label: "Total Orders",    value: String(s?.totalOrders ?? 0) },
          { label: "MRR",             value: fmtRs(s?.monthlyRecurringRevenue ?? 0) },
        ].map((k) => (
          <div key={k.label} className="nk-card" style={{ padding: 18 }}>
            <div className="nk-eyebrow" style={{ marginBottom: 10 }}>{k.label}</div>
            <div className="nk-tnum" style={{ fontSize: 22, fontWeight: 600 }}>{isLoading ? "—" : k.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  if (user?.role === "SUPER_ADMIN") return <PlatformDashboard />;
  return <SellerDashboard userName={user?.name ?? "Seller"} />;
}
