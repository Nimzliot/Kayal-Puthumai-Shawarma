import { AccountSignOutButton } from "@/components/auth/account-sign-out-button";
import type { OrderOverview } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

type AccountPageProps = {
  profile: {
    name: string;
    email: string | null;
    role: "customer" | "admin";
  };
  orders: OrderOverview[];
};

const statusLabels = {
  order_placed: "Order placed",
  accepted: "Accepted",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  rejected: "Rejected"
} as const;

export function AccountPage({ profile, orders }: AccountPageProps) {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-32 pt-8 sm:px-6 lg:px-8">
      <section className="glass-panel rounded-[32px] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-brand">Your Account</p>
            <h1 className="mt-3 font-display text-3xl text-white">Account</h1>
          </div>
          <AccountSignOutButton />
        </div>
        <div className="mt-6 flex flex-wrap gap-3 text-sm text-foreground/75">
          <div className="rounded-full border border-brand/20 px-4 py-2">{profile.name}</div>
          <div className="rounded-full border border-brand/20 px-4 py-2">
            {profile.email ?? "No email"}
          </div>
          <div className="rounded-full border border-brand/20 px-4 py-2 capitalize">
            Role: {profile.role}
          </div>
        </div>
      </section>

      <section className="mt-6 glass-panel rounded-[30px] p-6">
        <h2 className="text-lg font-semibold text-white">Orders</h2>
        {orders.length > 0 ? (
          <div className="mt-4 space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="rounded-[24px] border border-border p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">#{order.id.slice(0, 8)}</p>
                    <p className="mt-1 text-foreground/60">{statusLabels[order.status]}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white">{formatCurrency(order.totalAmount)}</p>
                    <p className="mt-1 text-foreground/60">{order.etaMinutes} mins ETA</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-foreground/65">No order history loaded yet.</p>
        )}
      </section>
    </main>
  );
}
