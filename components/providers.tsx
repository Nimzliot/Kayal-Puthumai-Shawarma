"use client";

import { AnimatePresence } from "framer-motion";
import type { PropsWithChildren } from "react";
import { WebNotificationHost } from "@/components/web-notification-manager";

export function Providers({ children }: PropsWithChildren) {
  return (
    <>
      <WebNotificationHost />
      <AnimatePresence mode="wait">{children}</AnimatePresence>
    </>
  );
}
