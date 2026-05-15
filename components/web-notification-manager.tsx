"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  dispatchAppNotification,
  getStoredNotificationPreference,
  requestNotificationPermission,
  supportsWebNotifications
} from "@/lib/notifications";

type NotificationPermissionState = NotificationPermission | "unsupported";

function useNotificationAvailability() {
  const [permission, setPermission] = useState<NotificationPermissionState>("default");
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const browserSupportsNotifications = supportsWebNotifications();
    setSupported(browserSupportsNotifications);

    if (!browserSupportsNotifications) {
      setPermission("unsupported");
      return;
    }

    setPermission(window.Notification.permission);
  }, []);

  return { permission, setPermission, supported };
}

export function WebNotificationHost() {
  useEffect(() => {
    if (!supportsWebNotifications()) {
      return;
    }

    const onNotify = (event: Event) => {
      const customEvent = event as CustomEvent<{ title: string; body: string }>;
      if (window.Notification.permission !== "granted" || !getStoredNotificationPreference()) {
        return;
      }

      const notification = new window.Notification(customEvent.detail.title, {
        body: customEvent.detail.body
      });

      window.setTimeout(() => notification.close(), 5000);
    };

    window.addEventListener("kps:notify", onNotify as EventListener);
    return () => window.removeEventListener("kps:notify", onNotify as EventListener);
  }, []);
  return null;
}

export function WebNotificationToggle() {
  const { permission, setPermission, supported } = useNotificationAvailability();

  async function handleEnableNotifications() {
    const nextPermission = await requestNotificationPermission();
    setPermission(nextPermission);

    if (nextPermission === "granted") {
      dispatchAppNotification({
        title: "Notifications enabled",
        body: "You’ll now receive browser alerts for important order updates."
      });
    }
  }

  if (!supported) {
    return null;
  }

  if (permission === "granted") {
    return (
      <div className="hidden items-center gap-2 rounded-full border border-brand/20 px-4 py-2 text-sm text-foreground/75 lg:flex">
        <Bell className="h-4 w-4 text-brand" />
        Notifications on
      </div>
    );
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleEnableNotifications}>
      {permission === "denied" ? (
        <>
          <BellOff className="mr-2 h-4 w-4" />
          Notifications blocked
        </>
      ) : (
        <>
          <Bell className="mr-2 h-4 w-4" />
          Enable alerts
        </>
      )}
    </Button>
  );
}
