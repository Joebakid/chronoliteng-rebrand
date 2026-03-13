const FALLBACK_IMAGE = "/placeholder-product.png";

/**
 * Resolve a single image source safely
 */
export function resolveImageSrc(src) {
  if (!src || typeof src !== "string") {
    return FALLBACK_IMAGE;
  }

  return src.trim();
}

/**
 * Get primary product image
 */
export function resolveProductImage(product) {
  if (!product) return FALLBACK_IMAGE;

  if (Array.isArray(product.images) && product.images.length > 0) {
    return resolveImageSrc(product.images[0]);
  }

  if (product.image) {
    return resolveImageSrc(product.image);
  }

  return FALLBACK_IMAGE;
}

/**
 * Get all product images
 */
export function resolveProductImages(product) {
  if (!product) return [FALLBACK_IMAGE];

  let sources = [];

  if (Array.isArray(product.images) && product.images.length > 0) {
    sources = product.images;
  } else if (product.image) {
    sources = [product.image];
  }

  const resolved = sources
    .map(resolveImageSrc)
    .filter(Boolean);

  return resolved.length ? resolved : [FALLBACK_IMAGE];
}