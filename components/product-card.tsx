"use client";

import Image from "next/image";
import { Clock3, Flame, Leaf, Drumstick } from "lucide-react";
import type { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatMinutes } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);

  return (
    <div className="glass-panel overflow-hidden rounded-[28px]">
      <div className="relative h-48">
        <Image src={product.image} alt={product.englishName} fill className="object-cover" />
      </div>
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-brand">{product.category}</p>
            <h3 className="mt-2 text-lg font-semibold text-white">{product.tamilName}</h3>
            <p className="text-sm text-foreground/70">{product.englishName}</p>
          </div>
          <span className="rounded-full border border-brand/25 px-3 py-1 text-sm text-brand">
            {formatCurrency(product.price)}
          </span>
        </div>
        <p className="text-sm leading-6 text-foreground/75">{product.description}</p>
        <div className="flex flex-wrap gap-2 text-xs text-foreground/70">
          <span className="rounded-full border border-border px-3 py-2">
            <Clock3 className="mr-1 inline h-3.5 w-3.5" /> {formatMinutes(product.prepTime)}
          </span>
          <span className="rounded-full border border-border px-3 py-2">
            <Flame className="mr-1 inline h-3.5 w-3.5" /> {product.spiceLevel}
          </span>
          <span className="rounded-full border border-border px-3 py-2">
            {product.isVeg ? (
              <Leaf className="mr-1 inline h-3.5 w-3.5 text-success" />
            ) : (
              <Drumstick className="mr-1 inline h-3.5 w-3.5 text-danger" />
            )}
            {product.isVeg ? "Veg" : "Non-Veg"}
          </span>
        </div>
        <Button className="w-full" onClick={() => addItem(product)} disabled={!product.available}>
          Add to cart
        </Button>
      </div>
    </div>
  );
}
