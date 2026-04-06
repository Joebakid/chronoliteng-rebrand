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

  // 1. Setup Filters - default to first category if none selected
  const selectedCategory = params?.category || allCategories[0] || "Watches";
  const selectedBrand = params?.brand || "";
  const searchQuery = params?.q?.toLowerCase().trim() || "";
  const currentPage = Number(params?.page) || 1;

  // 2. Filter by Category FIRST (to get all possible brands for this category)
  const categoryProducts = allProducts.filter(
    (p) => (p.category || "Watches").toLowerCase() === selectedCategory.toLowerCase()
  );

  // 3. Apply Brand & Search filters for the Grid display
  let filtered = categoryProducts;

  if (selectedBrand) {
    filtered = filtered.filter(
      (p) => p.collection?.trim().toUpperCase() === selectedBrand.toUpperCase()
    );
  }

  if (searchQuery) {
    filtered = filtered.filter(
      (p) =>
        p.name?.toLowerCase().includes(searchQuery) ||
        p.collection?.toLowerCase().includes(searchQuery)
    );
  }

  // 4. Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filtered.length / PRODUCTS_PER_PAGE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginated = filtered.slice(
    (safePage - 1) * PRODUCTS_PER_PAGE,
    safePage * PRODUCTS_PER_PAGE
  );

  return (
    <main className="pb-8">
      <MinimalUI
        products={paginated}           // The 12 items to show
        allProducts={categoryProducts} // ALL products in this category (for the Brand list)
        totalPages={totalPages}
        currentPage={safePage}
        categories={allCategories}
        selectedCategory={selectedCategory}
        selectedBrand={selectedBrand}
        searchQuery={searchQuery}
        totalFiltered={filtered.length}
      />
    </main>
  );
}