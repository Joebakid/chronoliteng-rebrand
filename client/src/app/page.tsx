import MinimalUI from "@/components/MinimalUI";
import { getProducts } from "@/lib/api.server";

export const revalidate = 30;

export default async function Home() {
  let products = [];

  try {
    const liveProducts = await getProducts();
    if (Array.isArray(liveProducts)) {
      products = liveProducts.filter((p) => p.inStock === true);
    }
  } catch {}

  return (
    <main className="pb-8">
      <MinimalUI products={products} />
    </main>
  );
}