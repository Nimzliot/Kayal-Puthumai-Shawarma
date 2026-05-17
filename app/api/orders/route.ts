import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  calculateDeliveryFee,
  calculateDistanceKm,
  calculateOrderPrepTime,
  calculateTravelMinutes,
  shopLocation
} from "@/lib/utils";
import { rateLimitMax, rateLimitWindowMs } from "@/lib/security";

const itemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive()
});

const orderSchema = z.object({
  receiverName: z.string().min(2).max(80),
  phone: z.string().min(8).max(20),
  deliveryAddress: z.string().min(8),
  gpsLatitude: z.number().optional(),
  gpsLongitude: z.number().optional(),
  saveAddress: z.boolean().default(false),
  addressLabel: z.string().min(2).max(40).optional(),
  paymentMethod: z.literal("cash_on_delivery"),
  tipAmount: z.number().min(0).default(0),
  note: z.string().max(500).optional(),
  items: z.array(itemSchema).min(1)
});

const requestLog = new Map<string, number[]>();

function isRateLimited(key: string) {
  const now = Date.now();
  const requests = (requestLog.get(key) ?? []).filter((timestamp) => now - timestamp < rateLimitWindowMs);
  requests.push(now);
  requestLog.set(key, requests);
  return requests.length > rateLimitMax;
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && !origin.includes(host)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const ip = request.headers.get("x-forwarded-for") ?? "local";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const parsed = orderSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const productIds = parsed.data.items.map((item) => item.productId);
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, price, prep_time")
    .in("id", productIds);

  if (productsError || !products || products.length !== productIds.length) {
    return NextResponse.json({ error: "Unable to load products" }, { status: 400 });
  }

  const priceMap = new Map(products.map((product) => [product.id, product]));
  const subtotal = parsed.data.items.reduce((sum, item) => {
    const product = priceMap.get(item.productId);
    return sum + Number(product?.price ?? 0) * item.quantity;
  }, 0);
  const customerLocation = {
    latitude: parsed.data.gpsLatitude ?? shopLocation.latitude,
    longitude: parsed.data.gpsLongitude ?? shopLocation.longitude
  };
  const distanceKm = calculateDistanceKm(shopLocation, customerLocation);
  const deliveryCharge = calculateDeliveryFee(distanceKm);
  const prepTime = calculateOrderPrepTime(
    parsed.data.items.map((item) => ({
      quantity: item.quantity,
      prepTime: priceMap.get(item.productId)?.prep_time ?? 10
    }))
  );
  const travelMinutes = calculateTravelMinutes(distanceKm);
  const etaMinutes = prepTime + travelMinutes;
  const totalAmount = subtotal + deliveryCharge + parsed.data.tipAmount;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      total_amount: totalAmount,
      subtotal_amount: subtotal,
      discount_amount: 0,
      delivery_charge: deliveryCharge,
      payment_method: parsed.data.paymentMethod,
      delivery_address: parsed.data.deliveryAddress,
      gps_latitude: parsed.data.gpsLatitude,
      gps_longitude: parsed.data.gpsLongitude,
      tip_amount: parsed.data.tipAmount,
      eta_started_at: new Date().toISOString(),
      timing_status: "tracking",
      notes: [parsed.data.note, `Receiver: ${parsed.data.receiverName}`, `Phone: ${parsed.data.phone}`]
        .filter(Boolean)
        .join("\n"),
      eta_minutes: etaMinutes
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Unable to create order" }, { status: 500 });
  }

  const orderItems = parsed.data.items.map((item) => {
    const product = priceMap.get(item.productId);
    return {
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: Number(product?.price ?? 0),
      prep_time_snapshot: product?.prep_time ?? 10
    };
  });

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
  if (itemsError) {
    return NextResponse.json({ error: "Unable to save order items" }, { status: 500 });
  }

  if (parsed.data.saveAddress) {
    const { error: addressError } = await supabase.from("saved_addresses").insert({
      user_id: user.id,
      label: parsed.data.addressLabel ?? "Current Location",
      address_line: parsed.data.deliveryAddress,
      gps_latitude: parsed.data.gpsLatitude,
      gps_longitude: parsed.data.gpsLongitude
    });

    if (addressError) {
      return NextResponse.json({ error: "Order created, but address could not be saved" }, { status: 500 });
    }
  }

  return NextResponse.json({
    success: true,
    orderId: order.id,
    etaMinutes,
    prepTime,
    totalAmount,
    deliveryCharge,
    distanceKm
  });
}
