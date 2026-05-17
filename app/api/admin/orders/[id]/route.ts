import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStageEtaMinutes } from "@/lib/utils";

const statusSchema = z.object({
  status: z.enum(["accepted", "preparing", "out_for_delivery", "delivered"]).optional(),
  timingDecision: z.enum(["on_time", "late"]).optional()
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

  if (!parsed.data.status && !parsed.data.timingDecision) {
    return NextResponse.json({ error: "Status update or timing decision is required" }, { status: 400 });
  }

  const { id } = await context.params;
  const { data: existingOrder } = await adminCheck.supabase
    .from("orders")
    .select("eta_minutes")
    .eq("id", id)
    .single();

  const nextUpdate: {
    status?: "accepted" | "preparing" | "out_for_delivery" | "delivered";
    eta_minutes?: number;
    eta_started_at?: string;
    timing_status?: "tracking" | "on_time" | "late";
    updated_at: string;
  } = {
    updated_at: new Date().toISOString()
  };

  if (parsed.data.status) {
    nextUpdate.status = parsed.data.status;
    nextUpdate.eta_started_at = new Date().toISOString();
    nextUpdate.timing_status = "tracking";
    nextUpdate.eta_minutes = getStageEtaMinutes(parsed.data.status, existingOrder?.eta_minutes ?? 20);
  }

  if (parsed.data.timingDecision) {
    nextUpdate.timing_status = parsed.data.timingDecision;
    nextUpdate.eta_started_at = new Date().toISOString();
    nextUpdate.eta_minutes =
      parsed.data.timingDecision === "late"
        ? (existingOrder?.eta_minutes ?? 10) + 10
        : Math.max(5, existingOrder?.eta_minutes ?? 5);
  }

  const { data, error } = await adminCheck.supabase
    .from("orders")
    .update(nextUpdate)
    .eq("id", id)
    .select(
      "id, user_id, status, total_amount, subtotal_amount, delivery_charge, tip_amount, eta_minutes, eta_started_at, timing_status, delivery_address, gps_latitude, gps_longitude, notes, created_at, updated_at"
    )
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Unable to update order" }, { status: 500 });
  }

  return NextResponse.json({ success: true, order: data });
}
