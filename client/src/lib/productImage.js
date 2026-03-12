import { ASSET_BASE_URL } from "@/lib/api";

export function resolveImageSrc(src) {
  if (!src) return "";
  return src.startsWith("http") ? src : `${ASSET_BASE_URL}${src}`;
}

export function resolveProductImage(product) {
  const primaryImage =
    Array.isArray(product?.images) && product.images.length
      ? product.images[0]
      : product?.image;
  return resolveImageSrc(primaryImage);
}

export function resolveProductImages(product) {
  const sources =
    Array.isArray(product?.images) && product.images.length
      ? product.images
      : product?.image
      ? [product.image]
      : [];
  return sources.map(resolveImageSrc).filter(Boolean);
}
