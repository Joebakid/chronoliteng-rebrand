import MinimalUI from "@/components/MinimalUI";
import { getProducts } from "@/lib/api.server";

export const revalidate = 30;

const PRODUCTS_PER_PAGE = 12;

export default async function Home({ searchParams }) {
  // Next.js 15+ — searchParams is a Promise
  const params = await searchParams;

  let allProducts = [];

  try {
    const liveProducts = await getProducts();
    if (Array.isArray(liveProducts)) {
      allProducts = liveProducts;
    }
  } catch {}

  // All unique categories
  const allCategories = [...new Set(allProducts.map((p) => p.category || "Watches"))];

  // Filter by category
  const selectedCategory = params?.category || null;
  let filtered = selectedCategory
    ? allProducts.filter((p) => (p.category || "Watches") === selectedCategory)
    : allProducts;

  // Search — only match name and collection (brand), not description
  const searchQuery = params?.q?.toLowerCase().trim() || "";
  if (searchQuery) {
    filtered = filtered.filter(
      (p) =>
        p.name?.toLowerCase().includes(searchQuery) ||
        p.collection?.toLowerCase().includes(searchQuery)
    );
  }

  // Paginate
  const currentPage = Number(params?.page) || 1;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PRODUCTS_PER_PAGE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * PRODUCTS_PER_PAGE,
    safePage * PRODUCTS_PER_PAGE
  );

  return (
    <main className="pb-8">
      <MinimalUI
        products={paginated}
        totalPages={totalPages}
        currentPage={safePage}
        categories={allCategories}
        selectedCategory={selectedCategory}
        searchQuery={searchQuery}
        totalFiltered={filtered.length}
      />
    </main>
  );
}