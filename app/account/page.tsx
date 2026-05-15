import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AccountPage } from "@/components/account-page";
import { getCurrentUserProfile } from "@/lib/auth";
import { getCurrentUserOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";

export default async function Page() {
  const profile = await getCurrentUserProfile();
  const orders = await getCurrentUserOrders();

  if (!profile) {
    redirect("/login?next=/account");
  }

  return (
    <AppShell>
      <AccountPage profile={profile} orders={orders} />
    </AppShell>
  );
}
