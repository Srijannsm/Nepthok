"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  BarChart3,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tag,
  Settings,
  CreditCard,
  Warehouse,
  MoreHorizontal,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "../../store/auth.store";

const sidebarItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/inventory", label: "Inventory", icon: Warehouse },
  { href: "/discounts", label: "Discounts", icon: Tag },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/store-settings", label: "Store Settings", icon: Settings },
  { href: "/subscription", label: "Subscription", icon: CreditCard },
];

const bottomTabItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/store-settings", label: "Store", icon: Store },
  { href: "/analytics", label: "More", icon: MoreHorizontal },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, hydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (user && user.role !== "SELLER_ADMIN" && user.role !== "SELLER_STAFF") {
      router.replace("/");
    }
  }, [isAuthenticated, user, router, hydrated]);

  if (!hydrated || !isAuthenticated || !user) return null;

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r bg-card">
        <div className="p-6 border-b">
          <span className="text-xl font-bold text-primary">Nepthok</span>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {sidebarItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === href || pathname.startsWith(href + "/")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t text-xs text-muted-foreground truncate">
          {user.email}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        {children}
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-card flex">
        {bottomTabItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors",
              pathname === href || pathname.startsWith(href + "/")
                ? "text-primary"
                : "text-muted-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
