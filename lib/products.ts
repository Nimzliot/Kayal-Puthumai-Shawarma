import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Product, ProductCategory } from "@/lib/types";

type ProductRow = {
  id: string;
  tamil_name: string;
  english_name: string;
  description: string;
  image: string;
  category: string;
  price: number | string;
  prep_time: number;
  is_veg: boolean;
  spice_level: "Mild" | "Medium" | "Hot";
  addons: unknown;
  stock_available: boolean;
  enabled: boolean;
};

function isProductCategory(value: string): value is ProductCategory {
  return [
    "Shawarma",
    "Chicken Grill",
    "Burger",
    "Fries",
    "Rolls",
    "Beverages",
    "Combo Meals"
  ].includes(value);
}

export function mapProductRow(row: ProductRow): Product {
  const parsedAddons = Array.isArray(row.addons)
    ? row.addons.filter(
        (addon): addon is { name: string; price: number } =>
          typeof addon === "object" &&
          addon !== null &&
          "name" in addon &&
          "price" in addon &&
          typeof addon.name === "string" &&
          typeof addon.price === "number"
      )
    : [];

  return {
    id: row.id,
    tamilName: row.tamil_name,
    englishName: row.english_name,
    description: row.description,
    image: row.image,
    category: isProductCategory(row.category) ? row.category : "Shawarma",
    price: Number(row.price),
    prepTime: row.prep_time,
    isVeg: row.is_veg,
    spiceLevel: row.spice_level,
    addons: parsedAddons,
    available: row.enabled && row.stock_available,
    enabled: row.enabled,
    stockAvailable: row.stock_available
  };
}

export async function getPublicProducts() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, tamil_name, english_name, description, image, category, price, prep_time, is_veg, spice_level, addons, stock_available, enabled"
    )
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((row) => mapProductRow(row as ProductRow));
}

export async function getAdminProducts() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, tamil_name, english_name, description, image, category, price, prep_time, is_veg, spice_level, addons, stock_available, enabled"
    )
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((row) => mapProductRow(row as ProductRow));
}
