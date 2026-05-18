import Link from "next/link";
import type { PropsWithChildren } from "react";
import { LayoutGrid, Store } from "lucide-react";
import { AccountSignOutButton } from "@/components/auth/account-sign-out-button";
import { Button } from "@/components/ui/button";

export function AdminShell({ children }: PropsWithChildren) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-brand/10 bg-black/88 backdrop-blur-xl">
        <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 xl:px-10">
          <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.35em] text-brand">Admin Workspace</p>
            <h1 className="truncate font-display text-xl text-white">Kayal Puthumai Shawarma</h1>
          </div>

            <div className="hidden items-center gap-2 sm:flex sm:gap-3">
            <Button asChild variant="secondary" size="sm">
              <Link href="/admin">
                <LayoutGrid className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/">
                <Store className="mr-2 h-4 w-4" />
                View Site
              </Link>
            </Button>
            <AccountSignOutButton />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 sm:hidden">
            <Button asChild variant="secondary" size="sm" className="w-full">
              <Link href="/admin">
                <LayoutGrid className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button asChild variant="secondary" size="sm" className="w-full">
              <Link href="/">
                <Store className="mr-2 h-4 w-4" />
                Site
              </Link>
            </Button>
            <AccountSignOutButton />
          </div>
        </div>
      </header>

      <div className="pb-24 sm:pb-0">{children}</div>
    </>
  );
}
