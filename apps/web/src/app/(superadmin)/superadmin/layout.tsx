"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  BarChart3, CreditCard, LayoutDashboard,
  LogOut, RefreshCw, ShoppingBag, Store, Tag,
} from "lucide-react";
import { useAuthStore } from "../../../store/auth.store";
import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";

const SB = {
  bg:            "#0f1419",
  border:        "rgba(255,255,255,0.07)",
  muted:         "rgba(255,255,255,0.40)",
  normal:        "rgba(255,255,255,0.68)",
  activeText:    "#ffffff",
  activeBg:      "rgba(34,197,94,0.13)",
  activeBorder:  "#22c55e",
  brandGreen:    "#16a34a",
  labelGreen:    "#4ade80",
};

const NAV = [
  { href: "/superadmin",               label: "Dashboard",     icon: LayoutDashboard, exact: true },
  { href: "/superadmin/sellers",       label: "Sellers",       icon: Store,           badge: "pending" },
  { href: "/superadmin/plans",         label: "Plans",         icon: CreditCard },
  { href: "/superadmin/subscriptions", label: "Subscriptions", icon: RefreshCw },
  { href: "/superadmin/categories",    label: "Categories",    icon: Tag },
  { href: "/superadmin/orders",        label: "Orders",        icon: ShoppingBag },
  { href: "/superadmin/analytics",     label: "Analytics",     icon: BarChart3 },
];

interface PlatformData { summary: { pendingApproval: number } }

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, hydrated, logout } = useAuthStore();
  const router   = useRouter();
  const pathname = usePathname();

  const { data } = useQuery<PlatformData>({
    queryKey: ["superadmin", "platform"],
    queryFn: () => get<PlatformData>("/analytics/platform?period=30d"),
    enabled: !!(hydrated && isAuthenticated && user?.role === "SUPER_ADMIN"),
    staleTime: 60_000,
  });
  const pendingCount = data?.summary?.pendingApproval ?? 0;

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) { router.replace("/login"); return; }
    if (user?.role !== "SUPER_ADMIN") router.replace("/");
  }, [isAuthenticated, user, router, hydrated]);

  if (!hydrated || !isAuthenticated || !user) return null;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--nk-bg)" }}>
      {/* ── Dark sidebar ── */}
      <aside style={{
        width: 220, flexShrink: 0, display: "flex", flexDirection: "column",
        background: SB.bg, borderRight: `1px solid ${SB.border}`,
      }}>
        {/* Brand */}
        <div style={{ padding: "18px 16px 16px", borderBottom: `1px solid ${SB.border}`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9, background: SB.brandGreen, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 17, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.12) inset",
          }}>N</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.022em", color: "#fff", lineHeight: 1.1 }}>Nepthok</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: SB.labelGreen, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 3 }}>Super Admin</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "10px 8px", display: "flex", flexDirection: "column", gap: 1, overflowY: "auto" }}>
          {NAV.map(({ href, label, icon: Icon, exact, badge }) => {
            const active = exact ? pathname === href : (pathname === href || pathname.startsWith(href + "/"));
            const hasBadge = badge === "pending" && pendingCount > 0;
            return (
              <Link key={href} href={href} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "7px 10px 7px 9px", borderRadius: 6,
                fontSize: 13, fontWeight: active ? 600 : 400,
                color: active ? SB.activeText : SB.normal,
                background: active ? SB.activeBg : "transparent",
                borderLeft: `2px solid ${active ? SB.activeBorder : "transparent"}`,
                textDecoration: "none", transition: "background 0.1s, color 0.1s",
              }}>
                <Icon size={14} strokeWidth={active ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{label}</span>
                {hasBadge && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, lineHeight: 1,
                    background: "#ef4444", color: "#fff", borderRadius: 999,
                    padding: "2px 5px", minWidth: 18, textAlign: "center",
                  }}>{pendingCount}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: "10px 14px 14px", borderTop: `1px solid ${SB.border}` }}>
          <div style={{ fontSize: 11.5, color: SB.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 8 }}>
            {user.email}
          </div>
          <button
            onClick={logout}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "5px 6px",
              background: "transparent", border: "none", cursor: "pointer", borderRadius: 5,
              fontSize: 12, color: SB.muted, width: "100%", textAlign: "left",
              transition: "color 0.1s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
            onMouseLeave={e => (e.currentTarget.style.color = SB.muted)}
          >
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: "auto", background: "var(--nk-bg)" }}>
        {children}
      </main>
    </div>
  );
}
