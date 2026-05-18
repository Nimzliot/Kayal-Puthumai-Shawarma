"use client";

import { useState } from "react";
import { AccountSignOutButton } from "@/components/auth/account-sign-out-button";
import type { OrderOverview, SavedAddress } from "@/lib/types";
import { calculateRemainingEtaMinutes, formatCurrency } from "@/lib/utils";

type AccountPageProps = {
  profile: {
    name: string;
    phone: string | null;
    email: string | null;
    role: "customer" | "admin";
  };
  orders: OrderOverview[];
  savedAddresses: SavedAddress[];
};

const statusLabels = {
  order_placed: "Order placed",
  accepted: "Accepted",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  rejected: "Rejected"
} as const;

export function AccountPage({ profile, orders, savedAddresses }: AccountPageProps) {
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSaveProfile() {
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          phone
        })
      });

      const payload = (await response.json()) as {
        success?: boolean;
        error?: string | { fieldErrors?: Record<string, string[]> };
      };

      if (!response.ok || !payload.success) {
        setMessage(typeof payload.error === "string" ? payload.error : "Unable to save profile.");
        return;
      }

      setMessage("Profile updated successfully.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pb-32 pt-8 sm:px-6 lg:px-8">
      <section className="glass-panel rounded-[32px] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-brand">Your Account</p>
            <h1 className="mt-3 font-display text-3xl text-white">Personal settings</h1>
          </div>
          <AccountSignOutButton />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-2xl border border-border bg-black/30 px-4 py-3 text-sm outline-none"
            placeholder="Your name"
          />
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="rounded-2xl border border-border bg-black/30 px-4 py-3 text-sm outline-none"
            placeholder="Phone number"
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-foreground/75">
          <div className="rounded-full border border-brand/20 px-4 py-2">{profile.email ?? "No email"}</div>
          <div className="rounded-full border border-brand/20 px-4 py-2 capitalize">Role: {profile.role}</div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-black"
          >
            {isSaving ? "Saving..." : "Save profile"}
          </button>
          {message ? <p className="self-center text-sm text-foreground/70">{message}</p> : null}
        </div>
      </section>

      <section className="mt-6 glass-panel rounded-[30px] p-6">
        <h2 className="text-lg font-semibold text-white">Saved addresses</h2>
        {savedAddresses.length > 0 ? (
          <div className="mt-4 space-y-3">
            {savedAddresses.map((address) => (
              <div key={address.id} className="rounded-[24px] border border-border p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{address.label}</p>
                    <p className="mt-1 text-foreground/60">{address.addressLine}</p>
                    {address.phone ? <p className="mt-1 text-foreground/60">{address.phone}</p> : null}
                  </div>
                  {address.isDefault ? (
                    <div className="rounded-full border border-brand/20 px-3 py-2 text-xs text-brand">Default</div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-foreground/65">No saved addresses yet.</p>
        )}
      </section>

      <section className="mt-6 glass-panel rounded-[30px] p-6">
        <h2 className="text-lg font-semibold text-white">Orders</h2>
        {orders.length > 0 ? (
          <div className="mt-4 space-y-3">
            {orders.map((order) => {
              const remainingMinutes =
                order.status === "delivered" ? 0 : calculateRemainingEtaMinutes(order.etaStartedAt, order.etaMinutes);

              return (
                <div key={order.id} className="rounded-[24px] border border-border p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">#{order.id.slice(0, 8)}</p>
                      <p className="mt-1 text-foreground/60">{statusLabels[order.status]}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white">{formatCurrency(order.totalAmount)}</p>
                      <p className="mt-1 text-foreground/60">{remainingMinutes} mins remaining</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 text-sm text-foreground/65">No order history loaded yet.</p>
        )}
      </section>
    </main>
  );
}
