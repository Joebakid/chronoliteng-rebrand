import { resolveProductImage } from "@/lib/productImage";
import { formatPrice } from "./formatPrice";

export default function CartItemCard({
  item,
  updateCartQuantity,
  removeFromCart,
}) {
  return (
    <article className="grid gap-4 rounded-[1.5rem] bg-[var(--surface-strong)] p-4 shadow-[var(--shadow)] sm:grid-cols-[140px_1fr]">
      <div className="relative aspect-square overflow-hidden rounded-[1rem]">
        <img
          src={resolveProductImage(item)}
          alt={item.name}
          className="h-full w-full object-contain p-4"
        />
      </div>

      <div className="flex flex-col justify-between gap-4">
        <div>
          <p className="text-[0.68rem] uppercase text-[var(--muted)]">
            {item.collection}
          </p>
          <h2 className="text-xl font-semibold">{item.name}</h2>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <button onClick={() => updateCartQuantity(item.slug, item.quantity - 1)}>
              -
            </button>

            <span>{item.quantity}</span>

            <button onClick={() => updateCartQuantity(item.slug, item.quantity + 1)}>
              +
            </button>
          </div>

          <div>
            <p className="font-semibold">
              {formatPrice(item.price * item.quantity)}
            </p>

            <button
              onClick={() => removeFromCart(item.slug)}
              className="text-xs text-[var(--muted)]"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}