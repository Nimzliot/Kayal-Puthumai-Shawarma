"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useCartStore, useCartSummary } from "@/store/cart-store";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export function CartSheet() {
  const { items, total, eta } = useCartSummary();
  const { setQuantity } = useCartStore();

  return (
    <div className="glass-panel sticky bottom-4 z-20 rounded-[30px] p-4 shadow-glow md:bottom-6">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-brand">Your Cart</p>
          <p className="mt-1 text-sm text-foreground/70">
            Estimated delivery in {eta} mins
          </p>
        </div>
        <div className="rounded-full border border-brand/20 px-4 py-2 text-sm text-brand">
          {formatCurrency(total)}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-foreground/60">
          Add your first shawarma to start an order.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.product.id}
              className="flex items-center justify-between rounded-2xl border border-border px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-white">{item.product.englishName}</p>
                <p className="text-xs text-foreground/60">{formatCurrency(item.product.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="rounded-full border border-border p-2"
                  onClick={() => setQuantity(item.product.id, item.quantity - 1)}
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-6 text-center text-sm">{item.quantity}</span>
                <button
                  className="rounded-full border border-border p-2"
                  onClick={() => setQuantity(item.product.id, item.quantity + 1)}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button asChild variant="secondary">
          <Link href="/menu" className="flex w-full items-center justify-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Menu
          </Link>
        </Button>
        <Button asChild>
          <Link href="/checkout" className="flex w-full items-center justify-center">
            Checkout
          </Link>
        </Button>
      </div>
    </div>
  );
}
