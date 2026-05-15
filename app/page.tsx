import { AppShell } from "@/components/app-shell";
import { HomePage } from "@/components/home-page";
import { getPublicProducts } from "@/lib/products";

export default async function Page() {
  const products = await getPublicProducts();

  return (
    <AppShell>
      <HomePage products={products} />
    </AppShell>
  );
}
