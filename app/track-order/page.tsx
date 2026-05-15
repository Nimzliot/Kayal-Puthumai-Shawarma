import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { TrackingPage } from "@/components/tracking-page";
import { getLatestCurrentUserOrder } from "@/lib/orders";
import { getCurrentUserProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Page() {
  const profile = await getCurrentUserProfile();
  const latestOrder = await getLatestCurrentUserOrder();

  if (!profile) {
    redirect("/login?next=/track-order");
  }

  return (
    <AppShell>
      <TrackingPage initialOrder={latestOrder} />
    </AppShell>
  );
}
