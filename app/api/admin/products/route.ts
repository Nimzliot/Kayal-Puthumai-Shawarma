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

export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if ("error" in adminCheck) {
    return adminCheck.error;
  }

  const parsed = productSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await adminCheck.supabase
    .from("products")
    .insert({
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
    .select(
      "id, tamil_name, english_name, description, image, category, price, prep_time, is_veg, spice_level, addons, stock_available, enabled"
    )
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Unable to create product" }, { status: 500 });
  }

  return NextResponse.json({ success: true, product: mapProductRow(data) });
}
