import MinimalUI from "@/components/MinimalUI";
import { getProducts } from "@/lib/api.server";

export const revalidate = 30;

const PRODUCTS_PER_PAGE = 12;

export default async function Home({ searchParams }) {
  let products = [];

  try {
    const liveProducts = await getProducts();
    if (Array.isArray(liveProducts)) {
      // getProducts() in api.server.js already filters inStock + inTransit
      products = liveProducts;
    }
  } catch {}

  const currentPage = Number(searchParams?.page) || 1;
  const totalPages = Math.max(1, Math.ceil(products.length / PRODUCTS_PER_PAGE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginated = products.slice(
    (safePage - 1) * PRODUCTS_PER_PAGE,
    safePage * PRODUCTS_PER_PAGE
  );

  return (
    <main className="pb-8">
      <MinimalUI
        products={paginated}
        totalPages={totalPages}
        currentPage={safePage}
      />
    </main>
  );
}