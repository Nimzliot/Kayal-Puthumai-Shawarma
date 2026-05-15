"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  MapPin,
  MenuSquare,
  ShoppingCart,
  UserCircle2
} from "lucide-react";
import { usePathname } from "next/navigation";
import { WebNotificationToggle } from "@/components/web-notification-manager";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu", icon: MenuSquare },
  { href: "/track-order", label: "Status", icon: ClipboardList }
];

type HeaderProfile = {
  name: string;
  role: "customer" | "admin";
} | null;

export function SiteHeader() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const pathname = usePathname();
  const items = useCartStore((state) => state.items);
  const cartCount = items.reduce((total, item) => total + item.quantity, 0);
  const [profile, setProfile] = useState<HeaderProfile>(null);
  const [flashMessage, setFlashMessage] = useState("");

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

    const nextFlash = window.sessionStorage.getItem("kps-auth-flash");
    if (nextFlash) {
      setFlashMessage(nextFlash);
      window.sessionStorage.removeItem("kps-auth-flash");
      window.setTimeout(() => setFlashMessage(""), 5000);
    }

    return () => subscription.unsubscribe();
  }, [supabase]);

  return (
    <header className="sticky top-0 z-40 border-b border-brand/10 bg-black/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="min-w-0">
            <p className="truncate font-display text-lg text-white">காயல் புதுமை ஷவர்மா</p>
            <p className="truncate text-xs uppercase tracking-[0.3em] text-brand">
              Kayal Puthumai Shawarma
            </p>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden rounded-full border border-brand/20 px-4 py-2 text-sm text-foreground/75 xl:block">
              <MapPin className="mr-2 inline h-4 w-4 text-brand" />
              Local delivery in 20-35 mins
            </div>
            <WebNotificationToggle />
            <Button asChild variant="secondary" size="sm">
              <Link href="/checkout" className="relative">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Cart
                {cartCount > 0 ? (
                  <span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-black">
                    {cartCount}
                  </span>
                ) : null}
              </Link>
            </Button>
            {profile ? (
              <Button asChild variant="secondary" size="sm" className="hidden sm:inline-flex">
                <Link href={profile.role === "admin" ? "/admin" : "/account"}>
                  <UserCircle2 className="mr-2 h-4 w-4" />
                  {profile.name}
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="secondary" size="sm" className="hidden sm:inline-flex">
                  <Link href="/login?mode=login">
                    <UserCircle2 className="mr-2 h-4 w-4" />
                    Login
                  </Link>
                </Button>
                <Button asChild size="sm" className="hidden sm:inline-flex">
                  <Link href="/login?mode=signup">Signup</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="hidden flex-wrap items-center justify-between gap-3 md:flex">
          <nav className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full border border-brand/15 px-4 py-2 text-sm text-foreground/72 transition hover:border-brand/40 hover:text-white",
                    active && "border-brand bg-brand text-black hover:text-black"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

        </div>

        {flashMessage ? (
          <div className="rounded-[22px] border border-brand/20 bg-brand/10 px-4 py-3 text-sm text-foreground/85">
            {flashMessage}
          </div>
        ) : null}
      </div>
    </header>
  );
}
