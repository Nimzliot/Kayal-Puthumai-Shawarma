import { AuthRequiredCard } from "@/components/auth/auth-required-card";
import { AppShell } from "@/components/app-shell";
import { CheckoutPage } from "@/components/checkout-page";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <AppShell>
      {user ? <CheckoutPage /> : <AuthRequiredCard nextPath="/checkout" />}
    </AppShell>
  );
}
