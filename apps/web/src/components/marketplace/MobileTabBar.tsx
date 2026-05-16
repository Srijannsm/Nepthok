"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cart.store";

type Tab = "home" | "shop" | "search" | "cart" | "track";

interface MobileTabBarProps {
  active: Tab;
}

const tabs: { id: Tab; label: string; icon: string; href: string }[] = [
  { id: "home", label: "Home", icon: "⌂", href: "/shop" },
  { id: "shop", label: "Shop", icon: "▦", href: "/shop/categories/cases" },
  { id: "search", label: "Search", icon: "⌕", href: "/shop/search" },
  { id: "cart", label: "Cart", icon: "🛒", href: "/shop/cart" },
  { id: "track", label: "Track", icon: "⌖", href: "/shop/track" },
];

export function MobileTabBar({ active }: MobileTabBarProps) {
  const totalItems = useCartStore((s) => s.totalItems());

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 block lg:hidden bg-white border-t border-gray-200">
      <div className="flex items-stretch h-14">
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs transition-colors duration-150 ${
                isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <span className="relative text-lg leading-none">
                {tab.icon}
                {tab.id === "cart" && totalItems > 0 && (
                  <span className="absolute -top-1 -right-2 bg-blue-600 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full leading-none">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </span>
              <span className="font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
