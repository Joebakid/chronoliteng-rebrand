import MinimalUI from "@/components/MinimalUI";
import { getProducts } from "@/lib/api";

export default async function Home() {
  let products = [];

  try {
    const liveProducts = await getProducts();
    if (Array.isArray(liveProducts)) {
      products = liveProducts;
    }
  } catch {}

  return (
    <main className="pb-8">
      <MinimalUI products={products} />
    </main>
  );
}
