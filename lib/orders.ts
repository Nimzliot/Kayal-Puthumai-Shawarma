import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { OrderOverview, OrderStatus, SavedAddress } from "@/lib/types";

type OrderRow = {
  id: string;
  user_id: string;
  status: OrderStatus;
  total_amount: number | string;
  subtotal_amount: number | string;
  delivery_charge: number | string;
  tip_amount: number | string;
  eta_minutes: number;
  delivery_address: string;
  gps_latitude: number | string | null;
  gps_longitude: number | string | null;
  eta_started_at: string;
  timing_status: OrderOverview["timingStatus"];
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type UserRow = {
  id: string;
  name: string;
  email: string | null;
};

function mapOrderRow(row: OrderRow, userMap: Map<string, UserRow>): OrderOverview {
  const customer = userMap.get(row.user_id);

  return {
    id: row.id,
    userId: row.user_id,
    customerName: customer?.name ?? "Customer",
    customerEmail: customer?.email ?? null,
    status: row.status,
    totalAmount: Number(row.total_amount),
    subtotalAmount: Number(row.subtotal_amount),
    deliveryCharge: Number(row.delivery_charge),
    tipAmount: Number(row.tip_amount),
    etaMinutes: row.eta_minutes,
    etaStartedAt: row.eta_started_at,
    timingStatus: row.timing_status,
    deliveryAddress: row.delivery_address,
    gpsLatitude: row.gps_latitude === null ? null : Number(row.gps_latitude),
    gpsLongitude: row.gps_longitude === null ? null : Number(row.gps_longitude),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function getUserMap(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, UserRow>();
  }

  const { data } = await supabase
    .from("users")
    .select("id, name, email")
    .in("id", Array.from(new Set(userIds)));

  const rows = (data ?? []) as UserRow[];
  return new Map(rows.map((row) => [row.id, row]));
}

export async function getAdminOrders(limit = 25) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, user_id, status, total_amount, subtotal_amount, delivery_charge, tip_amount, eta_minutes, eta_started_at, timing_status, delivery_address, gps_latitude, gps_longitude, notes, created_at, updated_at"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  const rows = data as OrderRow[];
  const userMap = await getUserMap(supabase, rows.map((row) => row.user_id));
  return rows.map((row) => mapOrderRow(row, userMap));
}

export async function getCurrentUserOrders(limit = 10) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, user_id, status, total_amount, subtotal_amount, delivery_charge, tip_amount, eta_minutes, eta_started_at, timing_status, delivery_address, gps_latitude, gps_longitude, notes, created_at, updated_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  const rows = data as OrderRow[];
  const userMap = await getUserMap(supabase, [user.id]);
  return rows.map((row) => mapOrderRow(row, userMap));
}

export async function getLatestCurrentUserOrder() {
  const orders = await getCurrentUserOrders(1);
  return orders[0] ?? null;
}

export async function getCurrentUserSavedAddresses() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("saved_addresses")
    .select("id, label, address_line, gps_latitude, gps_longitude, is_default")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(
    (row) =>
      ({
        id: row.id,
        label: row.label,
        addressLine: row.address_line,
        gpsLatitude: row.gps_latitude === null ? null : Number(row.gps_latitude),
        gpsLongitude: row.gps_longitude === null ? null : Number(row.gps_longitude),
        isDefault: row.is_default
      }) satisfies SavedAddress
  );
}
