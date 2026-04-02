"use client";

import CartItemCard from "./CartItemCard";

export default function CartItemsList({
  cartItems,
  updateCartQuantity,
  removeFromCart,
}) {
  return (
    <div className="space-y-4">
      {cartItems.map((item) => (
        <CartItemCard
          // Use a unique key that accounts for the variant
          key={item.cartId || `${item.id}-${item.selectedVariantName}`}
          item={item}
          updateCartQuantity={updateCartQuantity}
          removeFromCart={removeFromCart}
        />
      ))}
    </div>
  );
}