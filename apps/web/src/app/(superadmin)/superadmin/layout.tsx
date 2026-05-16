"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "../../../store/auth.store";
import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";
import { Icon, Logo, Avatar, Badge } from "@/components/nk/primitives";

const NAV_ITEMS = [
  { id: "superadmin",               href: "/superadmin",               label: "Dashboard",     icon: "home",    exact: true },
  { id: "sellers",                  href: "/superadmin/sellers",       label: "Sellers",       icon: "store",   badge: "pending" },
  { id: "plans",                    href: "/superadmin/plans",         label: "Plans",         icon: "card" },
  { id: "subscriptions",            href: "/superadmin/subscriptions", label: "Subscriptions", icon: "refresh" },
  { id: "categories",               href: "/superadmin/categories",    label: "Categories",    icon: "tag" },
  { id: "orders",                   href: "/superadmin/orders",        label: "Orders",        icon: "cart" },
  { id: "analytics",                href: "/superadmin/analytics",     label: "Analytics",     icon: "chart" },
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

  const activeId = (() => {
    for (const item of [...NAV_ITEMS].reverse()) {
      if (item.exact ? pathname === item.href : pathname.startsWith(item.href)) return item.id;
    }
    return "superadmin";
  })();

  return (
    <div className="nk-root nk-light" style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Sidebar */}
      <aside style={{ width: 232, flexShrink: 0, borderRight: "1px solid var(--nk-border)", background: "var(--nk-surface)", display: "flex", flexDirection: "column" }}>
        {/* Logo / brand */}
        <div style={{ padding: "14px 12px", borderBottom: "1px solid var(--nk-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 8px", borderRadius: "var(--nk-r-md)" }}>
            <Logo showWord={false} size="sm" />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: "-0.012em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Nepthok
              </div>
              <div className="nk-mono" style={{ fontSize: 10.5, color: "var(--nk-muted)" }}>super admin</div>
            </div>
          </div>
        </div>

        {/* Main nav */}
        <nav style={{ padding: "6px 10px", display: "flex", flexDirection: "column", gap: 1, flex: 1 }}>
          <div className="nk-eyebrow" style={{ padding: "8px 9px 6px" }}>Platform</div>
          {NAV_ITEMS.map((item) => {
            const active = activeId === item.id;
            const hasBadge = item.badge === "pending" && pendingCount > 0;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={"nk-nav-link" + (active ? " is-active" : "")}
              >
                <Icon name={item.icon} size={15} color={active ? "var(--nk-fg)" : "var(--nk-muted)"} />
                <span style={{ flex: 1 }}>{item.label}</span>
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

        {/* Bottom: user */}
        <div style={{ padding: "6px 10px 10px", borderTop: "1px solid var(--nk-border)", display: "flex", flexDirection: "column", gap: 1 }}>
          <div className="nk-eyebrow" style={{ padding: "10px 9px 6px" }}>Account</div>
          <div
            className="nk-nav-link"
            style={{ cursor: "default" }}
            onClick={logout}
          >
            <Icon name="logout" size={15} color="var(--nk-muted)" />
            <span>Sign out</span>
          </div>

          {/* User row */}
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 9, padding: "6px 4px 0" }}>
            <Avatar initials={user.name?.split(" ").map((p: string) => p[0]).join("").slice(0, 2)} size={26} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
              <div style={{ fontSize: 10.5, color: "var(--nk-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="nk-scroll" style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", minWidth: 0 }}>
        {/* Topbar */}
        <header style={{ height: 56, padding: "0 22px", borderBottom: "1px solid var(--nk-border)", background: "var(--nk-surface)", display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
          <div style={{ flex: 1 }} />
          <button type="button" className="nk-btn nk-btn-ghost nk-btn-icon">
            <Icon name="help" size={15} color="var(--nk-muted)" />
          </button>
          <button type="button" className="nk-btn nk-btn-ghost nk-btn-icon" style={{ position: "relative" }}>
            <Icon name="bell" size={15} color="var(--nk-muted)" />
          </button>
          <Avatar initials={user.name?.split(" ").map((p: string) => p[0]).join("").slice(0, 2)} size={28} />
        </header>
        <div style={{ flex: 1 }}>
          {children}
        </div>
      </main>
    </div>
  );
}
