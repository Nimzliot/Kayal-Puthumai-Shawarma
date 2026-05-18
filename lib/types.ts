export type Role = "customer" | "admin";

export type ProductCategory =
  | "Shawarma"
  | "Chicken Grill"
  | "Burger"
  | "Fries"
  | "Rolls"
  | "Beverages"
  | "Combo Meals";

export type OrderStatus =
  | "order_placed"
  | "accepted"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "rejected";

export type OrderTimingStatus = "tracking" | "on_time" | "late";

export type OrderOverview = {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string | null;
  status: OrderStatus;
  totalAmount: number;
  subtotalAmount: number;
  deliveryCharge: number;
  tipAmount: number;
  etaMinutes: number;
  etaStartedAt: string;
  timingStatus: OrderTimingStatus;
  deliveryAddress: string;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  tamilName: string;
  englishName: string;
  description: string;
  image: string;
  category: ProductCategory;
  price: number;
  prepTime: number;
  isVeg: boolean;
  spiceLevel: "Mild" | "Medium" | "Hot";
  addons: Array<{ name: string; price: number }>;
  featured?: boolean;
  bestseller?: boolean;
  available?: boolean;
  enabled?: boolean;
  stockAvailable?: boolean;
};

export type Review = {
  id: string;
  author: string;
  rating: number;
  comment: string;
};

export type DeliveryPartner = {
  id: string;
  name: string;
  phone: string;
  active: boolean;
};

export type OrderTimelineStep = {
  key: OrderStatus;
  label: string;
  completed: boolean;
  current: boolean;
};

export type SavedAddress = {
  id: string;
  label: string;
  addressLine: string;
  phone: string | null;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  isDefault: boolean;
};
