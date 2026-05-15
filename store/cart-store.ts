"use client";

import { create } from "zustand";
import type { Product } from "@/lib/types";
import { calculateOrderPrepTime } from "@/lib/utils";

type CartItem = {
  product: Product;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  note: string;
  tipAmount: number;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  setNote: (note: string) => void;
  setTipAmount: (tipAmount: number) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  note: "",
  tipAmount: 0,
  addItem: (product) => {
    const existing = get().items.find((item) => item.product.id === product.id);
    if (existing) {
      set({
        items: get().items.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      });
      return;
    }
    set({ items: [...get().items, { product, quantity: 1 }] });
  },
  removeItem: (productId) =>
    set({
      items: get().items.filter((item) => item.product.id !== productId)
    }),
  setQuantity: (productId, quantity) =>
    set({
      items:
        quantity <= 0
          ? get().items.filter((item) => item.product.id !== productId)
          : get().items.map((item) =>
              item.product.id === productId ? { ...item, quantity } : item
            )
    }),
  setNote: (note) => set({ note }),
  setTipAmount: (tipAmount) => set({ tipAmount }),
  clearCart: () => set({ items: [], note: "", tipAmount: 0 })
}));

export function useCartSummary() {
  const { items, tipAmount } = useCartStore();
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const prepTime = calculateOrderPrepTime(
    items.map((item) => ({
      quantity: item.quantity,
      prepTime: item.product.prepTime
    }))
  );
  const eta = prepTime + 20;

  return {
    items,
    subtotal,
    prepTime,
    eta,
    tipAmount,
    total: subtotal + tipAmount
  };
}
