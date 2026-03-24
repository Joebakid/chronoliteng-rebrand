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
          key={item.slug}
          item={item}
          updateCartQuantity={updateCartQuantity}
          removeFromCart={removeFromCart}
        />
      ))}
    </div>
  );
}