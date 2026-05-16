"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { MarketplaceHeader } from "@/components/marketplace/MarketplaceHeader";
import { CartDrawer } from "@/components/marketplace/CartDrawer";
import { MobileTabBar } from "@/components/marketplace/MobileTabBar";

type Tab = "home" | "shop" | "search" | "cart" | "track";

function resolveActiveTab(pathname: string): Tab {
  if (pathname === "/shop") return "home";
  if (pathname.startsWith("/shop/search")) return "search";
  if (pathname.startsWith("/shop/cart")) return "cart";
  if (pathname.startsWith("/shop/track")) return "track";
  return "shop";
}

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [cartOpen, setCartOpen] = useState(false);

  const activeTab = resolveActiveTab(pathname ?? "");

  return (
    <>
      <MarketplaceHeader />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <main className="pb-14 lg:pb-0">{children}</main>
      <MobileTabBar active={activeTab} />
    </>
  );
}
