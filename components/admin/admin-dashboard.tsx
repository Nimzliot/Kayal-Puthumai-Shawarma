"use client";

import { useState } from "react";
import { Activity, Bike, CheckCircle2, Clock3, IndianRupee, MapPinned, Sandwich, TrendingUp } from "lucide-react";
import { MapView } from "@/components/map-view";
import { ProductManager } from "@/components/admin/product-manager";
import { Button } from "@/components/ui/button";
import type { OrderOverview, OrderStatus, Product } from "@/lib/types";
import { formatCurrency, shopLocation } from "@/lib/utils";

const statusLabels: Record<OrderStatus, string> = {
  order_placed: "Order placed",
  accepted: "Accepted",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  rejected: "Rejected"
};

const adminActions: Array<{ status: OrderStatus; label: string }> = [
  { status: "accepted", label: "Accepted" },
  { status: "preparing", label: "Preparing" },
  { status: "out_for_delivery", label: "Out for delivery" },
  { status: "delivered", label: "Delivered" }
];

export function AdminDashboard({
  products,
  initialOrders
}: {
  products: Product[];
  initialOrders: OrderOverview[];
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [message, setMessage] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [selectedOrderLocation, setSelectedOrderLocation] = useState<OrderOverview | null>(null);

  const stats = [
    { label: "Products", value: String(products.length), icon: Sandwich },
    {
      label: "Available",
      value: String(products.filter((product) => product.available).length),
      icon: Activity
    },
    {
      label: "Open orders",
      value: String(
        orders.filter((order) => order.status !== "delivered" && order.status !== "rejected").length
      ),
      icon: IndianRupee
    },
    { label: "Map", value: "Fixed", icon: Clock3 }
  ];

  async function handleStatusUpdate(orderId: string, status: Extract<OrderStatus, "accepted" | "preparing" | "out_for_delivery" | "delivered">) {
    setUpdatingOrderId(orderId);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      });

      const result = (await response.json()) as {
        success?: boolean;
        error?: string | { fieldErrors?: Record<string, string[]> };
        order?: {
          id: string;
          status: OrderStatus;
          eta_minutes: number;
          total_amount: number | string;
          subtotal_amount: number | string;
          delivery_charge: number | string;
          tip_amount: number | string;
          updated_at: string;
        };
      };

      if (!response.ok || !result.success || !result.order) {
        setMessage(typeof result.error === "string" ? result.error : "Unable to update order.");
        return;
      }

      setOrders((current) =>
        current.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: result.order!.status,
                etaMinutes: Number(result.order!.eta_minutes),
                totalAmount: Number(result.order!.total_amount),
                subtotalAmount: Number(result.order!.subtotal_amount),
                deliveryCharge: Number(result.order!.delivery_charge),
                tipAmount: Number(result.order!.tip_amount),
                updatedAt: result.order!.updated_at
              }
            : order
        )
      );

      setMessage(`Order moved to ${statusLabels[status]}.`);
    } finally {
      setUpdatingOrderId(null);
    }
  }

  const mapLatitude = selectedOrderLocation?.gpsLatitude ?? shopLocation.latitude;
  const mapLongitude = selectedOrderLocation?.gpsLongitude ?? shopLocation.longitude;
  const showingCustomerLocation =
    selectedOrderLocation?.gpsLatitude !== null && selectedOrderLocation?.gpsLongitude !== null;

  return (
    <main className="mx-auto max-w-[1600px] px-4 pb-20 pt-8 sm:px-6 xl:px-10">
      <section className="glass-panel rounded-[32px] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-brand">Admin Panel</p>
        <h1 className="mt-3 font-display text-3xl text-white">Operations dashboard</h1>
        <p className="mt-3 text-sm text-foreground/70">Manage products, orders, and shop settings.</p>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass-panel rounded-[28px] p-5">
              <Icon className="h-5 w-5 text-brand" />
              <p className="mt-4 text-sm text-foreground/60">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold text-white">{stat.value}</p>
            </div>
          );
        })}
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-panel rounded-[30px] p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-brand" />
            <h2 className="text-lg font-semibold text-white">Orders</h2>
          </div>
          {message ? <p className="mt-4 text-sm text-foreground/70">{message}</p> : null}
          <div className="mt-5 space-y-4">
            {orders.length > 0 ? (
              orders.map((order) => (
                <div key={order.id} className="rounded-[24px] border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">#{order.id.slice(0, 8)}</p>
                      <p className="mt-1 text-sm text-foreground/60">{order.customerName}</p>
                      <p className="mt-1 text-sm text-foreground/60">{order.deliveryAddress}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-white">{formatCurrency(order.totalAmount)}</p>
                      <p className="mt-1 text-foreground/60">{statusLabels[order.status]}</p>
                      <p className="mt-1 text-foreground/60">{order.etaMinutes} mins ETA</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={order.gpsLatitude === null || order.gpsLongitude === null}
                      onClick={() => setSelectedOrderLocation(order)}
                    >
                      <MapPinned className="mr-2 h-4 w-4" />
                      View location
                    </Button>
                    {adminActions.map((action) => (
                      <Button
                        key={action.status}
                        size="sm"
                        variant={order.status === action.status ? "primary" : "secondary"}
                        disabled={updatingOrderId === order.id || order.status === action.status}
                        onClick={() => handleStatusUpdate(order.id, action.status as Extract<OrderStatus, "accepted" | "preparing" | "out_for_delivery" | "delivered">)}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-foreground/65">No live order data shown yet.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel rounded-[30px] p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-brand" />
              <h2 className="text-lg font-semibold text-white">Kitchen</h2>
            </div>
            <p className="mt-4 text-sm text-foreground/65">
              Prep time values are taken from your menu items.
            </p>
          </div>

          <div className="glass-panel rounded-[30px] p-6">
            <div className="flex items-center gap-3">
              <Bike className="h-5 w-5 text-brand" />
              <h2 className="text-lg font-semibold text-white">
                {showingCustomerLocation ? "Customer location" : "Shop location"}
              </h2>
            </div>
            <p className="mt-4 text-sm leading-7 text-foreground/70">
              {showingCustomerLocation
                ? `Showing the saved delivery point for order #${selectedOrderLocation?.id.slice(0, 8)}.`
                : "Default admin shop location is fixed here and used for customer distance and delivery fee calculation."}
            </p>
            <div className="mt-4 rounded-2xl border border-border px-4 py-3 text-sm text-foreground/70">
              {mapLatitude.toFixed(6)}, {mapLongitude.toFixed(6)}
            </div>
            {showingCustomerLocation ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => setSelectedOrderLocation(null)}>
                  Back to shop map
                </Button>
                <div className="rounded-full border border-brand/20 px-3 py-2 text-xs text-foreground/70">
                  {selectedOrderLocation?.deliveryAddress}
                </div>
              </div>
            ) : null}
            <div className="mt-4 overflow-hidden rounded-[24px]">
              <MapView
                latitude={mapLatitude}
                longitude={mapLongitude}
                zoom={showingCustomerLocation ? 15 : 16}
                label={showingCustomerLocation ? selectedOrderLocation?.customerName ?? "Customer location" : shopLocation.name}
                origin={showingCustomerLocation ? shopLocation : undefined}
                animateRoute={showingCustomerLocation}
                className="min-h-[220px]"
              />
            </div>
          </div>
        </div>
      </section>

      <ProductManager initialProducts={products} />
    </main>
  );
}
