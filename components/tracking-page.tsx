"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { OrderOverview, OrderStatus } from "@/lib/types";
import { calculateRemainingEtaMinutes, formatCurrency } from "@/lib/utils";

const steps: Array<{ key: OrderStatus; label: string }> = [
  { key: "order_placed", label: "Order placed" },
  { key: "accepted", label: "Accepted" },
  { key: "preparing", label: "Preparing" },
  { key: "out_for_delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" }
];

const statusLabels: Record<OrderStatus, string> = {
  order_placed: "Order placed",
  accepted: "Accepted",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  rejected: "Rejected"
};

const statusIndex: Record<OrderStatus, number> = {
  order_placed: 0,
  accepted: 1,
  preparing: 2,
  out_for_delivery: 3,
  delivered: 4,
  rejected: 4
};

export function TrackingPage({ initialOrder }: { initialOrder: OrderOverview | null }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [order, setOrder] = useState<OrderOverview | null>(initialOrder);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    setOrder(initialOrder);
  }, [initialOrder]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!order) {
      return;
    }

    const channel = supabase
      .channel(`tracking-${order.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${order.id}`
        },
        (payload) => {
          const next = payload.new;
          setOrder((current) =>
            current
              ? {
                  ...current,
                  status: next.status as OrderStatus,
                  etaMinutes: Number(next.eta_minutes),
                  etaStartedAt: String(next.eta_started_at),
                  timingStatus: next.timing_status as OrderOverview["timingStatus"],
                  totalAmount: Number(next.total_amount),
                  deliveryCharge: Number(next.delivery_charge),
                  subtotalAmount: Number(next.subtotal_amount),
                  tipAmount: Number(next.tip_amount),
                  updatedAt: String(next.updated_at)
                }
              : current
          );
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [order, supabase]);

  if (!order) {
    return (
      <main className="mx-auto max-w-5xl px-4 pb-32 pt-8 sm:px-6 lg:px-8">
        <section className="glass-panel rounded-[32px] p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.35em] text-brand">Order Status</p>
          <h1 className="mt-3 font-display text-3xl text-white">Track your order</h1>
          <p className="mt-3 text-sm text-foreground/70">No order found for this account yet.</p>
        </section>
      </main>
    );
  }

  const remainingMinutes =
    order.status === "delivered" ? 0 : calculateRemainingEtaMinutes(order.etaStartedAt, order.etaMinutes);

  return (
    <main className="mx-auto max-w-5xl px-4 pb-32 pt-8 sm:px-6 lg:px-8">
      <section className="glass-panel rounded-[32px] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-brand">Order Status</p>
        <h1 className="mt-3 font-display text-3xl text-white">Track your order</h1>
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-foreground/75">
          <div className="rounded-full border border-brand/20 px-4 py-2">#{order.id.slice(0, 8)}</div>
          <div className="rounded-full border border-brand/20 px-4 py-2">{statusLabels[order.status]}</div>
          <div className="rounded-full border border-brand/20 px-4 py-2">{formatCurrency(order.totalAmount)}</div>
          <div className="rounded-full border border-brand/20 px-4 py-2">{remainingMinutes} mins remaining</div>
          <div className="rounded-full border border-brand/20 px-4 py-2 capitalize">{order.timingStatus.replace("_", " ")}</div>
        </div>
      </section>

      <section className="mt-6 glass-panel rounded-[30px] p-6">
        <h2 className="text-lg font-semibold text-white">Order timeline</h2>
        <div className="mt-6 space-y-4">
          {steps.map((step, index) => {
            const activeIndex = statusIndex[order.status];
            const completed = index <= activeIndex;

            return (
              <div key={step.key} className="flex gap-4">
                <div
                  className={`mt-1 h-4 w-4 rounded-full ${
                    completed ? "bg-brand shadow-glow" : "border border-border"
                  }`}
                />
                <div>
                  <p className="font-medium text-white">{step.label}</p>
                  <p className="text-sm text-foreground/65">
                    {completed ? "Updated" : "Waiting"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
