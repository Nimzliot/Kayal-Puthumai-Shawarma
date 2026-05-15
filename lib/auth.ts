import { redirect } from "next/navigation";
import type { Role } from "@/lib/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentUserProfile() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, name, phone, email, role")
    .eq("id", user.id)
    .single();

  return profile;
}

export async function requireAuth(nextPath?: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    const target = nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login";
    redirect(target);
  }

  return user;
}

export async function requireRole(allowedRoles: Role[]) {
  const profile = await getCurrentUserProfile();
  if (!profile || !allowedRoles.includes(profile.role)) {
    redirect("/");
  }
  return profile;
}
