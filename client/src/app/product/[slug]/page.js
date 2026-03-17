import { getProduct } from "@/lib/api";
import { resolveProductImage } from "@/lib/productImage";
import ProductDetailsView from "./ProductDetailsView";

async function getProductBySlug(slug) {
  try {
    const product = await getProduct(slug);
    if (product?.slug || product?.name) {
      return product;
    }
  } catch {}
  return null;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Watch not found",
    };
  }

  return {
    title: `${product.name} | Chronolite`,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [resolveProductImage(product)],
    },
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return (
      <main className="site-frame py-20 text-center">
        <h1 className="text-3xl font-semibold text-[var(--foreground)]">Watch not found</h1>
      </main>
    );
  }

  return <ProductDetailsView product={product} />;
}