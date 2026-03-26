import { Suspense } from "react";
import BackHomeButton from "@/components/BackHomeButton";
import CartView from "@/components/cart/CartView";
import PageLoader from "@/components/PageLoader";

export const metadata = {
  title: "Cart | Chronolite",
};

export default function CartPage() {
  return (
    <main className="site-frame py-10 sm:py-14 lg:py-16">
      {/* CRITICAL: Wrap everything that interacts with the URL/Browser state 
        in Suspense. This prevents the 'Missing Suspense with CSR Bailout' 
        error on Vercel.
      */}
      <Suspense fallback={<PageLoader text="Opening your cart..." />}>
        <div className="mb-6 flex justify-end">
          <BackHomeButton />
        </div>
        
        <CartView />
      </Suspense>
    </main>
  );
}