"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { SectionTitle } from "@/components/section-title";
import type { Product } from "@/lib/types";

const categories = [
  "All",
  "Shawarma",
  "Chicken Grill",
  "Burger",
  "Fries",
  "Rolls",
  "Beverages",
  "Combo Meals"
] as const;

export function MenuPage({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All");

  const filtered = products.filter((product) => {
    const matchesCategory = category === "All" || product.category === category;
    const text = `${product.tamilName} ${product.englishName} ${product.description}`.toLowerCase();
    return product.available && matchesCategory && text.includes(query.toLowerCase());
  });

  return (
    <main className="mx-auto max-w-7xl px-4 pb-32 pt-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
        <SectionTitle
          eyebrow="Full Menu"
          title="Browse the menu"
          subtitle="Search items, filter categories, and add products to cart."
        />
        <div className="glass-panel rounded-[28px] p-5">
          <p className="text-sm text-foreground/65">
            {filtered.length} item{filtered.length === 1 ? "" : "s"} available
            {category !== "All" ? ` in ${category}` : ""}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.28em] text-brand">
            Login starts only at checkout
          </p>
        </div>
      </div>

      <div className="mt-8 glass-panel rounded-[30px] p-4 sm:p-5">
        <div className="flex items-center gap-3 rounded-[24px] border border-border px-4 py-3">
          <Search className="h-4 w-4 text-brand" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search menu items..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-foreground/35"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((item) => (
            <button
              key={item}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                category === item
                  ? "border-brand bg-brand text-black"
                  : "border-border text-foreground/70"
              }`}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-8 glass-panel rounded-[30px] p-8 text-center">
          <p className="text-lg text-white">No matching items found</p>
          <p className="mt-2 text-sm text-foreground/65">
            Try another search term or change the category filter.
          </p>
        </div>
      )}
    </main>
  );
}
