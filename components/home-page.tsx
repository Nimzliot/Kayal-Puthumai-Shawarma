import Link from "next/link";
import { ArrowRight, Clock3, MapPin, ShieldCheck } from "lucide-react";
import { BrandingIntro } from "@/components/branding-intro";
import { CartSheet } from "@/components/cart-sheet";
import { ProductCard } from "@/components/product-card";
import { SectionTitle } from "@/components/section-title";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/types";

export function HomePage({ products }: { products: Product[] }) {
  const liveProducts = products.filter((product) => product.available);
  const featured = liveProducts.slice(0, 3);
  const bestSellers = liveProducts.slice(0, 6);

  return (
    <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-8">
      <BrandingIntro />

      <section className="mt-14 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-panel rounded-[32px] p-6 sm:p-8">
          <SectionTitle
            eyebrow="Featured"
            title="Fresh from the current menu"
            subtitle="Products shown here are loaded from the shop database."
          />
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="glass-panel rounded-[28px] p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-brand">Delivery Info</p>
            <div className="mt-4 space-y-4 text-sm text-foreground/75">
              <p>
                <MapPin className="mr-2 inline h-4 w-4 text-brand" />
                Delivery distance is calculated from the shop location to the customer
              </p>
              <p>
                <Clock3 className="mr-2 inline h-4 w-4 text-brand" />
                ETA includes kitchen prep time and travel time
              </p>
              <p>
                <ShieldCheck className="mr-2 inline h-4 w-4 text-brand" />
                Login is only required when placing an order
              </p>
            </div>
          </div>

          <div className="glass-panel rounded-[28px] p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-brand">Actions</p>
            <div className="mt-5 grid gap-3">
              <Button asChild>
                <Link href="/menu" className="flex w-full items-center justify-center gap-2">
                  Order now <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/track-order" className="flex w-full items-center justify-center">
                  Check order status
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-16">
        <SectionTitle
          eyebrow="Menu"
          title="Available items"
          subtitle="Only currently available items are shown below."
        />
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {bestSellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="mt-16 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="glass-panel rounded-[30px] p-6">
          <SectionTitle
            eyebrow="Ordering"
            title="Simple customer flow"
            subtitle="Browse the menu first, then login only when you want to place the order."
          />
        </div>
        <div className="glass-panel rounded-[30px] p-6">
          <p className="text-sm leading-7 text-foreground/75">
            Order status, account history, and admin operations will show real data as orders are created.
          </p>
        </div>
      </section>

      <div className="fixed inset-x-4 bottom-4 z-30 mx-auto max-w-xl md:hidden">
        <CartSheet />
      </div>
    </main>
  );
}
