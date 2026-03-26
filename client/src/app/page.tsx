import MinimalUI from "@/components/MinimalUI";
import { getProducts, getStorefrontCategories } from "@/lib/api.server";

export const revalidate = 30;

const PRODUCTS_PER_PAGE = 12;

export default async function Home({ searchParams }) {
  const params = await searchParams;

  let allProducts = [];
  let allCategories = [];

  try {
    const [liveProducts, liveCategories] = await Promise.all([
      getProducts(),
      getStorefrontCategories(),
    ]);

    if (Array.isArray(liveProducts)) allProducts = liveProducts;
    if (Array.isArray(liveCategories)) allCategories = liveCategories;
  } catch (error) {
    console.error("Data fetch error:", error);
  }

  // 1. Extract Filter Parameters
  const selectedCategory = params?.category || null;
  const selectedBrand = params?.brand || ""; // Added brand param
  const searchQuery = params?.q?.toLowerCase().trim() || "";
  const currentPage = Number(params?.page) || 1;

  // 2. Apply Filtering Logic
  let filtered = allProducts;

  // Filter by Category
  if (selectedCategory) {
    filtered = filtered.filter(
      (p) =>
        (p.category || "Watches").toLowerCase() ===
        selectedCategory.toLowerCase()
    );
  }

  // Filter by Brand (Collection)
  if (selectedBrand) {
    filtered = filtered.filter(
      (p) => p.collection?.toLowerCase() === selectedBrand.toLowerCase()
    );
  }

  // Filter by Search Query
  if (searchQuery) {
    filtered = filtered.filter(
      (p) =>
        p.name?.toLowerCase().includes(searchQuery) ||
        p.collection?.toLowerCase().includes(searchQuery)
    );
  }

  // 3. Pagination Logic
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
        selectedBrand={selectedBrand} // Passed to MinimalUI
        searchQuery={searchQuery}
        totalFiltered={filtered.length}
      />
    </main>
  );
}