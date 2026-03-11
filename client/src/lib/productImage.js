import { ASSET_BASE_URL } from "@/lib/api";

export function resolveProductImage(product) {
  if (!product?.image) return "";

  return product.image.startsWith("http")
    ? product.image
    : `${ASSET_BASE_URL}${product.image}`;
}
