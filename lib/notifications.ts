export const notificationPreferenceKey = "kps-web-notifications";

type AppNotificationDetail = {
  title: string;
  body: string;
};

export function supportsWebNotifications() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getStoredNotificationPreference() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(notificationPreferenceKey) === "enabled";
}

export function storeNotificationPreference(enabled: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(notificationPreferenceKey, enabled ? "enabled" : "disabled");
}

export async function requestNotificationPermission() {
  if (!supportsWebNotifications()) {
    return "unsupported" as const;
  }

  const permission = await window.Notification.requestPermission();
  storeNotificationPreference(permission === "granted");
  return permission;
}

export function dispatchAppNotification(detail: AppNotificationDetail) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent<AppNotificationDetail>("kps:notify", { detail }));
}
