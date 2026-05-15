import { AppShell } from "@/components/app-shell";
import { MenuPage } from "@/components/menu-page";
import { getPublicProducts } from "@/lib/products";

export default async function Page() {
  const products = await getPublicProducts();

  return (
    <AppShell>
      <MenuPage products={products} />
    </AppShell>
  );
}
