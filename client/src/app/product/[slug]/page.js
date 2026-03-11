import AddToCartButton from "@/components/AddToCartButton";
import BackHomeButton from "@/components/BackHomeButton";
import { getProduct } from "@/lib/api";
import { resolveColorSwatch } from "@/lib/colorSwatch";
import { resolveProductImage } from "@/lib/productImage";

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
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [resolveProductImage(product)],
    },
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return (
      <main className="site-frame py-20 text-center">
        <h1 className="text-3xl font-semibold text-[var(--foreground)]">Watch not found</h1>
      </main>
    );
  }

  return (
    <main className="site-frame flex min-h-[calc(100dvh-5.5rem)] flex-col py-4 sm:py-8 lg:py-10">
      <div className="mb-4 flex justify-end sm:mb-6">
        <BackHomeButton />
      </div>

      <div className="grid flex-1 gap-6 rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-4 shadow-[var(--shadow)] md:grid-cols-[1fr_0.95fr] md:p-6">
        <div className="flex rounded-[1.35rem] bg-[var(--card-media)] p-4 sm:p-6">
          <img
            src={resolveProductImage(product)}
            alt={product.name}
            className="mx-auto aspect-square w-full max-w-xl self-center object-contain"
          />
        </div>

        <div className="flex h-full flex-col justify-center">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
            {product.collection || "Chronolite Watch"}
          </p>

          <h1 className="font-display mt-4 text-2xl font-bold tracking-[-0.04em] text-[var(--foreground)] sm:text-4xl">
            {product.name}
          </h1>

          <p className="mt-4 text-sm leading-7 text-[var(--muted)] sm:text-[0.86rem]">
            {product.description}
          </p>

          <div className="mt-6 grid gap-3 border-y border-[var(--border)] py-5 text-[0.74rem] text-[var(--foreground)] sm:grid-cols-2">
            <p>Case Size: <span className="text-[var(--muted)]">{product.caseSize || "40mm case"}</span></p>
            <p>Movement: <span className="text-[var(--muted)]">{product.movement || "Automatic movement"}</span></p>
            <p>Strap: <span className="text-[var(--muted)]">{product.strap || "Premium leather strap"}</span></p>
            <div className="flex flex-wrap items-center gap-2">
              <span>Available Colours:</span>
              <div className="flex items-center gap-2">
                {product.colors?.map((color, index) => (
                  <span
                    key={index}
                    className="h-3 w-3 rounded-full border border-black/10"
                    style={{ backgroundColor: resolveColorSwatch(color) }}
                  />
                ))}
              </div>
            </div>
          </div>

          <p className="mt-6 text-[1.7rem] font-semibold text-[var(--price)] sm:text-[2rem]">
            {new Intl.NumberFormat("en-NG", {
              style: "currency",
              currency: "NGN",
              maximumFractionDigits: 0,
            }).format(product.price)}
          </p>

          <div className="mt-6">
            <AddToCartButton product={product} />
          </div>
        </div>
      </div>
    </main>
  );
}
