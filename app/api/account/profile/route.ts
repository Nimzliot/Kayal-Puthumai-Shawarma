import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().min(8).max(20)
});

export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const parsed = profileSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("users")
    .update({
      name: parsed.data.name.trim(),
      phone: parsed.data.phone.trim()
    })
    .eq("id", user.id)
    .select("id, name, phone, email, role")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Unable to update profile" }, { status: 500 });
  }

  return NextResponse.json({ success: true, profile: data });
}
