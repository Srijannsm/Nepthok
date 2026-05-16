"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "../../store/auth.store";
import { Icon, Logo, Avatar, Badge } from "../../components/nk/primitives";

const NAV_ITEMS = [
  { id: "dashboard",     href: "/dashboard",     label: "Dashboard",     icon: "home" },
  { id: "orders",        href: "/orders",        label: "Orders",        icon: "cart" },
  { id: "products",      href: "/products",      label: "Products",      icon: "pkg" },
  { id: "inventory",     href: "/inventory",     label: "Inventory",     icon: "warehouse" },
  { id: "analytics",     href: "/analytics",     label: "Analytics",     icon: "chart" },
  { id: "discounts",     href: "/discounts",     label: "Discounts",     icon: "tag" },
  { id: "messages",      href: "/messages",      label: "Messages",      icon: "msg" },
];

const SETTINGS_ITEMS = [
  { id: "store-settings", href: "/store-settings", label: "Store settings", icon: "store" },
  { id: "subscription",   href: "/subscription",   label: "Subscription",   icon: "card" },
  { id: "settings",       href: "/settings",       label: "Settings",       icon: "settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, hydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) { router.replace("/login"); return; }
    const allowed = ["SUPER_ADMIN", "SELLER_ADMIN", "SELLER_STAFF"];
    if (user && !allowed.includes(user.role)) router.replace("/");
  }, [isAuthenticated, user, router, hydrated]);

  if (!hydrated || !isAuthenticated || !user) return null;

  const active = pathname.replace(/^\//, "").split("/")[0] || "dashboard";

  return (
    <div className="nk-root nk-light" style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Sidebar */}
      <aside style={{ width: 232, flexShrink: 0, borderRight: "1px solid var(--nk-border)", background: "var(--nk-surface)", display: "flex", flexDirection: "column" }}>
        {/* Logo / store */}
        <div style={{ padding: "14px 12px", borderBottom: "1px solid var(--nk-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 8px", borderRadius: "var(--nk-r-md)" }}>
            <Logo showWord={false} size="sm" />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: "-0.012em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.name}
              </div>
              <div className="nk-mono" style={{ fontSize: 10.5, color: "var(--nk-muted)" }}>nepthok seller</div>
            </div>
          </div>
        </div>

        {/* Main nav */}
        <nav style={{ padding: "6px 10px", display: "flex", flexDirection: "column", gap: 1, flex: 1 }}>
          <div className="nk-eyebrow" style={{ padding: "8px 9px 6px" }}>Workspace</div>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={"nk-nav-link" + (active === item.id ? " is-active" : "")}
            >
              <Icon name={item.icon} size={15} color={active === item.id ? "var(--nk-fg)" : "var(--nk-muted)"} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom: settings + user */}
        <div style={{ padding: "6px 10px 10px", borderTop: "1px solid var(--nk-border)", display: "flex", flexDirection: "column", gap: 1 }}>
          <div className="nk-eyebrow" style={{ padding: "10px 9px 6px" }}>Account</div>
          {SETTINGS_ITEMS.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={"nk-nav-link" + (active === item.id ? " is-active" : "")}
            >
              <Icon name={item.icon} size={15} color={active === item.id ? "var(--nk-fg)" : "var(--nk-muted)"} />
              <span>{item.label}</span>
            </Link>
          ))}

          {/* User row */}
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 9, padding: "6px 4px 0" }}>
            <Avatar initials={user.name?.split(" ").map(p => p[0]).join("").slice(0, 2)} size={26} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
              <div style={{ fontSize: 10.5, color: "var(--nk-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
            </div>
            <button
              type="button"
              className="nk-btn nk-btn-ghost nk-btn-icon"
              style={{ height: 26, width: 26 }}
              onClick={() => useAuthStore.getState().logout()}
            >
              <Icon name="logout" size={13} color="var(--nk-muted)" />
            </button>
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
          <Avatar initials={user.name?.split(" ").map(p => p[0]).join("").slice(0, 2)} size={28} />
        </header>
        <div style={{ flex: 1 }}>
          {children}
        </div>
      </main>
    </div>
  );
}
