"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardList, Home, MenuSquare, ShoppingCart, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useCartStore } from "@/store/cart-store";
import { cn } from "@/lib/utils";

type MobileProfile = {
  name: string;
  role: "customer" | "admin";
} | null;

export function MobileNav() {
  const pathname = usePathname();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const [profile, setProfile] = useState<MobileProfile>(null);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        setProfile(null);
        return;
      }

      const { data } = await supabase
        .from("users")
        .select("name, role")
        .eq("id", user.id)
        .single();

      setProfile(data ? { name: data.name, role: data.role } : null);
    }

    void loadProfile();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(() => {
      void loadProfile();
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const items = [
    { href: "/", label: "Home", icon: Home },
    { href: "/menu", label: "Menu", icon: MenuSquare },
    { href: "/checkout", label: "Cart", icon: ShoppingCart },
    { href: "/track-order", label: "Status", icon: ClipboardList },
    profile
      ? {
          href: profile.role === "admin" ? "/admin" : "/account",
          match: profile.role === "admin" ? "/admin" : "/account",
          label: profile.name.split(" ")[0] || "Account",
          icon: UserRound
        }
      : {
          href: "/login?mode=login",
          match: "/login",
          label: "Login",
          icon: UserRound
        }
  ];

  return (
    <nav className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-xl rounded-[28px] border border-brand/20 bg-black/92 p-2 shadow-glow backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-5 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.match ? pathname.startsWith(item.match) : pathname === item.href;
          const isCart = item.href === "/checkout";

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative rounded-[20px] px-3 py-2 text-center text-[11px] text-foreground/65 transition",
                active && "bg-brand text-black"
              )}
            >
              <span className="relative inline-block">
                <Icon className="mx-auto mb-1 h-4 w-4" />
                {isCart && cartCount > 0 ? (
                  <span className="absolute -right-2 -top-1 rounded-full bg-brand px-1.5 text-[10px] font-bold text-black">
                    {cartCount}
                  </span>
                ) : null}
              </span>
              <span className="block truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
