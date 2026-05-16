"use client";

import { create } from "zustand";

export interface CartItem {
  productId: string;
  tenantId: string;
  productName: string;
  sellerName: string;
  price: number;
  qty: number;
  imageUrl?: string;
}

type CartKey = string; // `${productId}-${tenantId}`

interface CartState {
  items: Record<CartKey, CartItem>;
  hydrated: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (key: CartKey) => void;
  updateQty: (key: CartKey, qty: number) => void;
  clearCart: () => void;
  initCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

const STORAGE_KEY = "nepthok_cart";

function persist(items: Record<CartKey, CartItem>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // silently ignore storage errors (e.g. private mode quota)
  }
}

export const useCartStore = create<CartState>((set, get) => ({
  items: {},
  hydrated: false,

  addItem: (item) => {
    const key: CartKey = `${item.productId}-${item.tenantId}`;
    const existing = get().items[key];
    const updatedItems = {
      ...get().items,
      [key]: existing
        ? { ...existing, qty: existing.qty + item.qty }
        : { ...item },
    };
    persist(updatedItems);
    set({ items: updatedItems });
  },

  removeItem: (key) => {
    const updatedItems = { ...get().items };
    delete updatedItems[key];
    persist(updatedItems);
    set({ items: updatedItems });
  },

  updateQty: (key, qty) => {
    if (qty <= 0) {
      get().removeItem(key);
      return;
    }
    const existing = get().items[key];
    if (!existing) return;
    const updatedItems = {
      ...get().items,
      [key]: { ...existing, qty },
    };
    persist(updatedItems);
    set({ items: updatedItems });
  },

  clearCart: () => {
    persist({});
    set({ items: {} });
  },

  initCart: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<CartKey, CartItem>;
        set({ items: parsed, hydrated: true });
      } else {
        set({ hydrated: true });
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      set({ hydrated: true });
    }
  },

  totalItems: () => Object.values(get().items).reduce((sum, i) => sum + i.qty, 0),

  totalPrice: () =>
    Object.values(get().items).reduce((sum, i) => sum + i.price * i.qty, 0),
}));
