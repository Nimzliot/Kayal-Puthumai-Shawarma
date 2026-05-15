import { requireRole } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { getAdminOrders } from "@/lib/orders";
import { getAdminProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireRole(["admin"]);
  const products = await getAdminProducts();
  const orders = await getAdminOrders();

  return (
    <AdminShell>
      <AdminDashboard products={products} initialOrders={orders} />
    </AdminShell>
  );
}
