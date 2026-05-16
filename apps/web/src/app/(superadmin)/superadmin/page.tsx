"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Store } from "lucide-react";
import { toast } from "sonner";
import { get, patch } from "@/lib/api";
import { fmtRs } from "@/components/nk/primitives";
import { formatDate } from "@/lib/utils";

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
interface RecentTenant { id: string; name: string; slug: string; status: string; createdAt: string }
interface PendingTenant { id: string; name: string; slug: string; createdAt: string; owner?: { email: string } }
interface PlatformData {
  summary: PlatformSummary;
  recentTenants: RecentTenant[];
  pendingTenants?: PendingTenant[];
  subscriptionBreakdown: { basic: number; pro: number };
}

function KPI({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="nk-card" style={{ padding: 18 }}>
      <div className="nk-eyebrow" style={{ marginBottom: 10 }}>{label}</div>
      <div className="nk-tnum" style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.022em", color: accent ? G : "var(--nk-fg)" }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: "var(--nk-muted)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function SuperAdminDashboard() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<PlatformData>({
    queryKey: ["superadmin", "platform"],
    queryFn: () => get<PlatformData>("/analytics/platform?period=30d"),
  });

  const { data: pendingData, isLoading: pendingLoading } = useQuery<{ items: PendingTenant[]; total: number }>({
    queryKey: ["superadmin", "sellers", "", "PENDING", 1],
    queryFn: () => get("/tenants?page=1&limit=10&status=PENDING"),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => patch(`/tenants/${id}/approve`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["superadmin"] });
      toast.success("Seller approved");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed"),
  });

  const summary   = data?.summary;
  const recent    = data?.recentTenants ?? [];
  const breakdown = data?.subscriptionBreakdown ?? { basic: 0, pro: 0 };
  const pending   = pendingData?.items ?? [];
  const pendingCount = summary?.pendingApproval ?? 0;
  const totalSubs = breakdown.basic + breakdown.pro || 1;

  const kpis = [
    { label: "Total Sellers",     value: isLoading ? "—" : String(summary?.totalTenants ?? 0) },
    { label: "Active Sellers",    value: isLoading ? "—" : String(summary?.activeTenants ?? 0) },
    { label: "MRR",               value: isLoading ? "—" : fmtRs(summary?.monthlyRecurringRevenue ?? 0) },
    { label: "Total Revenue · 30d", value: isLoading ? "—" : fmtRs(summary?.totalRevenue ?? 0) },
    { label: "Total Orders · 30d", value: isLoading ? "—" : String(summary?.totalOrders ?? 0) },
    { label: "Active Subscriptions", value: isLoading ? "—" : String(summary?.activeSubscriptions ?? 0) },
  ];

  return (
    <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.018em", margin: 0, color: "var(--nk-fg)" }}>Platform Overview</h1>
          <div style={{ fontSize: 12.5, color: "var(--nk-muted)", marginTop: 3 }}>All stores · last 30 days</div>
        </div>
      </div>

      {/* Pending approval alert */}
      {pendingCount > 0 && !isLoading && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
          background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.28)",
          borderLeft: "3px solid #eab308", borderRadius: 8,
        }}>
          <AlertTriangle size={15} color="#ca8a04" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "var(--nk-fg)", flex: 1 }}>
            <strong>{pendingCount}</strong> seller{pendingCount !== 1 ? "s" : ""} awaiting approval
          </span>
          <Link href="/superadmin/sellers" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#ca8a04", textDecoration: "none" }}>
            Review all <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* KPI grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
        {kpis.map((k) => <KPI key={k.label} {...k} />)}
      </div>

      {/* Middle row — pending sellers + subscription breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18 }}>

        {/* Pending sellers */}
        <div className="nk-card">
          <div className="nk-card-hd">
            <h3>Pending Approval</h3>
            {pendingCount > 0 && (
              <Link href="/superadmin/sellers" style={{ fontSize: 12, color: G, textDecoration: "none", fontWeight: 500 }}>
                View all →
              </Link>
            )}
          </div>
          {pendingLoading ? (
            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
              {[1, 2, 3].map(i => <div key={i} style={{ height: 36, background: "var(--nk-bg-2)", borderRadius: 6 }} />)}
            </div>
          ) : pending.length === 0 ? (
            <div style={{ padding: "28px 16px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <CheckCircle2 size={22} color={G} />
              <span style={{ fontSize: 13, color: "var(--nk-muted)" }}>No pending approvals — all clear.</span>
            </div>
          ) : (
            <table className="nk-table">
              <thead>
                <tr>
                  <th>Store</th>
                  <th>Owner Email</th>
                  <th>Joined</th>
                  <th style={{ width: 80 }}></th>
                </tr>
              </thead>
              <tbody>
                {pending.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontSize: 12.5, fontWeight: 600 }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: "var(--nk-muted)", fontFamily: "monospace" }}>{t.slug}</div>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--nk-muted)" }}>{t.owner?.email ?? "—"}</td>
                    <td style={{ fontSize: 11.5, color: "var(--nk-muted)" }}>{formatDate(t.createdAt)}</td>
                    <td>
                      <button
                        className="nk-btn nk-btn-primary"
                        style={{ padding: "3px 10px", fontSize: 11.5, background: G, borderColor: G }}
                        disabled={approveMutation.isPending}
                        onClick={() => approveMutation.mutate(t.id)}
                      >
                        Approve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Subscription breakdown */}
        <div className="nk-card">
          <div className="nk-card-hd"><h3>Subscription Breakdown</h3></div>
          <div style={{ padding: "6px 16px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Basic */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12.5, fontWeight: 500 }}>Basic</span>
                <span className="nk-tnum" style={{ fontSize: 12.5, color: "var(--nk-muted)" }}>{breakdown.basic}</span>
              </div>
              <div style={{ height: 5, background: "var(--nk-bg-2)", borderRadius: 999 }}>
                <div style={{ height: "100%", width: `${(breakdown.basic / totalSubs) * 100}%`, background: "var(--nk-accent)", borderRadius: 999 }} />
              </div>
            </div>
            {/* Pro */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12.5, fontWeight: 500 }}>Pro</span>
                <span className="nk-tnum" style={{ fontSize: 12.5, color: "var(--nk-muted)" }}>{breakdown.pro}</span>
              </div>
              <div style={{ height: 5, background: "var(--nk-bg-2)", borderRadius: 999 }}>
                <div style={{ height: "100%", width: `${(breakdown.pro / totalSubs) * 100}%`, background: G, borderRadius: 999 }} />
              </div>
            </div>
            {/* Totals */}
            <div style={{ borderTop: "1px solid var(--nk-border)", paddingTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "Total Active", value: String(summary?.activeSubscriptions ?? 0) },
                { label: "Pending", value: String(pendingCount) },
              ].map(({ label, value }) => (
                <div key={label} className="nk-card" style={{ padding: "10px 14px", background: "var(--nk-bg)" }}>
                  <div style={{ fontSize: 10.5, color: "var(--nk-muted)", marginBottom: 3 }}>{label}</div>
                  <div className="nk-tnum" style={{ fontSize: 18, fontWeight: 600 }}>{isLoading ? "—" : value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent stores */}
      <div className="nk-card">
        <div className="nk-card-hd">
          <h3>Recently Joined Stores</h3>
          <Link href="/superadmin/sellers" style={{ fontSize: 12, color: "var(--nk-muted)", textDecoration: "none" }}>View all →</Link>
        </div>
        {isLoading ? (
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
            {[1, 2, 3, 4].map(i => <div key={i} style={{ height: 32, background: "var(--nk-bg-2)", borderRadius: 6 }} />)}
          </div>
        ) : recent.length === 0 ? (
          <div style={{ padding: "24px 16px", textAlign: "center", fontSize: 13, color: "var(--nk-muted)" }}>
            <Store size={22} style={{ marginBottom: 8, opacity: 0.4, display: "block", margin: "0 auto 8px" }} />
            No stores yet.
          </div>
        ) : (
          <table className="nk-table">
            <thead>
              <tr>
                <th>Store</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((t) => {
                const statusColor = t.status === "ACTIVE" ? "var(--nk-success)" : t.status === "PENDING" ? "#ca8a04" : "var(--nk-muted)";
                return (
                  <tr key={t.id}>
                    <td style={{ fontSize: 12.5, fontWeight: 600 }}>{t.name}</td>
                    <td style={{ fontSize: 11.5, fontFamily: "monospace", color: "var(--nk-muted)" }}>{t.slug}</td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 999,
                        background: `${statusColor}18`, color: statusColor,
                      }}>{t.status}</span>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--nk-muted)" }}>{formatDate(t.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
