import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const statusSchema = z.object({
  status: z.enum(["accepted", "preparing", "out_for_delivery", "delivered"])
});

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { error: NextResponse.json({ error: "Admin access required" }, { status: 403 }) };
  }

  return { supabase };
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if ("error" in adminCheck) {
    return adminCheck.error;
  }

  const parsed = statusSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = await context.params;
  const { data, error } = await adminCheck.supabase
    .from("orders")
    .update({
      status: parsed.data.status,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select(
      "id, user_id, status, total_amount, subtotal_amount, delivery_charge, tip_amount, eta_minutes, delivery_address, notes, created_at, updated_at"
    )
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Unable to update order" }, { status: 500 });
  }

  return NextResponse.json({ success: true, order: data });
}
