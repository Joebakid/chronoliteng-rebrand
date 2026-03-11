import BackHomeButton from "@/components/BackHomeButton";
import CartView from "@/components/CartView";

export const metadata = {
  title: "Cart",
};

export default function CartPage() {
  return (
    <main className="site-frame py-10 sm:py-14 lg:py-16">
      <div className="mb-6 flex justify-end">
        <BackHomeButton />
      </div>
      <CartView />
    </main>
  );
}
