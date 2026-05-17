import { AuthRequiredCard } from "@/components/auth/auth-required-card";
import { AppShell } from "@/components/app-shell";
import { CheckoutPage } from "@/components/checkout-page";
import { getCurrentUserProfile } from "@/lib/auth";
import { getCurrentUserSavedAddresses } from "@/lib/orders";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const profile = user ? await getCurrentUserProfile() : null;
  const savedAddresses = user ? await getCurrentUserSavedAddresses() : [];

  return (
    <AppShell>
      {user ? <CheckoutPage profile={profile} savedAddresses={savedAddresses} /> : <AuthRequiredCard nextPath="/checkout" />}
    </AppShell>
  );
}
