export function resolveProductImage(product) {
  if (!product?.image) return "";

  return product.image.startsWith("http")
    ? product.image
    : `http://localhost:5000${product.image}`;
}
