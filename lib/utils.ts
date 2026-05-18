import type { OrderStatus } from "@/lib/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatMinutes(minutes: number) {
  return `${minutes} mins`;
}

export const shopLocation = {
  latitude: 8.564375750850056,
  longitude: 78.12226256011907,
  name: "Kayal Puthumai Shawarma"
};

export function calculateOrderPrepTime(
  items: Array<{ quantity: number; prepTime: number }>
) {
  const workload = items.reduce((total, item) => total + item.quantity * item.prepTime, 0);
  return Math.max(10, Math.round(workload / 2));
}

export function calculateDistanceKm(
  start: { latitude: number; longitude: number },
  end: { latitude: number; longitude: number }
) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(end.latitude - start.latitude);
  const dLng = toRadians(end.longitude - start.longitude);
  const lat1 = toRadians(start.latitude);
  const lat2 = toRadians(end.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

export function calculateDeliveryFee(distanceKm: number) {
  if (distanceKm <= 1.5) {
    return 20;
  }

  return 20 + Math.ceil((distanceKm - 1.5) * 8);
}

export function calculateTravelMinutes(distanceKm: number) {
  return Math.max(8, Math.ceil(distanceKm * 4));
}

export function calculateRemainingEtaMinutes(etaStartedAt: string, etaMinutes: number) {
  const elapsedMs = Date.now() - new Date(etaStartedAt).getTime();
  const elapsedMinutes = Math.max(0, Math.floor(elapsedMs / 60000));
  return Math.max(0, etaMinutes - elapsedMinutes);
}

export function calculateRemainingEtaSeconds(etaStartedAt: string, etaMinutes: number) {
  const elapsedMs = Date.now() - new Date(etaStartedAt).getTime();
  const totalSeconds = Math.max(0, etaMinutes * 60 - Math.floor(elapsedMs / 1000));
  return totalSeconds;
}

export function formatCountdownClock(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function getStageEtaMinutes(status: OrderStatus, previousEtaMinutes: number) {
  switch (status) {
    case "accepted":
      return Math.max(12, previousEtaMinutes - 3);
    case "preparing":
      return Math.max(8, previousEtaMinutes - 5);
    case "out_for_delivery":
      return Math.max(5, previousEtaMinutes - 6);
    case "delivered":
      return 0;
    default:
      return previousEtaMinutes;
  }
}
