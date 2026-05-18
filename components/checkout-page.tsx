"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Crosshair, LoaderCircle, LocateFixed, MapPin, ShieldCheck, Smartphone, Wallet } from "lucide-react";
import { MapView } from "@/components/map-view";
import { Button } from "@/components/ui/button";
import { dispatchAppNotification } from "@/lib/notifications";
import type { SavedAddress } from "@/lib/types";
import { useCartStore, useCartSummary } from "@/store/cart-store";
import {
  calculateDeliveryFee,
  calculateDistanceKm,
  calculateTravelMinutes,
  formatCurrency,
  shopLocation
} from "@/lib/utils";

const presetTips = [10, 20, 50];

export function CheckoutPage({
  profile,
  savedAddresses
}: {
  profile: {
    name: string;
    phone: string | null;
  } | null;
  savedAddresses: SavedAddress[];
}) {
  const router = useRouter();
  const { items, subtotal, prepTime, tipAmount } = useCartSummary();
  const { note, setNote, setTipAmount, clearCart } = useCartStore();
  const empty = items.length === 0;
  const [receiverName, setReceiverName] = useState(profile?.name ?? "");
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone ?? "");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [saveAddress, setSaveAddress] = useState(true);
  const [addressLabel, setAddressLabel] = useState("Home");
  const [location, setLocation] = useState({
    latitude: shopLocation.latitude,
    longitude: shopLocation.longitude
  });
  const [showRoutePreview, setShowRoutePreview] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isPickingFromMap, setIsPickingFromMap] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationMessage, setLocationMessage] = useState(
    "The shop location is fixed. Tap below to use the customer's current location for delivery."
  );
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const shopOrigin = useMemo(
    () => ({
      latitude: shopLocation.latitude,
      longitude: shopLocation.longitude,
      label: shopLocation.name
    }),
    []
  );
  const distanceKm = useMemo(() => calculateDistanceKm(shopLocation, location), [location]);
  const deliveryFee = useMemo(() => calculateDeliveryFee(distanceKm), [distanceKm]);
  const eta = useMemo(() => prepTime + calculateTravelMinutes(distanceKm), [distanceKm, prepTime]);
  const total = subtotal + deliveryFee + tipAmount;

  function handleSavedAddressSelect(addressId: string) {
    const selected = savedAddresses.find((address) => address.id === addressId);
    if (!selected) {
      return;
    }

    setDeliveryAddress(selected.addressLine);
    setAddressLabel(selected.label);
    if (selected.phone) {
      setPhoneNumber(selected.phone);
    }
    if (selected.gpsLatitude !== null && selected.gpsLongitude !== null) {
      setLocation({
        latitude: selected.gpsLatitude,
        longitude: selected.gpsLongitude
      });
      setLocationMessage("Saved address loaded. Route and delivery distance updated.");
    } else {
      setLocationMessage("Saved address loaded. Add current location if you want accurate delivery distance.");
    }
  }

  function handleMapLocationPick(nextLocation: { latitude: number; longitude: number }) {
    setLocation(nextLocation);
    setIsPickingFromMap(false);
    setLocationMessage("Map location selected. Route and delivery distance updated.");
  }

  function handleSelectFromMap() {
    setIsPickingFromMap(true);
    setLocationMessage("Tap anywhere on the map below to choose the customer location.");
  }

  useEffect(() => {
    const changedFromShop =
      Math.abs(location.latitude - shopLocation.latitude) > 0.00001 ||
      Math.abs(location.longitude - shopLocation.longitude) > 0.00001;
    setShowRoutePreview(changedFromShop);
  }, [location.latitude, location.longitude]);

  async function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationMessage("Location access is not supported on this device.");
      return;
    }

    if (typeof window !== "undefined" && window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
      setLocationMessage("Current location needs HTTPS in production. Open the secure site URL and try again.");
      return;
    }

    setIsLocating(true);
    setLocationMessage("Fetching your current location...");

    try {
      if ("permissions" in navigator && navigator.permissions?.query) {
        const permission = await navigator.permissions.query({
          name: "geolocation" as PermissionName
        });

        if (permission.state === "denied") {
          setIsLocating(false);
          setLocationMessage("Location permission is blocked for this site. Allow it in browser settings and try again.");
          return;
        }
      }
    } catch {
      // Some browsers do not fully support the Permissions API. Continue to geolocation request.
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setIsLocating(false);
        setLocationMessage("Current location added. Route and distance are now shown on the map.");
      },
      (error) => {
        setIsLocating(false);
        setLocationMessage(
          error.code === error.PERMISSION_DENIED
            ? "Location permission was denied. Please allow it in your browser settings."
            : error.code === error.POSITION_UNAVAILABLE
              ? "Your device could not detect a location. Turn on GPS or mobile location and try again."
              : error.code === error.TIMEOUT
                ? "Location request timed out. Try again in an open area with better signal."
            : "Unable to fetch your current location. Please enter the address manually."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }

  async function handlePlaceOrder() {
    if (empty || isSubmitting) {
      return;
    }

    const nextFieldErrors: Record<string, string> = {};
    if (receiverName.trim().length < 2) {
      nextFieldErrors.receiverName = "Enter at least 2 characters for the name.";
    }
    if (phoneNumber.trim().length < 8) {
      nextFieldErrors.phone = "Enter a valid phone number with at least 8 digits.";
    }
    if (deliveryAddress.trim().length < 8) {
      nextFieldErrors.deliveryAddress = "Enter a fuller delivery address.";
    }
    if (saveAddress && addressLabel.trim().length > 0 && addressLabel.trim().length < 2) {
      nextFieldErrors.addressLabel = "Address label should be at least 2 characters.";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setCheckoutMessage("Please correct the highlighted fields before placing the order.");
      return;
    }

    setIsSubmitting(true);
    setCheckoutMessage("Saving your order and delivery location...");
    setFieldErrors({});

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          receiverName: receiverName.trim(),
          phone: phoneNumber.trim(),
          deliveryAddress: deliveryAddress.trim(),
          gpsLatitude: location.latitude,
          gpsLongitude: location.longitude,
          saveAddress,
          addressLabel: saveAddress ? addressLabel.trim() || "Saved Location" : undefined,
          paymentMethod: "cash_on_delivery",
          tipAmount,
          note: note.trim() || undefined,
          items: items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity
          }))
        })
      });

      const payload = (await response.json()) as {
        success?: boolean;
        orderId?: string;
        error?: string | { fieldErrors?: Record<string, string[]> };
      };

      if (!response.ok || !payload.success) {
        if (typeof payload.error !== "string" && payload.error?.fieldErrors) {
          const nextApiFieldErrors = Object.fromEntries(
            Object.entries(payload.error.fieldErrors)
              .filter((entry): entry is [string, string[]] => Array.isArray(entry[1]) && entry[1].length > 0)
              .map(([key, value]) => [key, value[0]])
          );
          setFieldErrors(nextApiFieldErrors);
          setCheckoutMessage("Please correct the highlighted fields before placing the order.");
          return;
        }

        const apiError =
          typeof payload.error === "string"
            ? payload.error
            : "Unable to place order right now.";
        setCheckoutMessage(apiError);
        return;
      }

      clearCart();
      setCheckoutMessage(
        saveAddress
          ? "Order placed and current location saved successfully."
          : "Order placed successfully."
      );
      dispatchAppNotification({
        title: "Order placed successfully",
        body: `Your order ${payload.orderId ? `#${payload.orderId.slice(0, 8)}` : ""} is confirmed with an ETA of ${eta} mins.`
      });
      router.push("/track-order");
    } catch {
      setCheckoutMessage("Network error while saving order location. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pb-32 pt-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <section className="glass-panel rounded-[30px] p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-brand">Checkout</p>
            <h1 className="mt-3 font-display text-3xl text-white">Finish your order</h1>
            <p className="mt-3 text-sm leading-7 text-foreground/70">
              Guests can browse freely, but placing this order should use Supabase Auth with
              Google, phone OTP, or email login. This UI is ready for that flow.
            </p>
          </section>

          <section className="glass-panel rounded-[30px] p-6">
            <h2 className="text-lg font-semibold text-white">Delivery details</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <input
                className="rounded-2xl border border-border bg-black/30 px-4 py-3 text-sm outline-none"
                placeholder="Receiver name"
                value={receiverName}
                onChange={(event) => setReceiverName(event.target.value)}
              />
              {fieldErrors.receiverName ? (
                <p className="text-sm text-danger md:col-span-1">{fieldErrors.receiverName}</p>
              ) : null}
              <input
                className="rounded-2xl border border-border bg-black/30 px-4 py-3 text-sm outline-none"
                placeholder="Phone number"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
              />
              {fieldErrors.phone ? (
                <p className="text-sm text-danger md:col-span-1">{fieldErrors.phone}</p>
              ) : null}
              <input
                className="rounded-2xl border border-border bg-black/30 px-4 py-3 text-sm outline-none md:col-span-2"
                placeholder="Delivery address"
                value={deliveryAddress}
                onChange={(event) => setDeliveryAddress(event.target.value)}
              />
              {fieldErrors.deliveryAddress ? (
                <p className="text-sm text-danger md:col-span-2">{fieldErrors.deliveryAddress}</p>
              ) : null}
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-[auto_1fr]">
              <label className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm text-foreground/75">
                <input
                  type="checkbox"
                  checked={saveAddress}
                  onChange={(event) => setSaveAddress(event.target.checked)}
                  className="h-4 w-4 accent-[#f7c942]"
                />
                Save this address and location
              </label>
              <input
                className="rounded-2xl border border-border bg-black/30 px-4 py-3 text-sm outline-none"
                placeholder="Address label"
                value={addressLabel}
                onChange={(event) => setAddressLabel(event.target.value)}
                disabled={!saveAddress}
              />
            </div>
            {savedAddresses.length > 0 ? (
              <div className="mt-4">
                <label className="mb-2 block text-sm text-foreground/70">Use a saved address</label>
                <select
                  defaultValue=""
                  onChange={(event) => handleSavedAddressSelect(event.target.value)}
                  className="w-full rounded-2xl border border-border bg-black/30 px-4 py-3 text-sm outline-none"
                >
                  <option value="">Select saved address</option>
                  {savedAddresses.map((address) => (
                    <option key={address.id} value={address.id}>
                      {address.label} - {address.addressLine}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            {fieldErrors.addressLabel ? (
              <p className="mt-3 text-sm text-danger">{fieldErrors.addressLabel}</p>
            ) : null}
            <div className="mt-4">
              <div className="mb-3 rounded-2xl border border-dashed border-brand/25 px-4 py-4 text-sm text-foreground/70">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-white">
                      <MapPin className="mr-2 inline h-4 w-4 text-brand" />
                      Delivery location
                    </p>
                    <p className="mt-2 text-foreground/70">{locationMessage}</p>
                    <p className="mt-2 text-xs text-foreground/55">
                      You can either tap the map to choose a point or use your current location.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:min-w-48">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleSelectFromMap}
                      className="min-w-48"
                    >
                      <Crosshair className="mr-2 h-4 w-4" />
                      {isPickingFromMap ? "Tap map below" : "Select from map"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleUseCurrentLocation}
                      disabled={isLocating}
                      className="min-w-48"
                    >
                      {isLocating ? (
                        <>
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                          Locating...
                        </>
                      ) : (
                        <>
                          <LocateFixed className="mr-2 h-4 w-4" />
                          Use current location
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-foreground/60">
                  <span className="rounded-full border border-border px-3 py-2">
                    Shop: {shopLocation.latitude.toFixed(5)}, {shopLocation.longitude.toFixed(5)}
                  </span>
                  <span className="rounded-full border border-border px-3 py-2">
                    Customer lat: {location.latitude.toFixed(5)}
                  </span>
                  <span className="rounded-full border border-border px-3 py-2">
                    Customer lng: {location.longitude.toFixed(5)}
                  </span>
                  <span className="rounded-full border border-border px-3 py-2">
                    Distance: {distanceKm.toFixed(1)} km
                  </span>
                  {showRoutePreview ? (
                    <span className="rounded-full border border-brand/25 bg-brand/10 px-3 py-2 text-brand">
                      Live route preview active
                    </span>
                  ) : null}
                  {isPickingFromMap ? (
                    <span className="rounded-full border border-brand/25 bg-brand/10 px-3 py-2 text-brand">
                      Map selection mode on
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="mb-3 flex items-center justify-between rounded-2xl border border-brand/15 bg-brand/5 px-4 py-3 text-sm text-foreground/70">
                <span>
                  {isPickingFromMap
                    ? "Tap the map now to save the customer point."
                    : "Want to choose manually? Use Select from map."}
                </span>
                <Button type="button" size="sm" variant="secondary" onClick={handleSelectFromMap}>
                  <Crosshair className="mr-2 h-4 w-4" />
                  Select from map
                </Button>
              </div>
              <MapView
                latitude={location.latitude}
                longitude={location.longitude}
                label="Delivery location preview"
                origin={shopOrigin}
                animateRoute={showRoutePreview}
                onSelectLocation={handleMapLocationPick}
              />
            </div>
          </section>

          <section className="glass-panel rounded-[30px] p-6">
            <h2 className="text-lg font-semibold text-white">Add a tip</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {presetTips.map((tip) => (
                <button
                  key={tip}
                  onClick={() => setTipAmount(tip)}
                  className={`rounded-full border px-4 py-2 text-sm ${
                    tipAmount === tip
                      ? "border-brand bg-brand text-black"
                      : "border-border text-foreground/75"
                  }`}
                >
                  {"\u20b9"}
                  {tip}
                </button>
              ))}
              <input
                type="number"
                min={0}
                placeholder="Custom tip"
                className="rounded-full border border-border bg-black/30 px-4 py-2 text-sm outline-none"
                onChange={(event) => setTipAmount(Number(event.target.value || 0))}
              />
            </div>
          </section>

          <section className="glass-panel rounded-[30px] p-6">
            <h2 className="text-lg font-semibold text-white">Order notes</h2>
            <div className="mt-4 grid gap-4">
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="min-h-28 rounded-2xl border border-border bg-black/30 px-4 py-3 text-sm outline-none"
                placeholder="Notes for order"
              />
            </div>
          </section>
        </div>

        <aside className="glass-panel h-fit rounded-[30px] p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold text-white">Order summary</h2>
          <div className="mt-5 space-y-4">
            {empty ? (
              <p className="text-sm text-foreground/60">Your cart is currently empty.</p>
            ) : (
              items.map((item) => (
                <div key={item.product.id} className="flex justify-between gap-4 text-sm">
                  <div>
                    <p className="text-white">{item.product.englishName}</p>
                    <p className="text-foreground/60">
                      {item.quantity} x {formatCurrency(item.product.price)}
                    </p>
                  </div>
                  <p>{formatCurrency(item.product.price * item.quantity)}</p>
                </div>
              ))
            )}
          </div>
          <div className="mt-6 space-y-3 border-t border-border pt-4 text-sm text-foreground/75">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery fee ({distanceKm.toFixed(1)} km)</span>
              <span>{formatCurrency(deliveryFee)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tip</span>
              <span>{formatCurrency(tipAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Kitchen prep</span>
              <span>{prepTime} mins</span>
            </div>
            <div className="flex justify-between">
              <span>Travel time</span>
              <span>{calculateTravelMinutes(distanceKm)} mins</span>
            </div>
            <div className="flex justify-between text-white">
              <span>Estimated delivery</span>
              <span>{eta} mins</span>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base font-semibold text-white">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-brand/25 bg-brand/10 p-4">
            <div className="flex items-center gap-3 text-sm text-white">
              <Wallet className="h-5 w-5 text-brand" />
              <span>Cash on Delivery is enabled by default.</span>
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-dashed border-brand/30 px-4 py-3 text-sm text-foreground/70">
              <Smartphone className="h-4 w-4 text-brand" />
              Online Payment - Coming Soon
            </div>
          </div>

          <Button className="mt-6 w-full" disabled={empty || isSubmitting} onClick={handlePlaceOrder}>
            {isSubmitting ? "Saving order..." : "Place order with COD"}
          </Button>
          {checkoutMessage ? (
            <p className="mt-3 text-sm text-foreground/70">{checkoutMessage}</p>
          ) : null}
          <p className="mt-4 text-xs leading-6 text-foreground/55">
            <ShieldCheck className="mr-2 inline h-3.5 w-3.5 text-brand" />
            Secure checkout should use protected server actions, RLS, and authenticated Supabase
            sessions.
          </p>
        </aside>
      </div>
    </main>
  );
}
