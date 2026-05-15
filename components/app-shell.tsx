import type { PropsWithChildren } from "react";
import { MobileNav } from "@/components/mobile-nav";
import { SiteHeader } from "@/components/site-header";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <>
      <SiteHeader />
      {children}
      <MobileNav />
    </>
  );
}
