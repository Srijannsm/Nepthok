"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  BarChart3,
  CreditCard,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  ShoppingBag,
  Store,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "../../../store/auth.store";

const sidebarItems = [
  { href: "/superadmin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/superadmin/sellers", label: "Sellers", icon: Store },
  { href: "/superadmin/plans", label: "Plans", icon: CreditCard },
  { href: "/superadmin/subscriptions", label: "Subscriptions", icon: RefreshCw },
  { href: "/superadmin/categories", label: "Categories", icon: Tag },
  { href: "/superadmin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/superadmin/analytics", label: "Analytics", icon: BarChart3 },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, hydrated, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (user && user.role !== "SUPER_ADMIN") {
      router.replace("/");
    }
  }, [isAuthenticated, user, router, hydrated]);

  if (!hydrated || !isAuthenticated || !user) return null;

  return (
    <div className="flex h-screen bg-background">
      <aside className="flex w-60 flex-col border-r bg-card flex-shrink-0">
        <div className="p-5 border-b flex items-center gap-2">
          <span className="text-xl font-bold text-primary">Nepthok</span>
          <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded px-1.5 py-0.5">
            Super Admin
          </span>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {sidebarItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === href || (href !== "/superadmin" && pathname.startsWith(href))
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t space-y-2">
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          <Button
            size="sm"
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
