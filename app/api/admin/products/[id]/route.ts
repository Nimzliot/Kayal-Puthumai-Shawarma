import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mapProductRow } from "@/lib/products";

const addonSchema = z.object({
  name: z.string().min(1).max(80),
  price: z.number().min(0)
});

const productSchema = z.object({
  tamilName: z.string().min(2).max(120),
  englishName: z.string().min(2).max(120),
  description: z.string().min(8).max(500),
  image: z.string().url(),
  category: z.enum([
    "Shawarma",
    "Chicken Grill",
    "Burger",
    "Fries",
    "Rolls",
    "Beverages",
    "Combo Meals"
  ]),
  price: z.number().min(0),
  prepTime: z.number().int().min(1).max(180),
  isVeg: z.boolean(),
  spiceLevel: z.enum(["Mild", "Medium", "Hot"]),
  addons: z.array(addonSchema),
  stockAvailable: z.boolean(),
  enabled: z.boolean()
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

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if ("error" in adminCheck) {
    return adminCheck.error;
  }

  const parsed = productSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = await context.params;
  const { data, error } = await adminCheck.supabase
    .from("products")
    .update({
      tamil_name: parsed.data.tamilName,
      english_name: parsed.data.englishName,
      description: parsed.data.description,
      image: parsed.data.image,
      category: parsed.data.category,
      price: parsed.data.price,
      prep_time: parsed.data.prepTime,
      is_veg: parsed.data.isVeg,
      spice_level: parsed.data.spiceLevel,
      addons: parsed.data.addons,
      stock_available: parsed.data.stockAvailable,
      enabled: parsed.data.enabled
    })
    .eq("id", id)
    .select(
      "id, tamil_name, english_name, description, image, category, price, prep_time, is_veg, spice_level, addons, stock_available, enabled"
    )
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Unable to update product" }, { status: 500 });
  }

  return NextResponse.json({ success: true, product: mapProductRow(data) });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if ("error" in adminCheck) {
    return adminCheck.error;
  }

  const { id } = await context.params;
  const { error } = await adminCheck.supabase.from("products").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Unable to delete product" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
